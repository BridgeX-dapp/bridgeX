"use client"

import type React from "react"
import { useMemo } from "react"
import "@rainbow-me/rainbowkit/styles.css"
import { CHAIN_NAME, CONTENT_MODE, type CsprClickInitOptions } from "@make-software/csprclick-core-types"
import { ClickProvider, ClickUI, DefaultThemes, buildTheme } from "@make-software/csprclick-ui"
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, http } from "wagmi"
import { ThemeProvider } from "styled-components"
import { CasperWalletProvider } from "@/contexts/casper-wallet-context"
import { CasperClientConfigProvider } from "@/contexts/casper-client-config-context"
import { CasperTransactionsProvider } from "@/contexts/casper-transactions-context"
import { EvmClientConfigProvider } from "@/contexts/evm-client-config-context"
import { EvmWalletProvider } from "@/contexts/evm-wallet-context"
import { RelayerCatalogProvider } from "@/contexts/relayer-catalog-context"
import { arbitrumSepolia, baseSepolia, polygonAmoy } from "wagmi/chains"
import { evmChains, getEvmChainById } from "@/lib/evm/chains"

type CasperClickConfig = {
  appName: string
  appId: string
  chainName?: string
}

type ProvidersProps = {
  casperClick: CasperClickConfig
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

const queryClient = new QueryClient()

export function Providers({ casperClick, casperClient, evmClient, children }: ProvidersProps) {
  const theme = useMemo(() => buildTheme(DefaultThemes.csprclick).dark, [])
  const isClient = typeof window !== "undefined"
  const options = useMemo<CsprClickInitOptions>(
    () => ({
      appName: casperClick.appName,
      appId: casperClick.appId,
      contentMode: CONTENT_MODE.IFRAME,
      providers: ["casper-wallet", "ledger", "torus-wallet", "casperdash", "metamask-snap", "casper-signer"],
      chainName: casperClick.chainName ?? CHAIN_NAME.TESTNET,
    }),
    [casperClick.appId, casperClick.appName, casperClick.chainName],
  )

  const evmConfig = useMemo(
    () =>
      getDefaultConfig({
        appName: casperClick.appName,
        projectId: evmClient.EVM_WALLETCONNECT_PROJECT_ID,
        chains: evmChains,
        transports: {
          [baseSepolia.id]: http(evmClient.BASE_SEPOLIA_RPC_URL),
          [arbitrumSepolia.id]: http(evmClient.ARBITRUM_SEPOLIA_RPC_URL),
          [polygonAmoy.id]: http(evmClient.POLYGON_AMOY_RPC_URL),
        },
        ssr: false,
      }),
    [
      casperClick.appName,
      evmClient.ARBITRUM_SEPOLIA_RPC_URL,
      evmClient.BASE_SEPOLIA_RPC_URL,
      evmClient.EVM_WALLETCONNECT_PROJECT_ID,
      evmClient.POLYGON_AMOY_RPC_URL,
    ],
  )

  const initialChain = useMemo(
    () => getEvmChainById(evmClient.EVM_DEFAULT_CHAIN_ID),
    [evmClient.EVM_DEFAULT_CHAIN_ID],
  )

  return (
    <WagmiProvider config={evmConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={initialChain} modalSize="compact">
          <ClickProvider options={options}>
            <ThemeProvider theme={theme}>
              {isClient ? <ClickUI rootAppElement="body" /> : null}
              {/*@ts-ignore */}
              <EvmClientConfigProvider value={evmClient}>
                <EvmWalletProvider>
                  {/*@ts-ignore */}
                  <CasperClientConfigProvider value={casperClient}>
                    <RelayerCatalogProvider>
                      <CasperWalletProvider>
                        <CasperTransactionsProvider>{children}</CasperTransactionsProvider>
                      </CasperWalletProvider>
                    </RelayerCatalogProvider>
                  </CasperClientConfigProvider>
                </EvmWalletProvider>
              </EvmClientConfigProvider>
            </ThemeProvider>
          </ClickProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
