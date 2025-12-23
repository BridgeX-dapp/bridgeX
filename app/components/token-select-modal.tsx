"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Token = {
  symbol: string
  name: string
  logo: string
  balance: string
}

const MOCK_TOKENS: Token[] = [
  { symbol: "ETH", name: "Ethereum", logo: "⟠", balance: "2.45" },
  { symbol: "USDC", name: "USD Coin", logo: "◉", balance: "1,250.00" },
  { symbol: "USDT", name: "Tether", logo: "₮", balance: "850.50" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", logo: "₿", balance: "0.15" },
  { symbol: "DAI", name: "Dai Stablecoin", logo: "◈", balance: "500.00" },
  { symbol: "ARB", name: "Arbitrum", logo: "◆", balance: "125.75" },
]

type TokenSelectModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectToken: (token: Token) => void
}

export function TokenSelectModal({ open, onOpenChange, onSelectToken }: TokenSelectModalProps) {
  const [search, setSearch] = useState("")

  const filteredTokens = MOCK_TOKENS.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Select a Token</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Search Input */}
          <Input
            placeholder="Search by name or symbol"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-secondary/50"
            autoFocus
          />

          {/* Token List */}
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <button
                  key={token.symbol}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg",
                    "hover:bg-accent/50 transition-all duration-200",
                    "active:scale-[0.98]",
                  )}
                  onClick={() => onSelectToken(token)}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                    {token.logo}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{token.symbol}</div>
                    <div className="text-xs text-muted-foreground">{token.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{token.balance}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">No tokens found</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
