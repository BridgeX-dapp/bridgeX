"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Token = {
  symbol: string
  name: string
  logo: string
  balance: string
}

const POPULAR_TOKENS: Token[] = [
  { symbol: "ETH", name: "Ethereum", logo: "⟠", balance: "2.45" },
  { symbol: "USDC", name: "USD Coin", logo: "💵", balance: "1,234.56" },
  { symbol: "USDT", name: "Tether", logo: "₮", balance: "500.00" },
  { symbol: "DAI", name: "Dai Stablecoin", logo: "◈", balance: "750.25" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", logo: "₿", balance: "0.05" },
  { symbol: "MATIC", name: "Polygon", logo: "◇", balance: "1,500.00" },
]

type PopularTokensProps = {
  onSelectToken: (token: Token) => void
}

export function PopularTokens({ onSelectToken }: PopularTokensProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const containerRef = useState<HTMLDivElement | null>(null)[0]

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("popular-tokens-container")
    if (container) {
      const scrollAmount = 200
      const newPosition = direction === "left" ? scrollPosition - scrollAmount : scrollPosition + scrollAmount
      container.scrollTo({ left: newPosition, behavior: "smooth" })
      setScrollPosition(newPosition)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Popular</label>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => scroll("left")}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => scroll("right")}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>
      <div
        id="popular-tokens-container"
        className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {POPULAR_TOKENS.map((token) => (
          <button
            key={token.symbol}
            onClick={() => onSelectToken(token)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-lg",
              "bg-secondary/50 border border-border",
              "hover:bg-secondary/70 hover:border-primary/50",
              "transition-all duration-200 hover:scale-105",
              "group",
            )}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg group-hover:bg-primary/20 transition-colors">
              {token.logo}
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">{token.symbol}</div>
              <div className="text-xs text-muted-foreground">{token.balance}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
