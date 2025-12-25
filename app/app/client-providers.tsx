"use client"

import type React from "react"
import dynamic from "next/dynamic"

const Providers = dynamic(() => import("./providers").then((mod) => mod.Providers), {
  ssr: false,
})

type ClientProvidersProps = {
  casperClick: {
    appName: string
    appId: string
    chainName?: string
  }
  casperClient: {
    CASPER_CHAIN_NAME: string
    CASPER_GAS_PAYMENT: string
    CASPER_BRIDGE_CORE_HASH: string
    CASPER_BRIDGE_CORE_CONTRACT_PACKAGE_HASH: string
    CASPER_MAIN_RELAYER: string
    RELAYER_TX_INITIAL_LIMIT: number
    RELAYER_TX_INITIAL_MODE: "latest" | "snapshot"
  }
  evmClient: {
    EVM_WALLETCONNECT_PROJECT_ID: string
    EVM_DEFAULT_CHAIN_ID: number
    BASE_SEPOLIA_EVM_BRIDGE_CORE_ADDRESS: string
    ARBITRUM_SEPOLIA_EVM_BRIDGE_CORE_ADDRESS: string
    POLYGON_AMOY_EVM_BRIDGE_CORE_ADDRESS: string
    EVM_BRIDGE_CORE_ADDRESS?: string
    ALCHEMY_API_KEY: string
    BASE_SEPOLIA_RPC_URL: string
    BASE_SEPOLIA_WS_RPC_URL: string
    ARBITRUM_SEPOLIA_RPC_URL: string
    ARBITRUM_SEPOLIA_WS_RPC_URL: string
    POLYGON_AMOY_RPC_URL: string
    POLYGON_AMOY_WS_RPC_URL: string
  }
  children: React.ReactNode
}

export function ClientProviders({ casperClick, casperClient, evmClient, children }: ClientProvidersProps) {
  return (
    <Providers casperClick={casperClick} casperClient={casperClient} evmClient={evmClient}>
      {children}
    </Providers>
  )
}
