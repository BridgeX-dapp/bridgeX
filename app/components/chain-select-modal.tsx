"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Network = {
  id: string
  name: string
  logo: string
}

const NETWORKS: Network[] = [
  { id: "ethereum", name: "Ethereum", logo: "⟠" },
  { id: "arbitrum", name: "Arbitrum", logo: "◆" },
  { id: "optimism", name: "Optimism", logo: "🔴" },
  { id: "polygon", name: "Polygon", logo: "◇" },
  { id: "base", name: "Base", logo: "🔵" },
  { id: "avalanche", name: "Avalanche", logo: "🔺" },
  { id: "bsc", name: "BNB Chain", logo: "💛" },
  { id: "fantom", name: "Fantom", logo: "👻" },
]

type ChainSelectModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectChain: (chain: Network) => void
  title: string
}

export function ChainSelectModal({ open, onOpenChange, onSelectChain, title }: ChainSelectModalProps) {
  const [search, setSearch] = useState("")

  const filteredNetworks = NETWORKS.filter(
    (network) =>
      network.name.toLowerCase().includes(search.toLowerCase()) ||
      network.id.toLowerCase().includes(search.toLowerCase()),
  )

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
            {filteredNetworks.map((network) => (
              <button
                key={network.id}
                onClick={() => onSelectChain(network)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-lg",
                  "bg-secondary/30 border border-border",
                  "hover:bg-secondary/50 hover:border-primary/50",
                  "transition-all duration-200",
                  "group",
                )}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl group-hover:bg-primary/20 transition-colors">
                  {network.logo}
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold">{network.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{network.id}</div>
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
