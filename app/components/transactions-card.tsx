"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Transaction = {
  id: string
  from: string
  to: string
  amount: string
  token: string
  status: "pending" | "executing" | "completed" | "failed"
  timestamp: string
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    from: "Ethereum",
    to: "Arbitrum",
    amount: "0.5",
    token: "ETH",
    status: "completed",
    timestamp: "2 min ago",
  },
  {
    id: "2",
    from: "Arbitrum",
    to: "Ethereum",
    amount: "100",
    token: "USDC",
    status: "executing",
    timestamp: "5 min ago",
  },
  {
    id: "3",
    from: "Ethereum",
    to: "Polygon",
    amount: "1.2",
    token: "ETH",
    status: "completed",
    timestamp: "15 min ago",
  },
]

const NEW_TRANSACTIONS: Transaction[] = [
  {
    id: "4",
    from: "Polygon",
    to: "Arbitrum",
    amount: "250",
    token: "USDC",
    status: "pending",
    timestamp: "Just now",
  },
  {
    id: "5",
    from: "Base",
    to: "Optimism",
    amount: "0.8",
    token: "ETH",
    status: "pending",
    timestamp: "Just now",
  },
]

export function TransactionsCard() {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS)

  useEffect(() => {
    // Add new transactions after 3 seconds
    const addNewTxTimeout = setTimeout(() => {
      setTransactions((prev) => [NEW_TRANSACTIONS[0], ...prev])
    }, 3000)

    // Add another transaction after 6 seconds
    const addSecondTxTimeout = setTimeout(() => {
      setTransactions((prev) => [NEW_TRANSACTIONS[1], ...prev])
    }, 6000)

    // Update transaction statuses
    const statusInterval = setInterval(() => {
      setTransactions((prev) =>
        prev.map((tx) => {
          if (tx.status === "pending") {
            return { ...tx, status: "executing" as const }
          }
          if (tx.status === "executing") {
            return { ...tx, status: "completed" as const }
          }
          return tx
        }),
      )
    }, 4000)

    return () => {
      clearTimeout(addNewTxTimeout)
      clearTimeout(addSecondTxTimeout)
      clearInterval(statusInterval)
    }
  }, [])

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
          {transactions.map((tx, index) => (
            <div
              key={tx.id}
              className={cn(
                "p-4 rounded-lg border border-border bg-secondary/30",
                "hover:bg-secondary/50 transition-all duration-200",
                index === 0 && "animate-in fade-in slide-in-from-top-2 duration-500",
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
