use odra::prelude::*;
use odra::casper_types::U256;
use odra_modules::access::{AccessControl, Role, DEFAULT_ADMIN_ROLE};
use odra_modules::security::Pauseable;
use odra::ContractRef;
/// External interface to a CEP-18 token.
/// You can tweak names if your CEP-18 impl uses slightly different entrypoints.
#[odra::external_contract]
pub trait Cep18 {
    fn transfer_from(&mut self, owner: &Address, recipient: &Address, amount: &U256);
    fn transfer(&mut self, recipient: &Address, amount: &U256);
    fn mint(&mut self, recipient: &Address, amount: &U256);
    fn burn(&mut self, owner: &Address, amount: &U256);
}

/// Per-token configuration (whitelisting, limits, canonical/wrapped flag).
#[odra::odra_type]
pub struct TokenConfig {
    pub is_whitelisted: bool,
    pub is_canonical: bool, // true = canonical here, false = wrapped here
    pub min_amount: U256,
    pub max_amount: U256,
}

/// Bridge-specific errors.
#[odra::odra_error]
pub enum Error {
    TokenNotWhitelisted = 10_000,
    AmountTooSmall      = 10_001,
    AmountTooLarge      = 10_002,
    TokenNotCanonical   = 10_003,
    TokenNotWrapped     = 10_004,
    FeeTooHigh          = 10_005,
    FeeReceiverNotSet   = 10_006,
    EventAlreadyHandled = 10_007,
}

/// Outgoing lock on a canonical token (Casper as source chain).
#[odra::event]
pub struct LockedCanonical {
    pub token: Address,
    pub sender: Address,
    pub recipient: Address,
    pub amount: U256,
    pub fee: U256,
    pub destination_chain: String,
    pub nonce: u64,
}

/// Outgoing burn on a wrapped token (Casper as source chain).
#[odra::event]
pub struct BurnedWrapped {
    pub token: Address,
    pub sender: Address,
    pub recipient: Address,
    pub amount: U256,
    pub fee: U256,
    pub destination_chain: String,
    pub nonce: u64,
}

/// Incoming mint of wrapped tokens (Casper as destination chain).
#[odra::event]
pub struct MintedWrapped {
    pub token: Address,
    pub recipient: Address,
    pub amount: U256,
    pub source_chain: String,
    pub event_id: [u8; 32],
}

/// Incoming unlock of canonical tokens (Casper as destination chain).
#[odra::event]
pub struct UnlockedCanonical {
    pub token: Address,
    pub recipient: Address,
    pub amount: U256,
    pub source_chain: String,
    pub event_id: [u8; 32],
}

#[odra::event]
pub struct TokenConfigUpdated {
    pub token: Address,
    pub config: TokenConfig,
}

#[odra::event]
pub struct FeeParamsUpdated {
    pub old_fee_bps: u32,
    pub new_fee_bps: u32,
}

#[odra::event]
pub struct FeeReceiverUpdated {
    pub old_receiver: Address,
    pub new_receiver: Address,
}

/// Role constants (simple numeric tags – doesn’t need to be human-readable).
pub const RELAYER_ROLE: Role = [1u8; 32];
pub const PAUSER_ROLE: Role  = [2u8; 32];

/// BridgeCore: main Casper-side bridge logic.
///
/// - Uses AccessControl for roles (admin / relayer / pauser).
/// - Uses Pausable to globally pause bridge operations.
/// - Stores per-token config and processed event IDs (replay protection).
#[odra::module(
    events = [
        LockedCanonical,
        BurnedWrapped,
        MintedWrapped,
        UnlockedCanonical,
        TokenConfigUpdated,
        FeeParamsUpdated,
        FeeReceiverUpdated
    ],
    errors = Error
)]
pub struct BridgeCore {
    // Security / roles
    access: SubModule<AccessControl>,
    pause: SubModule<Pauseable>,

    // token -> config
    token_config: Mapping<Address, TokenConfig>,

    // event_id -> processed
    processed_events: Mapping<[u8; 32], bool>,

    // 0–10000 (basis points)
    fee_bps: Var<u32>,
    fee_receiver: Var<Address>,

    // Outgoing nonce (used in events for off-chain correlation)
    nonce: Var<u64>,
}

