"use client"

import { FaucetCard } from "@/components/faucet-card"

export default function FaucetPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-balance">Testnet Faucet</h1>
            <p className="text-muted-foreground text-pretty">Request test tokens to try out the BridgeX platform</p>
          </div>
          <FaucetCard />
        </div>
      </div>
    </div>
  )
}
