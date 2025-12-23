"use client"

import type React from "react"
import { createContext, useContext } from "react"
import type { EvmClientConfig } from "@/lib/config"

const EvmClientConfigContext = createContext<EvmClientConfig | undefined>(undefined)

export function EvmClientConfigProvider({
  value,
  children,
}: {
  value: EvmClientConfig
  children: React.ReactNode
}) {
  return <EvmClientConfigContext.Provider value={value}>{children}</EvmClientConfigContext.Provider>
}

export function useEvmClientConfig() {
  const context = useContext(EvmClientConfigContext)
  if (!context) {
    throw new Error("useEvmClientConfig must be used within EvmClientConfigProvider")
  }
  return context
}