#[odra::module]
impl BridgeCore {
    /// One-time initializer.
    ///
    /// `admin` becomes:
    ///  - DEFAULT_ADMIN_ROLE
    ///  - RELAYER_ROLE
    ///  - PAUSER_ROLE
    pub fn init(&mut self, admin: Address, fee_receiver: Address, fee_bps: u32) {
        if fee_bps > 10_000 {
            self.env().revert(Error::FeeTooHigh);
        }

        // Grant admin role
        self.access
            .unchecked_grant_role(&DEFAULT_ADMIN_ROLE, &admin);

        // Configure role admin relationships
        self.access
            .set_admin_role(&RELAYER_ROLE, &DEFAULT_ADMIN_ROLE);
        self.access
            .set_admin_role(&PAUSER_ROLE, &DEFAULT_ADMIN_ROLE);

        // Give initial roles to admin
        self.access.unchecked_grant_role(&RELAYER_ROLE, &admin);
        self.access.unchecked_grant_role(&PAUSER_ROLE, &admin);

        self.fee_receiver.set(fee_receiver);
        self.fee_bps.set(fee_bps);
        self.nonce.set(0);
    }

    // ========= USER-FACING BRIDGE FLOWS (Casper as SOURCE) =========

    /// Lock canonical CEP-18 tokens on Casper and emit `LockedCanonical`.
    ///
    /// Off-chain relayer will:
    ///  - read this event,
    ///  - compute cross-chain eventId,
    ///  - mint/unlock on the destination chain.
    pub fn lock_canonical(
        &mut self,
        token: Address,
        amount: &U256,
        destination_chain: String,
        recipient: Address
    ) {
        self.pause.require_not_paused();

        let caller = self.env().caller();
        let cfg = self.get_config_or_revert(&token);

        if !cfg.is_whitelisted {
            self.env().revert(Error::TokenNotWhitelisted);
        }
        if !cfg.is_canonical {
            self.env().revert(Error::TokenNotCanonical);
        }

        self.validate_amount(&cfg, amount);

        let fee_receiver = self.fee_receiver.get_or_revert_with(Error::FeeReceiverNotSet);
        let fee_bps = self.fee_bps.get_or_default();
        let fee = self.compute_fee(amount, fee_bps);
        let net_amount = amount.checked_sub(fee).unwrap_or_else(|| U256::zero());

        // Pull tokens from user into bridge contract.
        let mut token_ref = Cep18ContractRef::new(self.env(), token);
        // Get bridge's own address
        let bridge_addr = self.env().self_address();
        token_ref.transfer_from(&caller, &bridge_addr, amount);

        // If you want fees in-kind, send fee to `fee_receiver` and keep net locked,
        // OR keep everything in contract and move fee out later.
        if fee > U256::zero() {
            token_ref.transfer(&fee_receiver, &fee);
        }

        let nonce = self.next_nonce();

        self.env().emit_event(LockedCanonical {
            token,
            sender: caller,
            recipient,
            amount: net_amount,
            fee,
            destination_chain,
            nonce,
        });
    }

    /// Burn wrapped tokens (Casper is SOURCE side for wrapped asset).
    pub fn burn_wrapped(
        &mut self,
        token: Address,
        amount: &U256,
        destination_chain: String,
        recipient: Address
    ) {
        self.pause.require_not_paused();

        let caller = self.env().caller();
        let cfg = self.get_config_or_revert(&token);

        if !cfg.is_whitelisted {
            self.env().revert(Error::TokenNotWhitelisted);
        }
        if cfg.is_canonical {
            self.env().revert(Error::TokenNotWrapped);
        }

        self.validate_amount(&cfg, amount);

        let fee_receiver = self.fee_receiver.get_or_revert_with(Error::FeeReceiverNotSet);
        let fee_bps = self.fee_bps.get_or_default();
        let fee = self.compute_fee(amount, fee_bps);
        let net_amount = amount.checked_sub(fee).unwrap_or_else(|| U256::zero());

        let mut token_ref = Cep18ContractRef::new(self.env(), token);

        // Burn full amount from caller.
        token_ref.burn(&caller, amount);

        // Optional: if you want relayer fee in wrapped token, mint to fee_receiver.
        // For now, we assume fee is taken on destination chain (can be adjusted).
        // token_ref.mint(&fee_receiver, &fee);

        let nonce = self.next_nonce();

        self.env().emit_event(BurnedWrapped {
            token,
            sender: caller,
            recipient,
            amount: net_amount,
            fee,
            destination_chain,
            nonce,
        });
    }

    // ========= RELAYER-ONLY FLOWS (Casper as DESTINATION) =========

