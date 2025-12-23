import type { EvmClientConfig } from "@/lib/config"
import { SOMNIA_TESTNET_CHAIN_ID } from "@/lib/evm/chains"

export function resolveBridgeCoreAddress(config: EvmClientConfig, chainId?: number | null) {
  if (chainId === SOMNIA_TESTNET_CHAIN_ID) {
    return config.SOMNIA_TESTNET_EVM_BRIDGE_CORE_ADDRESS
  }

  return config.EVM_BRIDGE_CORE_ADDRESS ?? config.SOMNIA_TESTNET_EVM_BRIDGE_CORE_ADDRESS
}
