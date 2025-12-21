use odra::prelude::*;
use odra::casper_types::U256;
use odra_modules::access::Ownable;
use odra_modules::cep18_token::Cep18;

/// Canonical CEP-18 token (used on SOURCE chain).
///
/// - Standard CEP-18 behavior
/// - Initial supply minted to deployer
/// - Owner can mint more tokens
#[odra::module]
pub struct CanonicalToken {
    /// CEP-18 implementation
    token: SubModule<Cep18>,

    /// Owner (deployer) for admin actions
    ownable: SubModule<Ownable>,
}

#[odra::module]
impl CanonicalToken {
    /// Initialize canonical token
    ///
    /// - `symbol`, `name`, `decimals` – standard metadata
    /// - `initial_supply` – minted to deployer
    pub fn init(
        &mut self,
        symbol: String,
        name: String,
        decimals: u8,
        initial_supply: U256,
    ) {
        let deployer = self.env().caller();

        // Set owner
        self.ownable.init(deployer);

        // Initialize CEP-18 with initial supply
        self.token.init(symbol, name, decimals, initial_supply);

        // Mint initial supply to owner
        self.token.raw_mint(&deployer, &initial_supply);
    }

    // -------- Admin (owner-only) --------

    /// Mint new tokens (testing, governance, etc.)
    pub fn mint(&mut self, recipient: &Address, amount: &U256) {
        let caller = self.env().caller();
        self.ownable.assert_owner(&caller);

        self.token.raw_mint(recipient, amount);
    }

    /// Burn tokens from an address
    pub fn burn(&mut self, owner: &Address, amount: &U256) {
        let caller = self.env().caller();
        self.ownable.assert_owner(&caller);

        self.token.raw_burn(owner, amount);
    }

    // -------- CEP-18 standard API --------

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
