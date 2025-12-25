"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { buildExplorerTxUrl } from "@/lib/explorer"

type FaucetState = "processing" | "success" | "error"

type FaucetStatusModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: FaucetState
  tokenSymbol?: string | null
  tokenLogoUrl?: string | null
  chainName?: string | null
  chainLogoUrl?: string | null
  amount?: string | null
  txHash?: string | null
  errorMessage?: string | null
  onRetry: () => void
}

export function FaucetStatusModal({
  open,
  onOpenChange,
  state,
  tokenSymbol,
  tokenLogoUrl,
  chainName,
  chainLogoUrl,
  amount,
  txHash,
  errorMessage,
  onRetry,
}: FaucetStatusModalProps) {
  const explorerUrl = txHash && chainName ? buildExplorerTxUrl(chainName, txHash) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        {state === "processing" && (
          <div className="space-y-6 animate-in fade-in-50 duration-500">
            <DialogHeader>
              <DialogTitle className="text-xl">Processing Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary/40 flex items-center justify-center">
                  <svg className="w-8 h-8 animate-spin text-primary" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Processing your faucet request...
                  <br />
                  This may take a few moments
                </p>
              </div>
            </div>
          </div>
        )}

        {state === "success" && (
          <div className="space-y-6 animate-in fade-in-50 duration-500">
            <DialogHeader>
              <DialogTitle className="text-xl">Tokens Sent Successfully</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500">
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-green-500">Request Complete!</p>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Your test tokens have been sent successfully.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Amount</span>
                    <div className="flex items-center gap-2">
                      {tokenSymbol ? (
                        <>
                          <span className="text-sm font-semibold">
                            {amount ?? "-"} {tokenSymbol}
                          </span>
                          {tokenLogoUrl ? <img src={tokenLogoUrl} alt={tokenSymbol} className="h-5 w-5" /> : null}
                        </>
                      ) : (
                        <span className="text-sm font-semibold">-</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Network</span>
                    <div className="flex items-center gap-2">
                      {chainName ? (
                        <>
                          <span className="text-sm font-semibold">{chainName}</span>
                          {chainLogoUrl ? <img src={chainLogoUrl} alt={chainName} className="h-5 w-5" /> : null}
                        </>
                      ) : (
                        <span className="text-sm font-semibold">-</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1">
                  <p className="text-xs text-muted-foreground">Transaction Hash</p>
                  {txHash ? (
                    <button
                      className="font-mono text-xs text-primary hover:text-primary/80 transition-colors break-all text-left w-full"
                      onClick={() => explorerUrl && window.open(explorerUrl, "_blank")}
                    >
                      {txHash}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  )}
                </div>
              </div>

              <Button onClick={() => onOpenChange(false)} className="w-full h-12 bg-primary hover:bg-primary/90">
                Done
              </Button>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-6 animate-in fade-in-50 duration-500">
            <DialogHeader>
              <DialogTitle className="text-xl">Request Failed</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500">
                  <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-red-500">Something Went Wrong</p>
                <p className="text-sm text-center mt-2 px-4">{errorMessage ?? "Request failed."}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={onRetry} variant="outline" className="h-12 bg-transparent">
                  Retry
                </Button>
                <Button onClick={() => onOpenChange(false)} variant="outline" className="h-12 bg-transparent">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