    /// Mint wrapped tokens on Casper when this chain is DESTINATION.
    ///
    /// Called by RELAYER_ROLE, using `event_id` from the source chain.
    pub fn mint_wrapped(
        &mut self,
        token: Address,
        recipient: Address,
        amount: &U256,
        source_chain: String,
        event_id: [u8; 32]
    ) {
        self.pause.require_not_paused();
        self.require_relayer();

        self.ensure_event_not_processed(&event_id);

        let cfg = self.get_config_or_revert(&token);
        if !cfg.is_whitelisted {
            self.env().revert(Error::TokenNotWhitelisted);
        }
        if cfg.is_canonical {
            self.env().revert(Error::TokenNotWrapped);
        }

        self.validate_amount(&cfg, amount);

        let mut token_ref = Cep18ContractRef::new(self.env(), token);
        token_ref.mint(&recipient, amount);

        self.mark_event_processed(&event_id);

        self.env().emit_event(MintedWrapped {
            token,
            recipient,
            amount: *amount,
            source_chain,
            event_id,
        });
    }

    /// Unlock canonical tokens on Casper when this chain is DESTINATION.
    ///
    /// Called by RELAYER_ROLE after burn/lock on another chain.
    pub fn unlock_canonical(
        &mut self,
        token: Address,
        recipient: Address,
        amount: &U256,
        source_chain: String,
        event_id: [u8; 32]
    ) {
        self.pause.require_not_paused();
        self.require_relayer();

        self.ensure_event_not_processed(&event_id);

        let cfg = self.get_config_or_revert(&token);
        if !cfg.is_whitelisted {
            self.env().revert(Error::TokenNotWhitelisted);
        }
        if !cfg.is_canonical {
            self.env().revert(Error::TokenNotCanonical);
        }

        self.validate_amount(&cfg, amount);

        let mut token_ref = Cep18ContractRef::new(self.env(), token);

        // Bridge holds canonical tokens in its own balance.
        token_ref.transfer(&recipient, amount);

        self.mark_event_processed(&event_id);

        self.env().emit_event(UnlockedCanonical {
            token,
            recipient,
            amount: *amount,
            source_chain,
            event_id,
        });
    }

    // ========= ADMIN / CONFIG =========

    /// Update token config (whitelist, canonical flag, min/max).
    ///
    /// Only DEFAULT_ADMIN_ROLE can call this.
    pub fn set_token_config(
        &mut self,
        token: Address,
        is_whitelisted: bool,
        is_canonical: bool,
        min_amount: U256,
        max_amount: U256
    ) {
        self.require_admin();

        let config = TokenConfig {
            is_whitelisted,
            is_canonical,
            min_amount,
            max_amount,
        };
        self.token_config.set(&token, config.clone());

        self.env().emit_event(TokenConfigUpdated {
            token,
            config,
        });
    }

    pub fn set_fee_bps(&mut self, new_fee_bps: u32) {
        self.require_admin();
        if new_fee_bps > 10_000 {
            self.env().revert(Error::FeeTooHigh);
        }
        let old = self.fee_bps.get_or_default();
        self.fee_bps.set(new_fee_bps);

        self.env().emit_event(FeeParamsUpdated {
            old_fee_bps: old,
            new_fee_bps: new_fee_bps,
        });
    }

    pub fn set_fee_receiver(&mut self, new_receiver: Address) {
        self.require_admin();
        let old = self.fee_receiver.get_or_revert_with(Error::FeeReceiverNotSet);
        self.fee_receiver.set(new_receiver);

        self.env().emit_event(FeeReceiverUpdated {
            old_receiver: old,
            new_receiver,
        });
    }

    /// Grant relayer role to an address.
    pub fn grant_relayer(&mut self, relayer: Address) {
        self.require_admin();
        self.access.unchecked_grant_role(&RELAYER_ROLE, &relayer);
    }

    /// Revoke relayer role.
    pub fn revoke_relayer(&mut self, relayer: Address) {
        self.require_admin();
        self.access.unchecked_revoke_role(&RELAYER_ROLE, &relayer);
    }

    /// Pause all bridge operations (except admin ops).
    pub fn pause(&mut self) {
        self.require_pauser();
        self.pause.pause();
    }

    /// Unpause bridge operations.
    pub fn unpause(&mut self) {
        self.require_pauser();
        self.pause.unpause();
    }

    // ========= INTERNAL HELPERS =========

    fn next_nonce(&mut self) -> u64 {
        let current = self.nonce.get_or_default();
        let next = current + 1;
        self.nonce.set(next);
        next
    }

