import type { EvmClientConfig } from "@/lib/config"
import { ARBITRUM_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID, POLYGON_AMOY_CHAIN_ID } from "@/lib/evm/chains"

export function resolveBridgeCoreAddress(config: EvmClientConfig, chainId?: number | null) {
  if (chainId === BASE_SEPOLIA_CHAIN_ID) {
    return config.BASE_SEPOLIA_EVM_BRIDGE_CORE_ADDRESS
  }
  if (chainId === ARBITRUM_SEPOLIA_CHAIN_ID) {
    return config.ARBITRUM_SEPOLIA_EVM_BRIDGE_CORE_ADDRESS
  }
  if (chainId === POLYGON_AMOY_CHAIN_ID) {
    return config.POLYGON_AMOY_EVM_BRIDGE_CORE_ADDRESS
  }

  return config.EVM_BRIDGE_CORE_ADDRESS ?? config.BASE_SEPOLIA_EVM_BRIDGE_CORE_ADDRESS
}
