import { arbitrumSepolia, baseSepolia, optimismSepolia, sepolia } from "wagmi/chains"
import type { Chain } from "viem"

export const SOMNIA_TESTNET_CHAIN_ID = 50312

export const somniaTestnet: Chain = {
  id: SOMNIA_TESTNET_CHAIN_ID,
  name: "Somnia Testnet",
  network: "somnia-testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network"] },
    public: { http: ["https://dream-rpc.somnia.network"] },
  },
  testnet: true,
}

export const evmChains = [somniaTestnet, sepolia, baseSepolia, optimismSepolia, arbitrumSepolia] as const

export function getEvmChainById(chainId: number) {
  return evmChains.find((chain) => chain.id === chainId) ?? somniaTestnet
}
