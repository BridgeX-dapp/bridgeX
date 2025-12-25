"use client"

import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useCasperClientConfig } from "@/contexts/casper-client-config-context"
import { formatAmountFromBaseUnits } from "@/lib/amount"
import { buildExplorerTxUrl } from "@/lib/explorer"

type RelayerTransaction = {
  id: number
  sender?: string | null
  destAddress?: string | null
  sourceTxHash?: string | null
  destinationTxHash?: string | null
  sourceChainRef?: { name?: string | null; displayName?: string | null; logoUrl?: string | null }
  destChainRef?: { name?: string | null; displayName?: string | null; logoUrl?: string | null }
  tokenRef?: { symbol?: string | null; decimals?: number | null; logoUrl?: string | null }
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
  sender: string
  recipient: string
  sourceTxHash: string | null
  destinationTxHash: string | null
  sourceChainName: string
  destChainName: string
  tokenLogoUrl?: string | null
  chainLogoUrl?: string | null
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

function shortenAddress(value?: string | null) {
  if (!value) return "-"
  const trimmed = value.trim()
  const accountPrefix = "account-hash-"
  const hashPrefix = "hash-"
  const hasAccountPrefix = trimmed.startsWith(accountPrefix)
  const hasHashPrefix = trimmed.startsWith(hashPrefix)
  const raw = hasAccountPrefix
    ? trimmed.slice(accountPrefix.length)
    : hasHashPrefix
      ? trimmed.slice(hashPrefix.length)
      : trimmed
  const has0x = raw.startsWith("0x")
  const body = has0x ? raw.slice(2) : raw
  if (body.length <= 8) return trimmed
  const short = `${body.slice(0, 4)}...${body.slice(-4)}`
  if (hasAccountPrefix) return `${accountPrefix}${short}`
  if (hasHashPrefix) return `${hashPrefix}${short}`
  return `${has0x ? "0x" : ""}${short}`
}

function formatStatusLabel(status: TransactionRow["status"]) {
  if (status === "completed") return "Success"
  if (status === "executing") return "Processing"
  if (status === "failed") return "Failed"
  return "Processing"
}

function shouldIncludeRealtime(tx: RelayerTransaction) {
  return tx.status === "EXECUTED" || tx.status === "FINALIZED"
}

export function TransactionsCard() {
  const { CASPER_MAIN_RELAYER, RELAYER_TX_INITIAL_LIMIT, RELAYER_TX_INITIAL_MODE } = useCasperClientConfig()
  const [rows, setRows] = useState<TransactionRow[]>([])
  const [animatedIds, setAnimatedIds] = useState<Set<number>>(new Set())
  const socketRef = useRef<Socket | null>(null)
  const hasInitialLoadRef = useRef(false)

  const limit = Math.max(1, RELAYER_TX_INITIAL_LIMIT || 4)

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
          sender: tx.sender ?? "-",
          recipient: tx.destAddress ?? "-",
          sourceTxHash: tx.sourceTxHash ?? null,
          destinationTxHash: tx.destinationTxHash ?? null,
          sourceChainName: tx.sourceChainRef?.name ?? "Unknown",
          destChainName: tx.destChainRef?.name ?? "Unknown",
          tokenLogoUrl: tx.tokenRef?.logoUrl ?? null,
          chainLogoUrl: tx.sourceChainRef?.logoUrl ?? null,
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
      if (next.length > limit) {
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
      const filtered = payload.filter(shouldIncludeRealtime)
      if (filtered.length === 0) return
      applyTransactions(filtered, true)
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
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {tx.tokenLogoUrl ? (
                        <img src={tx.tokenLogoUrl} alt={tx.token} className="h-10 w-10 object-contain" />
                      ) : (
                        <span className="text-xs font-semibold">{tx.token.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    {tx.chainLogoUrl ? (
                      <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden">
                        <img src={tx.chainLogoUrl} alt={tx.from} className="h-3 w-3 object-contain" />
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      {tx.amount} {tx.token}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tx.from} → {tx.to}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    tx.status === "completed" && "bg-success/20 text-success",
                    tx.status === "executing" && "bg-primary/20 text-primary",
                    tx.status === "pending" && "bg-primary/10 text-primary",
                    tx.status === "failed" && "bg-destructive/20 text-destructive",
                  )}
                >
                  {formatStatusLabel(tx.status)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Sender</span>
                  <span className="font-mono">{shortenAddress(tx.sender)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Recipient</span>
                  <span className="font-mono">{shortenAddress(tx.recipient)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Source Tx</span>
                  {tx.sourceTxHash ? (
                    <a
                      className="font-mono text-primary hover:text-primary/80 transition-colors"
                      href={buildExplorerTxUrl(tx.sourceChainName, tx.sourceTxHash) ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortenAddress(tx.sourceTxHash)}
                    </a>
                  ) : (
                    <span>-</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Dest Tx</span>
                  {tx.destinationTxHash ? (
                    <a
                      className="font-mono text-primary hover:text-primary/80 transition-colors"
                      href={buildExplorerTxUrl(tx.destChainName, tx.destinationTxHash) ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortenAddress(tx.destinationTxHash)}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Pending</span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">{tx.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
