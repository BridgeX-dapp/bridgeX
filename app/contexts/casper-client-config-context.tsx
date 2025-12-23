"use client"

import type React from "react"
import { createContext, useContext } from "react"
import type { CasperClientConfig } from "@/lib/config"

const CasperClientConfigContext = createContext<CasperClientConfig | null>(null)

export function CasperClientConfigProvider({
  value,
  children,
}: {
  value: CasperClientConfig
  children: React.ReactNode
}) {
  return <CasperClientConfigContext.Provider value={value}>{children}</CasperClientConfigContext.Provider>
}

export function useCasperClientConfig() {
  const context = useContext(CasperClientConfigContext)
  if (!context) {
    throw new Error("useCasperClientConfig must be used within CasperClientConfigProvider")
  }
  return context
}
