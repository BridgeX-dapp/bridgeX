"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { BridgeCard } from "@/components/bridge-card"
import { BridgeCardSingle } from "@/components/bridge-card-single"
import { TransactionsCard } from "@/components/transactions-card"
import { CasperTestPanel } from "@/components/casper-test-panel"
import { EvmTestPanel } from "@/components/evm-test-panel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCasperWallet } from "@/contexts/casper-wallet-context"
import { shortenHash } from "@/lib/casper/format"

type Mode = "simple" | "advanced"

export default function HomeClient() {
  const [mode, setMode] = useState<Mode>("simple")
  const searchParams = useSearchParams()
  const { status, accountHash, displayName, connect, disconnect, isReady } = useCasperWallet()

  console.log("account hash", accountHash)

  const sourceChain = searchParams.get("sourceChain") || undefined
  const destChain = searchParams.get("destChain") || undefined
  const sourceToken = searchParams.get("sourceToken") || undefined
  const destToken = searchParams.get("destToken") || undefined

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-semibold">BridgeX</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={status === "connected" ? disconnect : connect}
              disabled={status === "connecting" || !isReady}
            >
              {status === "connected"
                ? displayName ?? (accountHash ? accountHash : "Connected")
                : status === "connecting"
                  ? "Connecting..."
                  : isReady
                    ? "Connect Casper Wallet"
                    : "Loading Wallet..."}
            </Button>
            <ConnectButton chainStatus="name" showBalance={false} />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div
          className={cn(
            "transition-all duration-500 ease-in-out",
            mode === "simple" ? "max-w-lg mx-auto" : "max-w-6xl mx-auto",
          )}
        >
          <div
            className={cn(
              "grid gap-6 transition-all duration-500",
              mode === "advanced" ? "lg:grid-cols-2" : "grid-cols-1",
            )}
          >
            <div className="space-y-6">
              {mode === "simple" ? (
                <BridgeCardSingle
                  initialSourceChain={sourceChain}
                  initialDestChain={destChain}
                  initialSourceToken={sourceToken}
                />
              ) : (
                <>
                  <BridgeCardSingle
                    initialSourceChain={sourceChain}
                    initialDestChain={destChain}
                    initialSourceToken={sourceToken}
                  />
                  <BridgeCard
                    initialSourceChain={sourceChain}
                    initialDestChain={destChain}
                    initialSourceToken={sourceToken}
                    initialDestToken={destToken}
                  />
                </>
              )}
            </div>
            {mode === "advanced" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                <CasperTestPanel />
                <EvmTestPanel />
                <TransactionsCard />
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant={mode === "simple" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("simple")}
              className="transition-all duration-300"
            >
              Simple
            </Button>
            <Button
              variant={mode === "advanced" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("advanced")}
              className="transition-all duration-300"
            >
              Advanced
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
