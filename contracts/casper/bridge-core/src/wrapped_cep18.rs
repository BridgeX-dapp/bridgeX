use odra::prelude::*;
use odra::casper_types::U256;
use odra_modules::access::Ownable;
use odra_modules::cep18_token::Cep18;

/// Custom errors for the wrapped token.
#[odra::odra_error]
pub enum WrappedTokenError {
    BridgeNotSet = 1,
    CallerNotBridge = 2,
}

/// Wrapped CEP-18 token used by BridgeX.
/// - Uses odra_modules::cep18_token::Cep18 under the hood (full CEP-18).
/// - Only the configured `bridge_core` address can mint/burn.
#[odra::module(errors = WrappedTokenError)]
pub struct WrappedToken {
    /// Internal CEP-18 implementation.
    token: SubModule<Cep18>,

    /// Simple owner for admin functions (e.g. updating bridge address).
    ownable: SubModule<Ownable>,

    /// The only address allowed to mint/burn: your BridgeCore contract.
    bridge_core: Var<Address>,
}

#[odra::module]
impl WrappedToken {
    /// Initialize a new wrapped token.
    ///
    /// - `symbol`, `name`, `decimals` – standard CEP-18 metadata.
    /// - `bridge_core` – address of the BridgeCore contract that can mint/burn.
    pub fn init(
        &mut self,
        symbol: String,
        name: String,
        decimals: u8,
        bridge_core: Address,
    ) {
        let deployer = self.env().caller();

        // Set the admin/owner (can later change bridge_core, etc.).
        self.ownable.init(deployer);

        // Configure which contract is allowed to mint/burn.
        self.bridge_core.set(bridge_core);

        // Start with zero supply – all supply will be minted by the bridge.
        self.token.init(symbol, name, decimals, U256::zero());
    }

    /// Internal helper: read bridge_core or revert if not set.
    fn bridge_address(&self) -> Address {
        self.bridge_core
            .get_or_revert_with(WrappedTokenError::BridgeNotSet)
    }

    /// Internal helper: ensure the caller *is* bridge_core.
    fn assert_bridge(&self) {
        let caller = self.env().caller();
        let bridge = self.bridge_address();

        if caller != bridge {
            self.env().revert(WrappedTokenError::CallerNotBridge);
        }
    }

    // -------- Bridge-only entrypoints (used by BridgeCore) --------

    /// Mint wrapped tokens when assets are locked on the other chain.
    ///
    /// Callable only by BridgeCore.
    pub fn mint_for_bridge(&mut self, recipient: &Address, amount: &U256) {
        self.assert_bridge();
        self.token.raw_mint(recipient, amount);
    }

    /// Burn wrapped tokens before releasing/unlocking on the other chain.
    ///
    /// Callable only by BridgeCore.
    pub fn burn_for_bridge(&mut self, owner: &Address, amount: &U256) {
        self.assert_bridge();
        self.token.raw_burn(owner, amount);
    }

    // -------- Admin entrypoints (for you / governance) --------

    /// Change which contract is considered the bridge.
    ///
    /// Callable only by the module owner (set in `init` via Ownable).
    pub fn set_bridge_core(&mut self, new_bridge: &Address) {
        let caller = self.env().caller();
        self.ownable.assert_owner(&caller);
        self.bridge_core.set(*new_bridge);
    }

    /// Read the current bridge_core address.
    pub fn get_bridge_core(&self) -> Address {
        self.bridge_address()
    }

    // -------- User-facing CEP-18 API (delegated) --------
    //
    // These are normal token functions that wallets/dApps will call.
    // Under the hood they use the Cep18 module from odra_modules.

    delegate! {
        to self.token {
            fn name(&self) -> String;
            fn symbol(&self) -> String;
            fn decimals(&self) -> u8;
            fn total_supply(&self) -> U256;
            fn balance_of(&self, address: &Address) -> U256;
            fn allowance(&self, owner: &Address, spender: &Address) -> U256;
            fn approve(&mut self, spender: &Address, amount: &U256);
            fn decrease_allowance(&mut self, spender: &Address, decr_by: &U256);
            fn increase_allowance(&mut self, spender: &Address, inc_by: &U256);
            fn transfer(&mut self, recipient: &Address, amount: &U256);
            fn transfer_from(&mut self, owner: &Address, recipient: &Address, amount: &U256);
        }
    }
}
