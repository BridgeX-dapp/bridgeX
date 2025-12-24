"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PopularToken = {
  id: number
  symbol: string
  name: string
  logoUrl?: string | null
  balance?: string | null
}

type PopularTokensProps = {
  tokens: PopularToken[]
  onSelectToken: (token: PopularToken) => void
}

export function PopularTokens({ tokens, onSelectToken }: PopularTokensProps) {
  const [scrollPosition, setScrollPosition] = useState(0)

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
        {tokens.map((token) => (
          <button
            key={token.id}
            onClick={() => onSelectToken(token)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-lg",
              "bg-secondary/50 border border-border",
              "hover:bg-secondary/70 hover:border-primary/50",
              "transition-all duration-200 hover:scale-105",
              "group",
            )}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold group-hover:bg-primary/20 transition-colors overflow-hidden">
              {token.logoUrl ? (
                <img src={token.logoUrl} alt={token.symbol} className="h-8 w-8 object-contain" />
              ) : (
                token.symbol.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">{token.symbol}</div>
              <div className="text-xs text-muted-foreground">{token.balance ?? "-"}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
