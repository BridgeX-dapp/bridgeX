//! Deploys BridgeCore to Casper testnet/mainnet using Odra livenet env.
use odra::host::{Deployer, HostEnv};
use odra::prelude::*;

//use bridge_core::{BridgeCore, BridgeCoreInitArgs};
use bridge_core::bridge_core::{BridgeCore, BridgeCoreInitArgs};


fn main() {
    // 1) Load Casper livenet environment from env vars (.env / casper-test.env etc.)
    let env: HostEnv = odra_casper_livenet_env::env();

    // 2) Deployer = owner of the secret key
    let deployer = env.caller();
    println!("Deployer: {:?}", deployer);

    // 3) Deploy BridgeCore
    let init_args = BridgeCoreInitArgs {
        admin: deployer,
        fee_receiver: deployer,
        fee_bps: 30, // example: 0.30%
    };

    // Optional: set explicit gas for deploy (pattern from docs)
     env.set_gas(500_000_000_000u64);
    


    let bridge = BridgeCore::deploy(&env, init_args);
    println!("BridgeCore package address: {}", bridge.address().to_string());
     //println!("Contract hash: {}", bridge.address());

     
    // 4) (Optional) post-deploy sanity checks using your read-only endpoints
    // println!("Fee params: {:?}", bridge.get_fee_params());
}