    fn compute_fee(&self, amount: &U256, fee_bps: u32) -> U256 {
        if fee_bps == 0 {
            return U256::zero();
        }
        let fbps = U256::from(fee_bps as u64);
        let denom = U256::from(10_000u64);
        (amount * fbps) / denom
    }

    fn get_config_or_revert(&self, token: &Address) -> TokenConfig {
        self.token_config
            .get(token)
            .unwrap_or_else(|| {
                self.env().revert(Error::TokenNotWhitelisted)
            })
    }

    fn validate_amount(&self, cfg: &TokenConfig, amount: &U256) {
        if cfg.min_amount > U256::zero() && amount < &cfg.min_amount {
            self.env().revert(Error::AmountTooSmall);
        }
        if cfg.max_amount > U256::zero() && amount > &cfg.max_amount {
            self.env().revert(Error::AmountTooLarge);
        }
    }

    fn ensure_event_not_processed(&self, event_id: &[u8; 32]) {
        if self.processed_events.get(event_id).unwrap_or(false) {
            self.env().revert(Error::EventAlreadyHandled);
        }
    }

    fn mark_event_processed(&mut self, event_id: &[u8; 32]) {
        self.processed_events.set(event_id, true);
    }

    fn require_admin(&self) {
        let caller = self.env().caller();
        self.access.check_role(&DEFAULT_ADMIN_ROLE, &caller);
    }

    fn require_relayer(&self) {
        let caller = self.env().caller();
        self.access.check_role(&RELAYER_ROLE, &caller);
    }

    fn require_pauser(&self) {
        let caller = self.env().caller();
        self.access.check_role(&PAUSER_ROLE, &caller);
    }
}







/*RUNNING BRIDGECORE TESTS */

#[cfg(test)]
mod tests {
    use super::{BridgeCore, BridgeCoreInitArgs, Error, LockedCanonical, MintedWrapped, BridgeCoreHostRef};
    use odra::{
        host::{Deployer, HostEnv},
        prelude::*,
    };
    use crate::bridge_core::U256;
    use odra_modules::cep18_token::{Cep18,  Cep18HostRef, Cep18InitArgs};
    use odra::prelude::{OdraError, ExecutionError};
 

    /// Helper: create a fresh HostEnv.
    fn env() -> HostEnv {
        odra_test::env()
    }

    /// Helper: deploy a CEP-18 token with initial supply to `holder`.
    fn deploy_canonical_token(
        env: &HostEnv,
        holder: Address,
        symbol: &str,
        name: &str,
        decimals: u8,
        initial_supply: u64,
    ) -> Cep18HostRef {
        env.set_caller(holder);
        Cep18::deploy(
            env,
            Cep18InitArgs {
                symbol: symbol.to_string(),
                name: name.to_string(),
                decimals,
                initial_supply: U256::from(initial_supply),
            },
        )
    }

    /// Helper: deploy BridgeCore with admin + fee_receiver accounts.
    fn deploy_bridge_core(env: &HostEnv, admin: Address, fee_receiver: Address, fee_bps: u32) -> BridgeCoreHostRef {
        env.set_caller(admin);
        BridgeCore::deploy(
            env,
            BridgeCoreInitArgs {
                admin,
                fee_receiver,
                fee_bps,
            },
        )
    }

    /// Helper: convenience for whitelisting a token as canonical.
    fn whitelist_canonical(
        env: &HostEnv,
        bridge: &mut BridgeCoreHostRef,
        admin: Address,
        token_addr: Address,
        min: u64,
        max: u64,
    ) {
        env.set_caller(admin);
        bridge.set_token_config(
            token_addr,
            true,   // is_whitelisted
            true,   // is_canonical
            U256::from(min),
            U256::from(max),
        );
    }

    /// Helper: convenience for whitelisting a token as wrapped.
    fn whitelist_wrapped(
        env: &HostEnv,
        bridge: &mut BridgeCore,
        admin: Address,
        token_addr: Address,
        min: u64,
        max: u64,
    ) {
        env.set_caller(admin);
        bridge.set_token_config(
            token_addr,
            true,   // is_whitelisted
            false,  // is_canonical
            U256::from(min),
            U256::from(max),
        );
    }

