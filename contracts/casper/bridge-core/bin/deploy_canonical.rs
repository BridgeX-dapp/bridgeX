use odra::prelude::*;
use odra::host::HostEnv;
use odra::casper_types::U256;
use odra::host::Deployer;
// adjust path if needed
use bridge_core::canonical_cep18::{
    CanonicalToken,
    CanonicalTokenInitArgs,
};

fn main() {
    // ------------------------------------------------------------
    // 1) Load Casper livenet env (casper-test.env)
    // ------------------------------------------------------------
    let env: HostEnv = odra_casper_livenet_env::env();

    // ------------------------------------------------------------
    // 2) Deployer / owner account
    // ------------------------------------------------------------
    let deployer = env.get_account(0);
    env.set_caller(deployer);

    println!("Deployer: {:?}", deployer);

    // ------------------------------------------------------------
    // 3) Canonical token params
    // ------------------------------------------------------------
    let name = "USD Coin.cspr".to_string();
    let symbol = "USDC.cspr".to_string();
    let decimals = 6u8;

    // 1,000,000 USDC (with 6 decimals)
    let initial_supply = U256::from(1_000_000u64)
        * U256::from(10u64).pow(U256::from(decimals));

    // ------------------------------------------------------------
    // 4) Gas (keep reasonable, not insane)
    // ------------------------------------------------------------
   env.set_gas(500_000_000_000u64);

    // ------------------------------------------------------------
    // 5) Deploy CanonicalToken
    // ------------------------------------------------------------
    let token = CanonicalToken::deploy(
        &env,
        CanonicalTokenInitArgs {
            symbol,
            name,
            decimals,
            initial_supply,
        },
    );

    // ------------------------------------------------------------
    // 6) Output IMPORTANT addresses
    // ------------------------------------------------------------
    println!(
        "✅ CanonicalToken deployed successfully at: {:?}",
        token.address().to_string()
    );

    println!(
        "📦 Use THIS package hash when whitelisting in BridgeCore"
    );
}
