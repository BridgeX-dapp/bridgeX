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
  }
  evmClient: {
    EVM_WALLETCONNECT_PROJECT_ID: string
    EVM_DEFAULT_CHAIN_ID: number
    SOMNIA_TESTNET_EVM_BRIDGE_CORE_ADDRESS: string
    EVM_BRIDGE_CORE_ADDRESS?: string
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