    // ------------------------------------------------------------------------
    // TEST 1: Lock canonical token (happy path)
    // ------------------------------------------------------------------------
    #[test]
    fn lock_canonical_happy_path() {
        let env = env();

        // Accounts: admin, fee_receiver, user, recipient
        let admin = env.get_account(0);
        let fee_receiver = env.get_account(1);
        let user = env.get_account(2);
        let recipient = env.get_account(3);

        // Deploy canonical token; give initial_supply to `user`.
        let initial_supply = 1_000u64;
        let mut canonical = deploy_canonical_token(
            &env,
            user,
            "CAN",
            "Canonical Token",
            18,
            initial_supply,
        );

        // Deploy bridge
        let mut bridge = deploy_bridge_core(&env, admin, fee_receiver, 100 /* 1% fee */);

        // Whitelist canonical token
        whitelist_canonical(&env, &mut bridge, admin, canonical.address(), 1, 1_000_000);

        // User approves bridge to spend canonical tokens
        let amount_to_lock = U256::from(500u64);
        env.set_caller(user);
        canonical.approve(&bridge.address(), &amount_to_lock);

        // Call lock_canonical
        let dest_chain = "Ethereum".to_string();
        env.set_caller(user);
        bridge.lock_canonical(
            canonical.address(),
            &amount_to_lock,
            dest_chain.clone(),
            recipient,
        );

        // 1% of 500 = 5
        let expected_fee = U256::from(5u64);
        let expected_net = amount_to_lock - expected_fee;

        // Check balances:
        // - user balance decreased by 500
        // - bridge holds 500 - 5 (net locked) if you didn't transfer fee out,
        //   or holds 500 if fee is transferred to fee_receiver directly.
        let user_balance = canonical.balance_of(&user);
        let bridge_balance = canonical.balance_of(&bridge.address());
        let fee_receiver_balance = canonical.balance_of(&fee_receiver);

        assert_eq!(
            user_balance,
            U256::from(initial_supply) - amount_to_lock,
            "user balance must decrease by locked amount"
        );

        // In our earlier logic, we transferred fee immediately to fee_receiver,
        // so bridge only holds the net amount and fee_receiver gets 5.
        assert_eq!(
            bridge_balance,
            expected_net,
            "bridge must hold net amount after fee"
        );
        assert_eq!(
            fee_receiver_balance,
            expected_fee,
            "fee_receiver must receive 1% fee"
        );

        // Check that LockedCanonical was emitted.
        let expected_event = LockedCanonical {
            token: canonical.address(),
            sender: user,
            recipient,
            amount: expected_net,
            fee: expected_fee,
            destination_chain: dest_chain,
            // nonce is auto-incremented, first call should be 1
            nonce: 1,
        };

        assert!(
            env.emitted_event(&bridge.address(), expected_event),
            "LockedCanonical event must be emitted"
        );
    }

    // ------------------------------------------------------------------------
    // TEST 2: lock_canonical should revert if token is not whitelisted
    // ------------------------------------------------------------------------
    #[test]
    fn lock_canonical_reverts_for_unwhitelisted_token() {
        let env = env();
        let admin = env.get_account(0);
        let fee_receiver = env.get_account(1);
        let user = env.get_account(2);

        // Deploy canonical token but DO NOT whitelist it
        let mut canonical = deploy_canonical_token(
            &env,
            user,
            "CAN",
            "Canonical Token",
            18,
            1_000,
        );

        let mut bridge = deploy_bridge_core(&env, admin, fee_receiver, 0);

        let amount = U256::from(100u64);
        env.set_caller(user);
        canonical.approve(&bridge.address(), &amount);

        env.set_caller(user);
        let result = bridge.lock_canonical(
            canonical.address(),
            &amount,
            "Ethereum".to_string(),
            env.get_account(3),
        );

        // Expect Error::TokenNotWhitelisted
        assert!(matches!(
            result,
            //Err(ExecutionError::ErrorCode(code))
             Err(OdraError::ExecutionError(code))
                if code == Error::TokenNotWhitelisted as u16
        ));
    }

