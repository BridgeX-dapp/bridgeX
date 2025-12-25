"use client"

import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useCasperClientConfig } from "@/contexts/casper-client-config-context"
import { formatAmountFromBaseUnits } from "@/lib/amount"

type RelayerTransaction = {
  id: number
  sourceChainRef?: { name?: string | null; displayName?: string | null }
  destChainRef?: { name?: string | null; displayName?: string | null }
  tokenRef?: { symbol?: string | null; decimals?: number | null }
  amount?: string | null
  status?: string | null
  updatedAt?: string | null
  createdAt?: string | null
}

type TransactionRow = {
  id: number
  from: string
  to: string
  amount: string
  token: string
  status: "pending" | "executing" | "completed" | "failed"
  timestamp: string
}

const STATUS_MAP: Record<string, TransactionRow["status"]> = {
  LOCKED: "pending",
  BURNED: "pending",
  QUEUED: "pending",
  EXECUTING: "executing",
  EXECUTED: "completed",
  FINALIZED: "completed",
  FAILED: "failed",
}

function toStatus(value?: string | null): TransactionRow["status"] {
  if (!value) return "pending"
  return STATUS_MAP[value] ?? "pending"
}

function formatTimestamp(value?: string | null) {
  if (!value) return "Just now"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Just now"
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (diffSeconds < 60) return "Just now"
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function resolveChainName(chain?: { name?: string | null; displayName?: string | null }) {
  return chain?.displayName ?? chain?.name ?? "Unknown"
}

function formatAmount(amount: string | null | undefined, decimals?: number | null) {
  if (!amount) return "0"
  if (!Number.isFinite(decimals ?? 0)) return amount
  try {
    return formatAmountFromBaseUnits(BigInt(amount), decimals ?? 0)
  } catch {
    return amount
  }
}

export function TransactionsCard() {
  const { CASPER_MAIN_RELAYER, RELAYER_TX_INITIAL_LIMIT, RELAYER_TX_INITIAL_MODE } = useCasperClientConfig()
  const [rows, setRows] = useState<TransactionRow[]>([])
  const [animatedIds, setAnimatedIds] = useState<Set<number>>(new Set())
  const socketRef = useRef<Socket | null>(null)
  const hasInitialLoadRef = useRef(false)

  const limit = RELAYER_TX_INITIAL_LIMIT

  const applyTransactions = (items: RelayerTransaction[], prepend: boolean) => {
    setRows((prev) => {
      const next = [...prev]
      const nextAnimated = new Set<number>()
      items.forEach((tx) => {
        const idx = next.findIndex((row) => row.id === tx.id)
        const row: TransactionRow = {
          id: tx.id,
          from: resolveChainName(tx.sourceChainRef),
          to: resolveChainName(tx.destChainRef),
          amount: formatAmount(tx.amount ?? undefined, tx.tokenRef?.decimals),
          token: tx.tokenRef?.symbol ?? "-",
          status: toStatus(tx.status),
          timestamp: formatTimestamp(tx.updatedAt ?? tx.createdAt),
        }
        if (idx >= 0) {
          next[idx] = row
        } else if (prepend) {
          next.unshift(row)
          nextAnimated.add(tx.id)
        } else {
          next.push(row)
        }
      })
      if (limit && next.length > limit) {
        next.length = limit
      }
      if (nextAnimated.size > 0) {
        setAnimatedIds((prevSet) => {
          const merged = new Set(prevSet)
          nextAnimated.forEach((id) => merged.add(id))
          return merged
        })
        setTimeout(() => {
          setAnimatedIds((prevSet) => {
            const merged = new Set(prevSet)
            nextAnimated.forEach((id) => merged.delete(id))
            return merged
          })
        }, 900)
      }
      return next
    })
  }

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const url = new URL("/api/v1/transactions", CASPER_MAIN_RELAYER)
        const response = await fetch(url.toString())
        if (!response.ok) return
        const data = await response.json()
        const transactions = (data.transactions ?? []) as RelayerTransaction[]
        if (transactions.length > 0) {
          hasInitialLoadRef.current = true
          applyTransactions(transactions.slice(0, limit), false)
        }
      } catch {
        // ignore fetch errors
      }
    }

    if (RELAYER_TX_INITIAL_MODE === "latest") {
      fetchLatest()
    }

    return () => {
      // cleanup handled in socket effect
    }
  }, [CASPER_MAIN_RELAYER, RELAYER_TX_INITIAL_MODE, limit])

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(CASPER_MAIN_RELAYER, { transports: ["websocket"] })
    }

    const socket = socketRef.current

    const handleSnapshot = (payload: RelayerTransaction[]) => {
      if (RELAYER_TX_INITIAL_MODE === "snapshot" && !hasInitialLoadRef.current) {
        hasInitialLoadRef.current = true
        applyTransactions(payload.slice(0, limit), false)
      }
    }

    const handleUpdate = (payload: RelayerTransaction[]) => {
      applyTransactions(payload, true)
    }

    socket.on("transactions:snapshot", handleSnapshot)
    socket.on("transactions:update", handleUpdate)

    return () => {
      socket.off("transactions:snapshot", handleSnapshot)
      socket.off("transactions:update", handleUpdate)
      socket.disconnect()
      socketRef.current = null
    }
  }, [CASPER_MAIN_RELAYER, RELAYER_TX_INITIAL_MODE, limit])

  return (
    <Card className="bg-card border-border shadow-xl h-full">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          Recent Transactions
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rows.map((tx) => (
            <div
              key={tx.id}
              className={cn(
                "p-4 rounded-lg border border-border bg-secondary/30",
                "hover:bg-secondary/50 transition-all duration-200",
                animatedIds.has(tx.id) && "animate-in fade-in slide-in-from-top-2 duration-500",
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      tx.status === "completed" && "bg-success",
                      tx.status === "executing" && "bg-primary animate-pulse",
                      tx.status === "pending" && "bg-warning animate-pulse",
                      tx.status === "failed" && "bg-destructive",
                    )}
                  />
                  <span className="font-mono text-sm font-semibold">
                    {tx.amount} {tx.token}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded-full capitalize",
                    tx.status === "completed" && "bg-success/20 text-success",
                    tx.status === "executing" && "bg-primary/20 text-primary",
                    tx.status === "pending" && "bg-warning/20 text-warning",
                    tx.status === "failed" && "bg-destructive/20 text-destructive",
                  )}
                >
                  {tx.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{tx.from}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span>{tx.to}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">{tx.timestamp}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
