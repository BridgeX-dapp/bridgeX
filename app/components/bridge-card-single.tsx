"use client"

import { useEffect, useMemo, useState } from "react"
import type { CatalogChain, CatalogToken } from "@/lib/relayer/catalog"
import { usePublicClient } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TokenSelectModal } from "@/components/token-select-modal"
import { RecipientModal } from "@/components/recipient-modal"
import { ChainSelectModal } from "@/components/chain-select-modal"
import { TransactionStatusModal } from "@/components/transaction-status-modal"
import { useRelayerCatalog } from "@/contexts/relayer-catalog-context"
import { useEvmWallet } from "@/contexts/evm-wallet-context"
import { useCasperWallet } from "@/contexts/casper-wallet-context"
import { useCasperTransactions } from "@/contexts/casper-transactions-context"
import { useEvmClientConfig } from "@/contexts/evm-client-config-context"
import { useBridgeTransaction } from "@/hooks/use-bridge-transaction"
import { resolveBridgeCoreAddress } from "@/lib/evm/config"
import { erc20Abi } from "@/lib/evm/erc20-abi"
import { formatCasperRecipient, formatEvmRecipient } from "@/lib/recipient"
import { formatAmountFromBaseUnits } from "@/lib/amount"
import { parseAmountToBaseUnits } from "@/lib/amount"

type BridgeCardSingleProps = {
  initialSourceChain?: string
  initialDestChain?: string
  initialSourceToken?: string
}

function resolveChainDisplayName(chain: CatalogChain) {
  return chain.displayName ?? chain.name
}

function normalizeChainName(value: string) {
  return value.trim().toLowerCase()
}

function isEvmChain(chain?: CatalogChain | null) {
  return chain?.kind === "EVM"
}

function isCasperChain(chain?: CatalogChain | null) {
  return chain?.kind === "CASPER"
}

