"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { buildExplorerTxUrl } from "@/lib/explorer"

type ModalStep = "allowance" | "approving" | "approved" | "processing" | "success" | "error"
type ErrorStep = "allowance" | "approval" | "source" | "destination" | "balance"

type TransactionStatusModalProps = {
  open: boolean
  step: ModalStep
  isLoading?: boolean
  errorMessage?: string | null
  errorStep?: ErrorStep | null
  sourceTxHash?: string | null
  destTxHash?: string | null
  sourceChainName?: string | null
  destChainName?: string | null
  onOpenChange: (open: boolean) => void
  onIncreaseAllowance: () => void
  onContinue: () => void
  onRetry: () => void
}

function errorStepLabel(step: ErrorStep | null | undefined) {
  switch (step) {
    case "allowance":
      return "Allowance check"
    case "approval":
      return "Approval"
    case "source":
      return "Source transaction"
    case "destination":
      return "Destination transaction"
    case "balance":
      return "Balance check"
    default:
      return null
  }
}

export function TransactionStatusModal({
  open,
  step,
  isLoading = false,
  errorMessage,
  errorStep,
  sourceTxHash,
  destTxHash,
  sourceChainName,
  destChainName,
  onOpenChange,
  onIncreaseAllowance,
  onContinue,
  onRetry,
}: TransactionStatusModalProps) {
  const sourceExplorer = sourceTxHash ? buildExplorerTxUrl(sourceChainName, sourceTxHash) : null
  const destExplorer = destTxHash ? buildExplorerTxUrl(destChainName, destTxHash) : null
  const errorContext = errorStepLabel(errorStep)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        {step === "allowance" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <DialogHeader>
              <DialogTitle className="text-xl">Token Allowance Required</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-200">Allowance is too low</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Approve the contract to spend your tokens before bridging.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={onIncreaseAllowance}
                className="w-full h-12 bg-primary hover:bg-primary/90 transition-all duration-300"
                disabled={isLoading}
              >
                Increase Allowance
              </Button>
            </div>
          </div>
        )}

        {step === "approving" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <DialogHeader>
              <DialogTitle className="text-xl">Awaiting Approval</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
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
                  Confirm the approval in your wallet to continue.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "approved" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <DialogHeader>
              <DialogTitle className="text-xl">Approval Confirmed</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-300">Allowance updated</p>
                  <p className="text-xs text-muted-foreground">Continue to submit the bridge transaction.</p>
                </div>
              </div>
              <Button
                onClick={onContinue}
                className="w-full h-12 bg-primary hover:bg-primary/90 transition-all duration-300"
                disabled={isLoading}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <DialogHeader>
              <DialogTitle className="text-xl">Processing Bridge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
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
                  Your bridge transaction is in progress. This can take a few minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <DialogHeader>
              <DialogTitle className="text-xl">Bridge Complete</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500">
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-green-500">Transfer confirmed</p>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Your assets have been bridged successfully.
                </p>
              </div>

              <div className="space-y-3">
                {sourceTxHash && (
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1">
                    <p className="text-xs text-muted-foreground">Source Transaction</p>
                    <button
                      className="font-mono text-xs text-primary hover:text-primary/80 transition-colors break-all text-left"
                      onClick={() => sourceExplorer && window.open(sourceExplorer, "_blank")}
                    >
                      {sourceTxHash}
                    </button>
                  </div>
                )}
                {destTxHash && (
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1">
                    <p className="text-xs text-muted-foreground">Destination Transaction</p>
                    <button
                      className="font-mono text-xs text-primary hover:text-primary/80 transition-colors break-all text-left"
                      onClick={() => destExplorer && window.open(destExplorer, "_blank")}
                    >
                      {destTxHash}
                    </button>
                  </div>
                )}
              </div>

              <Button onClick={() => onOpenChange(false)} className="w-full h-12 bg-primary hover:bg-primary/90">
                Done
              </Button>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <DialogHeader>
              <DialogTitle className="text-xl">Transaction Failed</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500">
                  <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-red-500">Something went wrong</p>
                {errorContext ? (
                  <p className="text-xs text-muted-foreground mt-1">Failed during: {errorContext}</p>
                ) : null}
                <p className="text-sm text-center mt-2">{errorMessage ?? "Transaction failed."}</p>
              </div>

              {sourceTxHash && (
                <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1">
                  <p className="text-xs text-muted-foreground">Source Transaction</p>
                  <button
                    className="font-mono text-xs text-primary hover:text-primary/80 transition-colors break-all text-left"
                    onClick={() => sourceExplorer && window.open(sourceExplorer, "_blank")}
                  >
                    {sourceTxHash}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={onRetry} variant="outline" className="h-12 bg-transparent" disabled={isLoading}>
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
