use odra::prelude::*;
use odra::host::{Deployer, HostEnv};
use std::rc::Rc;
use bridge_core::wrapped_cep18::{
      WrappedToken,
    WrappedTokenInitArgs,
};

use bridge_core::bridge_core::BridgeCoreContractRef;
use odra::ContractRef;
use odra::casper_types::U256;



fn main() {
// 1) Load Casper livenet environment from env vars (.env / casper-test.env etc.)
    let env: HostEnv = odra_casper_livenet_env::env();

    // 2) Deployer = owner of the secret key
    let deployer = env.caller();
    println!("Deployer: {:?}", deployer);

    // 3) Token parameters (CHANGE PER TOKEN)
    let name = "Ether.arb".to_string();
    let symbol = "wETH.arb".to_string();
    let decimals = 18u8;
    let bridge_core_addr = Address::from_str(
    "hash-cc3cf45a1fc7556e2a82194a30fb0d87d9080e18330745f62f8bf83bb8bb2008" // already deployed bridge
).unwrap();
    //let initial_supply = U256::zero(); // always zero for wrapped tokens


    // 4) Init args
    let init_args = WrappedTokenInitArgs {
        symbol,
        name,
        decimals,
        bridge_core : bridge_core_addr,
    };

     // Optional: set explicit gas for deploy (pattern from docs)
      env.set_gas(500_000_000_000u64);
    // 5) Deploy
    let wrapped = WrappedToken::deploy(&env, init_args);

    println!(
        "✅ wUSDC deployed successfully at {:?}",
        wrapped.address().to_string()
    );

}