function uniqueById<T extends { id: number }>(items: T[]) {
  const seen = new Set<number>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function BridgeCardSingle({
  initialSourceChain,
  initialDestChain,
  initialSourceToken,
}: BridgeCardSingleProps) {
  const { chains, tokens, tokenPairs, loading, error } = useRelayerCatalog()
  const { address, chainId: walletChainId, switchChain, connect } = useEvmWallet()
  const casperWallet = useCasperWallet()
  const casperTx = useCasperTransactions()
  const evmConfig = useEvmClientConfig()
  const [showSourceTokenModal, setShowSourceTokenModal] = useState(false)
  const [showRecipientModal, setShowRecipientModal] = useState(false)
  const [showFromChainModal, setShowFromChainModal] = useState(false)
  const [showToChainModal, setShowToChainModal] = useState(false)
  const [isWalletSectionExpanded, setIsWalletSectionExpanded] = useState(false)
 const [useOldConnectedSelector, setuseOldConnectedSelector] = useState(false)
  const [sourceChain, setSourceChain] = useState<CatalogChain | null>(null)
  const [destChain, setDestChain] = useState<CatalogChain | null>(null)
  const [sourceToken, setSourceToken] = useState<CatalogToken | null>(null)
  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState<string>("")
  const [recipientTouched, setRecipientTouched] = useState(false)
  const [recipientError, setRecipientError] = useState<string | null>(null)
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false)

  const [evmBalance, setEvmBalance] = useState<string | null>(null)
  const [evmAllowance, setEvmAllowance] = useState<string | null>(null)
  const [evmLoading, setEvmLoading] = useState(false)
  const [casperBalance, setCasperBalance] = useState<string | null>(null)
  const [casperAllowance, setCasperAllowance] = useState<string | null>(null)
  const [casperLoading, setCasperLoading] = useState(false)

  const chainMap = useMemo(() => new Map(chains.map((chain) => [chain.id, chain])), [chains])
  const tokenMap = useMemo(() => new Map(tokens.map((token) => [token.id, token])), [tokens])

  const pairsWithRefs = useMemo(() => {
    return tokenPairs.map((pair) => ({
      ...pair,
      sourceChain: pair.sourceChain ?? chainMap.get(pair.sourceChainId),
      destChain: pair.destChain ?? chainMap.get(pair.destChainId),
      sourceToken: pair.sourceToken ?? tokenMap.get(pair.sourceTokenId),
      destToken: pair.destToken ?? tokenMap.get(pair.destTokenId),
    }))
  }, [tokenPairs, chainMap, tokenMap])

  const sourceChainOptions = useMemo(() => chains, [chains])

  const destChainOptions = useMemo(() => {
    if (!sourceChain) return chains
    const filtered = pairsWithRefs.filter((pair) => pair.sourceChainId === sourceChain.id)
    const withToken = sourceToken ? filtered.filter((pair) => pair.sourceTokenId === sourceToken.id) : filtered
    const possible = withToken.map((pair) => pair.destChain).filter(Boolean) as CatalogChain[]
    return uniqueById(possible)
  }, [chains, pairsWithRefs, sourceChain, sourceToken])

  const sourceTokenOptions = useMemo(() => {
    if (!sourceChain) return []
    const filtered = pairsWithRefs.filter((pair) => pair.sourceChainId === sourceChain.id)
    const withDest = destChain ? filtered.filter((pair) => pair.destChainId === destChain.id) : filtered
    const tokensForChain = withDest.map((pair) => pair.sourceToken).filter(Boolean) as CatalogToken[]
    return uniqueById(tokensForChain).sort((a, b) => a.symbol.localeCompare(b.symbol))
  }, [pairsWithRefs, sourceChain, destChain])

  const destToken = useMemo(() => {
    if (!sourceChain || !destChain || !sourceToken) return null
    const matches = pairsWithRefs.filter(
      (pair) =>
        pair.sourceChainId === sourceChain.id &&
        pair.destChainId === destChain.id &&
        pair.sourceTokenId === sourceToken.id,
    )
    const tokensForChain = matches.map((pair) => pair.destToken).filter(Boolean) as CatalogToken[]
    return tokensForChain.sort((a, b) => a.symbol.localeCompare(b.symbol))[0] ?? null
  }, [pairsWithRefs, sourceChain, destChain, sourceToken])

  const bridgeTx = useBridgeTransaction({
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    amount,
    recipient,
  })

  const parsedAmount = useMemo(() => {
    if (!sourceToken) return null
    return parseAmountToBaseUnits(amount, sourceToken.decimals)
  }, [amount, sourceToken])

  useEffect(() => {
    if (!chains.length) return
    if (!sourceChain) {
      const baseSepolia = chains.find(
        (chain) => chain.evmChainId === 84532 || normalizeChainName(chain.name) === "basesepolia",
      )
      setSourceChain(baseSepolia ?? chains[0])
    }
  }, [chains, sourceChain])

  useEffect(() => {
    if (!sourceChain) return
    if (!destChain || !destChainOptions.some((chain) => chain.id === destChain.id)) {
      setDestChain(destChainOptions[0] ?? null)
    }
  }, [destChain, destChainOptions, sourceChain])

  useEffect(() => {
    if (!sourceToken || !sourceTokenOptions.some((token) => token.id === sourceToken.id)) {
      setSourceToken(sourceTokenOptions[0] ?? null)
    }
  }, [sourceToken, sourceTokenOptions])

  useEffect(() => {
    if (!initialSourceChain || !chains.length) return
    const match = chains.find((chain) => normalizeChainName(chain.name) === normalizeChainName(initialSourceChain))
    if (match) setSourceChain(match)
  }, [chains, initialSourceChain])

  useEffect(() => {
    if (!initialDestChain || !chains.length) return
    const match = chains.find((chain) => normalizeChainName(chain.name) === normalizeChainName(initialDestChain))
    if (match) setDestChain(match)
  }, [chains, initialDestChain])

  useEffect(() => {
    if (!initialSourceToken || !tokens.length) return
    const match = tokens.find((token) => token.symbol.toLowerCase() === initialSourceToken.toLowerCase())
    if (match) setSourceToken(match)
  }, [initialSourceToken, tokens])

  const handleSwitchNetworks = () => {
    const temp = sourceChain
    setSourceChain(destChain)
    setDestChain(temp ?? null)
  }

  const requiresEvmWallet = isEvmChain(sourceChain)
  const needsConnect = requiresEvmWallet && !address
  const needsSwitch =
    requiresEvmWallet &&
    !needsConnect &&
    Boolean(sourceChain?.evmChainId && walletChainId && sourceChain.evmChainId !== walletChainId)
  const needsCasperConnect = isCasperChain(sourceChain) && !casperWallet.account?.public_key

  const evmInsufficientBalance =
    isEvmChain(sourceChain) && parsedAmount !== null && evmBalance !== null
      ? BigInt(evmBalance) < parsedAmount
      : false
  const casperInsufficientBalance =
    isCasperChain(sourceChain) && parsedAmount !== null && casperBalance !== null
      ? BigInt(casperBalance) < parsedAmount
      : false
  const isBalanceBlocked = evmInsufficientBalance || casperInsufficientBalance

  const publicClient = usePublicClient({
    chainId: sourceChain?.evmChainId ?? undefined,
  })

  useEffect(() => {
    const fetchEvmState = async () => {
      if (!isEvmChain(sourceChain)) {
        setEvmBalance(null)
        setEvmAllowance(null)
        return
      }
      if (!address || !sourceToken?.contractAddress || !sourceChain?.evmChainId) {
        setEvmBalance(null)
        setEvmAllowance(null)
        return
      }
      if (!publicClient) return
      setEvmLoading(true)
      try {
        const balance = await publicClient.readContract({
          address: sourceToken.contractAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        })
        const spender = resolveBridgeCoreAddress(evmConfig, sourceChain.evmChainId)
        const allowance = await publicClient.readContract({
          address: sourceToken.contractAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address as `0x${string}`, spender as `0x${string}`],
        })
        setEvmBalance(balance.toString())
        setEvmAllowance(allowance.toString())
      } catch {
        setEvmBalance(null)
        setEvmAllowance(null)
      } finally {
        setEvmLoading(false)
      }
    }

    fetchEvmState()
  }, [address, evmConfig, publicClient, sourceChain, sourceToken])

  useEffect(() => {
    const fetchCasperState = async () => {
      if (!isCasperChain(sourceChain)) {
        setCasperBalance(null)
        setCasperAllowance(null)
        return
      }
      if (!casperWallet.accountHash || !sourceToken?.contractHash) {
        setCasperBalance(null)
        setCasperAllowance(null)
        return
      }
      setCasperLoading(true)
      try {
        const balance = await casperTx.getTokenBalance({
          accountHash: casperWallet.accountHash,
          tokenContractHash: sourceToken.contractHash,
          tokenContractPackageHash: sourceToken.contractPackageHash ?? undefined,
        })
        const allowance = await casperTx.getTokenAllowance({
          ownerAccountHash: casperWallet.accountHash,
          tokenContractHash: sourceToken.contractHash,
        })
        setCasperBalance(balance)
        setCasperAllowance(allowance.toString())
      } catch {
        setCasperBalance(null)
        setCasperAllowance(null)
      } finally {
        setCasperLoading(false)
      }
    }

    fetchCasperState()
  }, [casperTx, casperWallet.accountHash, sourceChain, sourceToken])

  const recipientFormat = useMemo(() => {
    if (!recipient) return null
    if (destChain?.kind === "EVM") return formatEvmRecipient(recipient)
    if (destChain?.kind === "CASPER") return formatCasperRecipient(recipient)
    return null
  }, [destChain?.kind, recipient])

  useEffect(() => {
    if (!recipient) {
      setRecipientError(null)
      return
    }
    if (!recipientFormat) {
      setRecipientError(null)
      return
    }
    setRecipientError(recipientFormat.isValid ? null : recipientFormat.error ?? "Invalid recipient.")
  }, [recipient, recipientFormat])

  useEffect(() => {
    if (recipient || recipientTouched) return
    if (destChain?.kind === "EVM" && address) {
      setRecipient(address)
      return
    }
    if (destChain?.kind === "CASPER" && casperWallet.account?.public_key) {
      setRecipient(casperWallet.account.public_key)
    }
  }, [address, casperWallet.account?.public_key, destChain?.kind, recipient, recipientTouched])

  const bridgeDisabled =
    !sourceToken ||
    !destToken ||
    !amount ||
    !recipient ||
    !sourceChain ||
    !destChain ||
    Boolean(recipientError) ||
    isBalanceBlocked
  const actionDisabled = !(needsConnect || needsSwitch || needsCasperConnect || !bridgeDisabled) || isCheckingAllowance

  const actionLabel = needsConnect
    ? "Connect EVM Wallet"
    : needsCasperConnect
      ? "Connect Casper Wallet"
    : needsSwitch
      ? `Switch chain to ${sourceChain ? resolveChainDisplayName(sourceChain) : ""}`
      : "Bridge Assets"

  const handleAction = async () => {
    if (needsConnect) {
      connect()
      return
    }
    if (needsCasperConnect) {
      casperWallet.connect()
      return
    }
    if (needsSwitch) {
      if (sourceChain?.evmChainId) {
        switchChain(sourceChain.evmChainId)
      }
      return
    }
    setIsCheckingAllowance(true)
    try {
      await bridgeTx.startBridge()
    } finally {
      setIsCheckingAllowance(false)
    }
  }

  const handleRecipientConnect = () => {
    if (destChain?.kind === "EVM") {
      connect()
      return
    }
    if (destChain?.kind === "CASPER") {
      casperWallet.connect()
    }
  }

  const handleUseConnectedRecipient = () => {
    if (destChain?.kind === "EVM" && address) {
      setRecipient(address)
      setRecipientTouched(true)
      return
    }
    if (destChain?.kind === "CASPER" && casperWallet.account?.public_key) {
      setRecipient(casperWallet.account.public_key)
      setRecipientTouched(true)
    }
  }

  return (
    <>
      <Card className="bg-card border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Bridge Assets (Single Token)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? <div className="text-sm text-muted-foreground">Loading supported assets...</div> : null}
          {error ? <div className="text-sm text-destructive">Catalog error: {error}</div> : null}

          <div className="space-y-2">
            <Label>Select Token</Label>
            <Button
              variant="outline"
              className="w-full h-16 justify-between text-left hover:bg-accent/50 transition-colors bg-transparent"
              onClick={() => setShowSourceTokenModal(true)}
              disabled={!sourceChain}
            >
              {sourceToken ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold overflow-hidden">
                    {sourceToken.logoUrl ? (
                      <img src={sourceToken.logoUrl} alt={sourceToken.symbol} className="h-10 w-10 object-contain" />
                    ) : (
                      sourceToken.symbol.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{sourceToken.symbol}</div>
                    <div className="text-xs text-muted-foreground">{sourceToken.name}</div>
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">Choose a token</span>
              )}
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>

          <div className="space-y-2">
            <Label>From</Label>
            <button
              onClick={() => setShowFromChainModal(true)}
              className="w-full flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold overflow-hidden">
                {sourceChain?.logoUrl ? (
                  <img src={sourceChain.logoUrl} alt={sourceChain.name} className="h-10 w-10 object-contain" />
                ) : (
                  (sourceChain ? resolveChainDisplayName(sourceChain) : "?").slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">{sourceChain ? resolveChainDisplayName(sourceChain) : "Select"}</div>
                <div className="text-xs text-muted-foreground">Source Chain</div>
              </div>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="flex justify-center -my-3 relative z-10">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full h-10 w-10 bg-card hover:bg-accent transition-all duration-300 hover:rotate-180"
              onClick={handleSwitchNetworks}
              disabled={!sourceChain || !destChain}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </Button>
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <button
              onClick={() => setShowToChainModal(true)}
              className="w-full flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold overflow-hidden">
                {destChain?.logoUrl ? (
                  <img src={destChain.logoUrl} alt={destChain.name} className="h-10 w-10 object-contain" />
                ) : (
                  (destChain ? resolveChainDisplayName(destChain) : "?").slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">{destChain ? resolveChainDisplayName(destChain) : "Select"}</div>
                <div className="text-xs text-muted-foreground">Destination Chain</div>
              </div>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            <Label>Destination Token</Label>
            <div className="w-full h-16 flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4">
              {destToken ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold overflow-hidden">
                    {destToken.logoUrl ? (
                      <img src={destToken.logoUrl} alt={destToken.symbol} className="h-10 w-10 object-contain" />
                    ) : (
                      destToken.symbol.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{destToken.symbol}</div>
                    <div className="text-xs text-muted-foreground">{destToken.name}</div>
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">No token pair found</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 text-lg pr-20 bg-secondary/50"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary"
                onClick={() => setAmount("1000")}
              >
                MAX
              </Button>
            </div>
            {isEvmChain(sourceChain) && sourceToken ? (
              <p className="text-xs text-muted-foreground">
                Balance:{" "}
                {evmLoading
                  ? "Loading..."
                  : evmBalance
                    ? formatAmountFromBaseUnits(BigInt(evmBalance), sourceToken.decimals)
                    : "-"}{" "}
                {sourceToken.symbol} · Allowance:{" "}
                {evmLoading
                  ? "Loading..."
                  : evmAllowance
                    ? formatAmountFromBaseUnits(BigInt(evmAllowance), sourceToken.decimals)
                    : "-"}
              </p>
            ) : null}
            {isCasperChain(sourceChain) && sourceToken ? (
              <p className="text-xs text-muted-foreground">
                Balance:{" "}
                {casperLoading
                  ? "Loading..."
                  : casperBalance
                    ? formatAmountFromBaseUnits(BigInt(casperBalance), sourceToken.decimals)
                    : "-"}{" "}
                {sourceToken.symbol} · Allowance:{" "}
                {casperLoading
                  ? "Loading..."
                  : casperAllowance
                    ? formatAmountFromBaseUnits(BigInt(casperAllowance), sourceToken.decimals)
                    : "-"}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Recipient</Label>
            {recipient ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex-1 font-mono text-sm truncate">{recipient}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRecipient("")
                    setRecipientTouched(true)
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden bg-secondary/30">
                <button
                  onClick={() => setIsWalletSectionExpanded(!isWalletSectionExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                >
                  <span className="font-medium">Select Wallet</span>
                  <svg
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                      isWalletSectionExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isWalletSectionExpanded ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
                  } overflow-hidden`}
                >
                <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                    {((destChain?.kind === "EVM" && address) ||
                    (destChain?.kind === "CASPER" && casperWallet.account?.public_key)) ? (
                      <Button
                        variant="outline"
                        className="h-12 bg-background hover:bg-accent transition-colors"
                        onClick={() => {
                          handleUseConnectedRecipient()
                          setIsWalletSectionExpanded(false)
                        }}
                      >
                        Use connected wallet
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="h-12 bg-background hover:bg-accent transition-colors"
                        onClick={() => {
                          handleRecipientConnect()
                          setIsWalletSectionExpanded(false)
                        }}
                      >
                        {destChain?.kind === "CASPER"
                          ? "Connect Casper Wallet"
                          : destChain?.kind === "EVM"
                            ? "Connect EVM Wallet"
                            : "Connect Wallet"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="h-12 bg-background hover:bg-accent transition-colors"
                      onClick={() => {
                        setShowRecipientModal(true)
                        setIsWalletSectionExpanded(false)
                      }}
                    >
                      Paste Address
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {recipientError ? <p className="text-xs text-destructive mt-2">{recipientError}</p> : null}
            {/*!recipientError &&
            recipient && 
            ((destChain?.kind === "EVM" && address) || (destChain?.kind === "CASPER" && casperWallet.account?.public_key)) ? (
              <Button variant="ghost" size="sm" onClick={handleUseConnectedRecipient} className="mt-2">
                Use connected wallet
              </Button>
            ) : null*/}
          </div>

          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-primary/50"
            disabled={actionDisabled}
            onClick={handleAction}
          >
            {isCheckingAllowance ? "Checking allowance..." : actionLabel}
          </Button>
        </CardContent>
      </Card>

      <TokenSelectModal
        open={showSourceTokenModal}
        onOpenChange={setShowSourceTokenModal}
        onSelectToken={(token) => {
          setSourceToken(token)
          setShowSourceTokenModal(false)
        }}
        tokens={sourceTokenOptions}
        title="Select Source Token"
      />

      <RecipientModal
        open={showRecipientModal}
        onOpenChange={setShowRecipientModal}
        onSubmit={(addressValue) => {
          setRecipient(addressValue)
          setRecipientTouched(true)
          setShowRecipientModal(false)
        }}
      />

      <ChainSelectModal
        open={showFromChainModal}
        onOpenChange={setShowFromChainModal}
        onSelectChain={(chain) => {
          setSourceChain(chain)
          setShowFromChainModal(false)
        }}
        chains={sourceChainOptions}
        title="Select Source Chain"
      />

      <ChainSelectModal
        open={showToChainModal}
        onOpenChange={setShowToChainModal}
        onSelectChain={(chain) => {
          setDestChain(chain)
          setShowToChainModal(false)
        }}
        chains={destChainOptions}
        title="Select Destination Chain"
      />

      <TransactionStatusModal
        open={bridgeTx.state.open}
        step={bridgeTx.state.step}
        isLoading={bridgeTx.state.isLoading}
        errorMessage={bridgeTx.state.errorMessage}
        errorStep={bridgeTx.state.errorStep}
        sourceTxHash={bridgeTx.state.sourceTxHash}
        destTxHash={bridgeTx.state.destTxHash}
        sourceChainName={sourceChain?.name ?? null}
        destChainName={destChain?.name ?? null}
        onOpenChange={(next) => {
          if (!next) bridgeTx.closeModal()
        }}
        onIncreaseAllowance={bridgeTx.executeApproval}
        onContinue={bridgeTx.continueAfterApproval}
        onRetry={bridgeTx.retry}
      />
    </>
  )
}
