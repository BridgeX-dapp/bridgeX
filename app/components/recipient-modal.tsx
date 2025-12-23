"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type RecipientModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (address: string) => void
}

export function RecipientModal({ open, onOpenChange, onSubmit }: RecipientModalProps) {
  const [address, setAddress] = useState("")

  const handleSubmit = () => {
    if (address.trim()) {
      onSubmit(address.trim())
      setAddress("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Enter Recipient Address</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Wallet Address</Label>
            <Input
              id="address"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="font-mono bg-secondary/50"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Enter a valid wallet address on the destination chain</p>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!address.trim()}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
