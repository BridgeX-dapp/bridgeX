"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import {
  type CatalogChain,
  type CatalogToken,
  type CatalogTokenPair,
  fetchCatalogSnapshot,
} from "@/lib/relayer/catalog"

type RelayerCatalogContextValue = {
  chains: CatalogChain[]
  tokens: CatalogToken[]
  tokenPairs: CatalogTokenPair[]
  loading: boolean
  error: string | null
}

const RelayerCatalogContext = createContext<RelayerCatalogContextValue | undefined>(undefined)

export function RelayerCatalogProvider({ children }: { children: React.ReactNode }) {
  const [chains, setChains] = useState<CatalogChain[]>([])
  const [tokens, setTokens] = useState<CatalogToken[]>([])
  const [tokenPairs, setTokenPairs] = useState<CatalogTokenPair[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadCatalog = async () => {
      setLoading(true)
      setError(null)
      try {
        const { chains: nextChains, tokens: nextTokens, tokenPairs: nextPairs } = await fetchCatalogSnapshot()
        if (!isMounted) return
        setChains(nextChains)
        setTokens(nextTokens)
        setTokenPairs(nextPairs)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Failed to load catalog.")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadCatalog()

    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo(
    () => ({
      chains,
      tokens,
      tokenPairs,
      loading,
      error,
    }),
    [chains, tokens, tokenPairs, loading, error],
  )

  return <RelayerCatalogContext.Provider value={value}>{children}</RelayerCatalogContext.Provider>
}

export function useRelayerCatalog() {
  const context = useContext(RelayerCatalogContext)
  if (!context) {
    throw new Error("useRelayerCatalog must be used within RelayerCatalogProvider")
  }
  return context
}
