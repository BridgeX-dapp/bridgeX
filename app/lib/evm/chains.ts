import { arbitrumSepolia, baseSepolia, polygonAmoy } from "wagmi/chains"

export const BASE_SEPOLIA_CHAIN_ID = baseSepolia.id
export const ARBITRUM_SEPOLIA_CHAIN_ID = arbitrumSepolia.id
export const POLYGON_AMOY_CHAIN_ID = polygonAmoy.id

export const evmChains = [baseSepolia, arbitrumSepolia, polygonAmoy] as const

export function getEvmChainById(chainId: number) {
  return evmChains.find((chain) => chain.id === chainId) ?? baseSepolia
}
