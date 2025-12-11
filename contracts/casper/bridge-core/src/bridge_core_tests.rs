use odra::casper_types::U256;
use odra::prelude::*;

#[cfg(test)]
mod tests {
    use super::{BridgeCore, BridgeCoreInitArgs, Error, LockedCanonical, MintedWrapped};
    use odra::{
        host::{Deployer, HostEnv},
        prelude::*,
    };
    use odra_modules::cep18_token::{Cep18, Cep18InitArgs};

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
    ) -> Cep18 {
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
    fn deploy_bridge_core(env: &HostEnv, admin: Address, fee_receiver: Address, fee_bps: u16) -> BridgeCore {
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
            Err(odra::OdraError::ExecutionError(code))
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
            Err(odra::OdraError::ExecutionError(code))
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
