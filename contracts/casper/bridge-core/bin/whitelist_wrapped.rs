use std::str::FromStr;

use odra::casper_types::U256;
use odra::host::{HostEnv, HostRefLoader};
use odra::prelude::Address;

use bridge_core::bridge_core::BridgeCore;

fn main() {
    // 1) Load livenet env (casper-test.env / .env)
    let env: HostEnv = odra_casper_livenet_env::env();

    // 2) Admin caller (must have DEFAULT_ADMIN_ROLE)
    let admin = env.caller();
    env.set_caller(admin);
    println!("Admin: {:?}", admin);

    // 3) Use the *package hash* printed by Odra after deploy:
    // "Contract "contract-package-XXXX" deployed." then "Token address: hash-XXXX"
    let bridge_addr = Address::from_str(
        "hash-afb14e34a2d5052c746106481d90211019698892b979f25bb87dc8771bd8247d"
    ).unwrap();

    let wrapped_addr = Address::from_str(
        "hash-71ac1a199ad8a5d33bbba9c0fb8357e26db8282c15addfa92db9f36c04b16dc4"
    ).unwrap();

    // 4) Load contract as HostRef (THIS is the key)
    let mut bridge = BridgeCore::load(&env, bridge_addr);

    // 5) Gas for this call (tune as needed)
    env.set_gas(150_000_000_000u64);

    // 6) Whitelist wrapped token
    bridge.set_token_config(
        wrapped_addr,
        true,   // is_whitelisted
        true,  // is_canonical (false = wrapped)
        U256::from(1u64),
        U256::from(1_000_000u64),
    );

    println!("✅ Whitelisted wrapped token in BridgeCore");
}
