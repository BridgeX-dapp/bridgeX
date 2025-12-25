"use client"

import { useState } from "react"
import type { CatalogToken } from "@/lib/relayer/catalog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type TokenSelectModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectToken: (token: CatalogToken) => void
  tokens: CatalogToken[]
  title?: string
}

export function TokenSelectModal({ open, onOpenChange, onSelectToken, tokens, title }: TokenSelectModalProps) {
  const [search, setSearch] = useState("")

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">{title ?? "Select a Token"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search by name or symbol"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-secondary/50"
            autoFocus
          />

          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <button
                  key={token.id}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg",
                    "hover:bg-accent/50 transition-all duration-200",
                    "active:scale-[0.98]",
                  )}
                  onClick={() => onSelectToken(token)}
                >
                  <div className="relative w-10 h-10">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold overflow-hidden">
                      {token.logoUrl ? (
                        <img src={token.logoUrl} alt={token.symbol} className="h-10 w-10 object-contain" />
                      ) : (
                        token.symbol.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    {token.chain?.logoUrl ? (
                      <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden">
                        <img src={token.chain.logoUrl} alt={token.chain.name ?? "Chain"} className="h-3 w-3 object-contain" />
                      </span>
                    ) : null}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{token.symbol}</div>
                    <div className="text-xs text-muted-foreground">{token.name}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">{token.decimals} decimals</div>
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
