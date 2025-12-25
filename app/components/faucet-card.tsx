"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FaucetStatusModal } from "./faucet-status-card"
import type { CatalogChain, CatalogToken } from "@/lib/relayer/catalog"
import { useRelayerCatalog } from "@/contexts/relayer-catalog-context"
import { useCasperClientConfig } from "@/contexts/casper-client-config-context"
import { PublicKey } from "casper-js-sdk"
import { normalizeHex } from "@/lib/casper/format"

type FaucetToken = CatalogToken
type FaucetChain = CatalogChain

type FaucetState = "idle" | "processing" | "success" | "error"

export function FaucetCard() {
  const { chains, tokens, tokenPairs, loading, error } = useRelayerCatalog()
  const { CASPER_MAIN_RELAYER } = useCasperClientConfig()
  const [selectedToken, setSelectedToken] = useState<FaucetToken | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<FaucetChain | null>(null)
  const [amount, setAmount] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [showTokenDropdown, setShowTokenDropdown] = useState(false)
  const [showChainDropdown, setShowChainDropdown] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [errors, setErrors] = useState<{ amount?: string; address?: string }>({})
  const [requestState, setRequestState] = useState<FaucetState>("idle")
  const [requestError, setRequestError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const canonicalTokens = useMemo(
    () => tokens.filter((token) => token.tokenType === "CANONICAL"),
    [tokens],
  )

  const supportedChainIds = useMemo(
    () => new Set(tokenPairs.flatMap((pair) => [pair.sourceChainId, pair.destChainId])),
    [tokenPairs],
  )

  const chainOptions = useMemo(
    () => chains.filter((chain) => supportedChainIds.has(chain.id)),
    [chains, supportedChainIds],
  )

  const tokenOptions = useMemo(() => {
    if (!selectedNetwork) return canonicalTokens
    return canonicalTokens.filter((token) => token.chainId === selectedNetwork.id)
  }, [canonicalTokens, selectedNetwork])

  const validateInputs = () => {
    const newErrors: { amount?: string; address?: string } = {}

    if (!amount || Number.parseFloat(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount"
    }

    if (!walletAddress) {
      newErrors.address = "Please enter a wallet address"
    } else if (selectedNetwork?.kind === "EVM") {
      const clean = walletAddress.trim()
      if (!/^0x[a-fA-F0-9]{40}$/.test(clean)) {
        newErrors.address = "Invalid EVM address"
      }
    } else if (selectedNetwork?.kind === "CASPER") {
      const clean = walletAddress.trim()
      const normalized = normalizeHex(clean)
      const isAccountHash = clean.startsWith("account-hash-") || normalized.length === 64
      if (!isAccountHash) {
        try {
          PublicKey.fromHex(clean)
        } catch {
          newErrors.address = "Invalid Casper address"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRequestTokens = async () => {
    if (!selectedToken || !selectedNetwork) return
    if (!validateInputs()) return

    setRequestError(null)
    setRequestState("processing")
    setShowStatusModal(true)
    setTxHash(null)

    try {
      const response = await fetch(`${CASPER_MAIN_RELAYER}/api/v1/faucet/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          chainId: selectedNetwork.id,
          tokenId: selectedToken.id,
          recipient: walletAddress.trim(),
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || "Faucet request failed")
      }

      const data = await response.json()
      setTxHash(data.txHash ?? null)
      setRequestState("success")
    } catch (err) {
      setRequestState("error")
      setRequestError(err instanceof Error ? err.message : "Faucet request failed")
    }
  }

  return (
    <>
      <Card className="bg-card border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Request Test Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? <div className="text-sm text-muted-foreground">Loading supported tokens...</div> : null}
          {error ? <div className="text-sm text-destructive">Catalog error: {error}</div> : null}

          <div className="space-y-2">
            <Label>Select Token</Label>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full h-16 justify-between text-left hover:bg-accent/50 transition-colors bg-transparent"
                onClick={() => setShowTokenDropdown(!showTokenDropdown)}
              >
                {selectedToken ? (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold overflow-hidden">
                        {selectedToken.logoUrl ? (
                          <img src={selectedToken.logoUrl} alt={selectedToken.symbol} className="h-10 w-10 object-contain" />
                        ) : (
                          selectedToken.symbol.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      {selectedNetwork?.logoUrl ? (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center text-[10px] border border-border overflow-hidden">
                          <img src={selectedNetwork.logoUrl} alt={selectedNetwork.name} className="h-4 w-4 object-contain" />
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <div className="font-semibold">{selectedToken.symbol}</div>
                      <div className="text-xs text-muted-foreground">{selectedToken.name}</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Choose a token</span>
                )}
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>

              {showTokenDropdown && (
                <div className="absolute z-10 w-full mt-2 p-2 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto animate-in fade-in-50 slide-in-from-top-2 duration-200">
                  {tokenOptions.map((token) => (
                    <button
                      key={token.id}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        setSelectedToken(token)
                        setShowTokenDropdown(false)
                      }}
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
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Chain</Label>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full h-16 justify-between text-left hover:bg-accent/50 transition-colors bg-transparent"
                onClick={() => setShowChainDropdown(!showChainDropdown)}
              >
                {selectedNetwork ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold overflow-hidden">
                      {selectedNetwork.logoUrl ? (
                        <img src={selectedNetwork.logoUrl} alt={selectedNetwork.name} className="h-10 w-10 object-contain" />
                      ) : (
                        selectedNetwork.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{selectedNetwork.name}</div>
                      <div className="text-xs text-muted-foreground">Testnet</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Choose a chain</span>
                )}
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>

              {showChainDropdown && (
                <div className="absolute z-10 w-full mt-2 p-2 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto animate-in fade-in-50 slide-in-from-top-2 duration-200">
                  {chainOptions.map((network) => (
                    <button
                      key={network.id}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        setSelectedNetwork(network)
                        if (selectedToken && selectedToken.chainId !== network.id) {
                          setSelectedToken(null)
                        }
                        setShowChainDropdown(false)
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold overflow-hidden">
                        {network.logoUrl ? (
                          <img src={network.logoUrl} alt={network.name} className="h-10 w-10 object-contain" />
                        ) : (
                          network.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{network.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">Testnet</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  if (errors.amount) setErrors({ ...errors, amount: undefined })
                }}
                className={`h-14 text-lg bg-secondary/50 ${errors.amount ? "border-red-500" : ""}`}
              />
            </div>
            {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
            {selectedToken && !errors.amount && (
              <p className="text-xs text-muted-foreground">Maximum: 1500 {selectedToken.symbol} per request</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Wallet Address</Label>
            <Input
              type="text"
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => {
                setWalletAddress(e.target.value)
                if (errors.address) setErrors({ ...errors, address: undefined })
              }}
              className={`h-14 font-mono text-sm bg-secondary/50 ${errors.address ? "border-red-500" : ""}`}
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
          </div>

          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-primary/50"
            disabled={!selectedToken || !selectedNetwork || !amount || !walletAddress || requestState === "processing"}
            onClick={handleRequestTokens}
          >
            {requestState === "processing" ? "Requesting..." : "Request Tokens"}
          </Button>

          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Beta Testing Only</p>
                <p className="text-xs text-muted-foreground">
                  These are test tokens for beta testing purposes only and have no real value. You can request tokens
                  once every 24 hours per wallet address.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <FaucetStatusModal
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        state={requestState === "idle" ? "processing" : requestState}
        tokenSymbol={selectedToken?.symbol ?? null}
        tokenLogoUrl={selectedToken?.logoUrl ?? null}
        chainName={selectedNetwork?.name ?? null}
        chainLogoUrl={selectedNetwork?.logoUrl ?? null}
        amount={amount}
        txHash={txHash}
        errorMessage={requestError}
        onRetry={handleRequestTokens}
      />
    </>
  )
}
