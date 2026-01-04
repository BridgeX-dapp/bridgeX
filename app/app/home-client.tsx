"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { BridgeCardSingle } from "@/components/bridge-card-single"
import { TransactionsCard } from "@/components/transactions-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCasperWallet } from "@/contexts/casper-wallet-context"
import { shortenHash } from "@/lib/casper/format"
import { DropletIcon, ExternalLink, LogOutIcon } from "lucide-react"
import Link from "next/link"

type Mode = "simple" | "advanced"

export default function HomeClient() {
  const [mode, setMode] = useState<Mode>("simple")
  const searchParams = useSearchParams()
  const { status, accountHash, displayName, connect, disconnect, isReady, account } = useCasperWallet()
  console.log("account", account)

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!accountHash) return
    try {
      await navigator.clipboard.writeText(accountHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  const sourceChain = searchParams.get("sourceChain") || undefined
  const destChain = searchParams.get("destChain") || undefined
  const sourceToken = searchParams.get("sourceToken") || undefined
  const destToken = searchParams.get("destToken") || undefined

  return (
    <div className="min-h-screen flex flex-col ">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container  mx-auto md:px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <img src="/img/logo.png" className="rounded-full" />
            </div>
            <span className="text-xl font-semibold">BridgeX</span>
            <div className="flex gap-0.5">
<Link href={`/faucet`} className="text-lg text-blue-600 underline flex gap-0.5">
                 <p>Faucet</p>
                 <ExternalLink className="w-4 h-5 text-blue-600 "/>
                </Link>
              
            </div>
             
          </div>
          <div className="flex items-center gap-3">
          
            {status === "connected" ? (
              <div className="flex items-center gap-1 rounded-lg border border-border bg-card/70 ">
                <div className="rounded-lg  px-3 py-2">
                  <div className="text-xs text-muted-foreground">Connected Casper wallet</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-semibold text-xs">
                      {displayName ?? (accountHash ? shortenHash(accountHash) : "Connected")}
                    </span>
                    {accountHash ? (
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy account hash"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    ) : null}
                    {copied ? <span className="text-[10px] text-muted-foreground">Copied</span> : null}
                  </div>
                </div>
                <Button  size="icon" onClick={disconnect}>
                  <LogOutIcon />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={connect}
                disabled={status === "connecting" || !isReady}
              >
                {status === "connecting" ? "Connecting..." : isReady ? "Connect Casper Wallet" : "Loading Wallet..."}
              </Button>
            )}
            <ConnectButton chainStatus="none" showBalance={false} />
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
                <BridgeCardSingle
                  initialSourceChain={sourceChain}
                  initialDestChain={destChain}
                  initialSourceToken={sourceToken}
                />
              )}
            </div>
            {mode === "advanced" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
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
