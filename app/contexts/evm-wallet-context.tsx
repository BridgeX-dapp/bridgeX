"use client"

import type React from "react"
import { createContext, useContext, useMemo } from "react"
import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"

type EvmWalletStatus = "disconnected" | "connecting" | "connected" | "reconnecting"

type EvmWalletContextValue = {
  status: EvmWalletStatus
  address: `0x${string}` | null
  chainId: number | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  switchChain: (chainId: number) => void
}

const EvmWalletContext = createContext<EvmWalletContextValue | undefined>(undefined)

export function EvmWalletProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, status } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { openConnectModal } = useConnectModal()
  const { switchChain } = useSwitchChain()

  const value = useMemo(
    () => ({
      status,
      address: address ?? null,
      chainId: Number.isFinite(chainId) ? chainId : null,
      isConnected,
      connect: () => openConnectModal?.(),
      disconnect,
      switchChain: (nextChainId: number) => switchChain({ chainId: nextChainId }),
    }),
    [address, chainId, disconnect, isConnected, openConnectModal, status, switchChain],
  )

  return <EvmWalletContext.Provider value={value}>{children}</EvmWalletContext.Provider>
}

export function useEvmWallet() {
  const context = useContext(EvmWalletContext)
  if (!context) {
    throw new Error("useEvmWallet must be used within EvmWalletProvider")
  }
  return context
}
