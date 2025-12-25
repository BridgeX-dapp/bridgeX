"use client"

import { useState } from "react"
import type { CatalogChain } from "@/lib/relayer/catalog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ChainSelectModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectChain: (chain: CatalogChain) => void
  title: string
  chains: CatalogChain[]
}

export function ChainSelectModal({ open, onOpenChange, onSelectChain, title, chains }: ChainSelectModalProps) {
  const [search, setSearch] = useState("")

  const filteredChains = chains.filter((chain) => {
    const label = (chain.displayName ?? chain.name).toLowerCase()
    return label.includes(search.toLowerCase()) || chain.name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search chains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-secondary/50"
          />
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {filteredChains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => onSelectChain(chain)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-lg",
                  "bg-secondary/30 border border-border",
                  "hover:bg-secondary/50 hover:border-primary/50",
                  "transition-all duration-200",
                  "group",
                )}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold group-hover:bg-primary/20 transition-colors overflow-hidden">
                  {chain.logoUrl ? (
                    <img src={chain.logoUrl} alt={chain.name} className="h-10 w-10 object-contain" />
                  ) : (
                    (chain.displayName ?? chain.name).slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold">{chain.displayName ?? chain.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {chain.kind} {chain.evmChainId || chain.chainId ? `• ${chain.evmChainId ?? chain.chainId}` : ""}
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