    // ------------------------------------------------------------------------
    // TEST 3: mint_wrapped works only for RELAYER_ROLE
    // ------------------------------------------------------------------------
    #[test]
    fn mint_wrapped_only_relayer_can_call() {
        let env = env();

        let admin = env.get_account(0);
        let fee_receiver = env.get_account(1);
        let user = env.get_account(2);
        let non_relayer = env.get_account(3);

        let mut bridge = deploy_bridge_core(&env, admin, fee_receiver, 0);

        // Deploy a CEP-18 token that we treat as "wrapped" in this test.
        let mut wrapped = deploy_canonical_token(
            &env,
            admin,
            "wUSDC",
            "Wrapped USDC",
            6,
            0,
        );

        // Mark it as WRAPPED (is_canonical = false)
        whitelist_wrapped(
            &env,
            &mut bridge,
            admin,
            wrapped.address(),
            1,        // min
            1_000_000 // max
        );

        let amount = U256::from(200u64);
        let event_id = [7u8; 32];

        // 1) Non-relayer tries to call mint_wrapped -> must revert
        env.set_caller(non_relayer);
        let result = bridge.mint_wrapped(
            wrapped.address(),
            user,
            &amount,
            "Ethereum".to_string(),
            event_id,
        );

        assert!(
            result.is_err(),
            "mint_wrapped must fail when called by non-relayer"
        );

        // 2) Admin is RELAYER_ROLE by default in init, so this should succeed
        env.set_caller(admin);
        bridge
            .mint_wrapped(
                wrapped.address(),
                user,
                &amount,
                "Ethereum".to_string(),
                event_id,
            )
            .unwrap();

        // User balance must now be 200
        let user_balance = wrapped.balance_of(&user);
        assert_eq!(user_balance, amount);

        // Check MintedWrapped event was emitted
        let expected_event = MintedWrapped {
            token: wrapped.address(),
            recipient: user,
            amount,
            source_chain: "Ethereum".to_string(),
            event_id,
        };

        assert!(
            env.emitted_event(&bridge.address(), expected_event),
            "MintedWrapped event must be emitted by bridge"
        );
    }

    // ------------------------------------------------------------------------
    // TEST 4: mint_wrapped cannot be called twice with same event_id
    // ------------------------------------------------------------------------
    #[test]
    fn mint_wrapped_replay_protection() {
        let env = env();

        let admin = env.get_account(0);
        let fee_receiver = env.get_account(1);
        let user = env.get_account(2);

        let mut bridge = deploy_bridge_core(&env, admin, fee_receiver, 0);

        let mut wrapped = deploy_canonical_token(
            &env,
            admin,
            "wUSDC",
            "Wrapped USDC",
            6,
            0,
        );

        whitelist_wrapped(
            &env,
            &mut bridge,
            admin,
            wrapped.address(),
            1,
            1_000_000,
        );

        let amount = U256::from(100u64);
        let event_id = [9u8; 32];

        // First call by relayer (admin) should succeed
        env.set_caller(admin);
        bridge
            .mint_wrapped(
                wrapped.address(),
                user,
                &amount,
                "Ethereum".to_string(),
                event_id,
            )
            .unwrap();

        // Second call with same event_id should revert with Error::EventAlreadyHandled
        let result = bridge.mint_wrapped(
            wrapped.address(),
            user,
            &amount,
            "Ethereum".to_string(),
            event_id,
        );

        assert!(matches!(
            result,
            Err(OdraError::ExecutionError(code))
                if code == Error::EventAlreadyHandled as u16
        ));
    }

    // ------------------------------------------------------------------------
    // TEST 5: pause/unpause affects user flows
    // ------------------------------------------------------------------------
    #[test]
    fn pause_blocks_bridge_operations() {
        let env = env();

        let admin = env.get_account(0);
        let fee_receiver = env.get_account(1);
        let user = env.get_account(2);

        let mut bridge = deploy_bridge_core(&env, admin, fee_receiver, 0);

        let mut canonical = deploy_canonical_token(
            &env,
            user,
            "CAN",
            "Canonical Token",
            18,
            1_000,
        );

        whitelist_canonical(
            &env,
            &mut bridge,
            admin,
            canonical.address(),
            1,
            1_000_000,
        );

        let amount = U256::from(100u64);
        env.set_caller(user);
        canonical.approve(&bridge.address(), &amount);

        // Pause bridge
        env.set_caller(admin);
        bridge.pause().unwrap();

        // Now user call must revert because contract is paused
        env.set_caller(user);
        let result = bridge.lock_canonical(
            canonical.address(),
            &amount,
            "Ethereum".to_string(),
            env.get_account(3),
        );

        assert!(
            result.is_err(),
            "lock_canonical must revert when bridge is paused"
        );

        // Unpause and try again
        env.set_caller(admin);
        bridge.unpause().unwrap();

        env.set_caller(user);
        let result_ok = bridge.lock_canonical(
            canonical.address(),
            &amount,
            "Ethereum".to_string(),
            env.get_account(3),
        );

        assert!(
            result_ok.is_ok(),
            "lock_canonical should succeed after unpause"
        );
    }
}
