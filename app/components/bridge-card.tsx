"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TokenSelectModal } from "@/components/token-select-modal"
import { RecipientModal } from "@/components/recipient-modal"
import { ChainSelectModal } from "@/components/chain-select-modal"
import { PopularTokens } from "@/components/popular-tokens"

type Token = {
  symbol: string
  name: string
  logo: string
  balance: string
}

type Network = {
  id: string
  name: string
  logo: string
}

type BridgeCardProps = {
  initialSourceChain?: string
  initialDestChain?: string
  initialSourceToken?: string
  initialDestToken?: string
}

export function BridgeCard({ initialSourceChain, initialDestChain, initialSourceToken }: BridgeCardProps) {
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [showRecipientModal, setShowRecipientModal] = useState(false)
  const [showFromChainModal, setShowFromChainModal] = useState(false)
  const [showToChainModal, setShowToChainModal] = useState(false)
  const [isWalletSectionExpanded, setIsWalletSectionExpanded] = useState(false)

  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [fromNetwork, setFromNetwork] = useState<Network>({
    id: "ethereum",
    name: "Ethereum",
    logo: "⟠",
  })
  const [toNetwork, setToNetwork] = useState<Network>({
    id: "arbitrum",
    name: "Arbitrum",
    logo: "◆",
  })
  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState<string>("")

  useEffect(() => {
    const chains: Record<string, Network> = {
      ethereum: { id: "ethereum", name: "Ethereum", logo: "⟠" },
      arbitrum: { id: "arbitrum", name: "Arbitrum", logo: "◆" },
      polygon: { id: "polygon", name: "Polygon", logo: "◇" },
      optimism: { id: "optimism", name: "Optimism", logo: "🔴" },
      base: { id: "base", name: "Base", logo: "🔵" },
    }

    const tokens: Record<string, Token> = {
      eth: { symbol: "ETH", name: "Ethereum", logo: "⟠", balance: "2.45" },
      usdc: { symbol: "USDC", name: "USD Coin", logo: "💵", balance: "1,234.56" },
      usdt: { symbol: "USDT", name: "Tether", logo: "₮", balance: "500.00" },
      dai: { symbol: "DAI", name: "Dai Stablecoin", logo: "◈", balance: "750.25" },
    }

    if (initialSourceChain && chains[initialSourceChain]) {
      setFromNetwork(chains[initialSourceChain])
    }
    if (initialDestChain && chains[initialDestChain]) {
      setToNetwork(chains[initialDestChain])
    }
    if (initialSourceToken && tokens[initialSourceToken]) {
      setSelectedToken(tokens[initialSourceToken])
    }
  }, [initialSourceChain, initialDestChain, initialSourceToken])

  const handleSwitchNetworks = () => {
    const temp = fromNetwork
    setFromNetwork(toNetwork)
    setToNetwork(temp)
  }

  return (
    <>
      <Card className="bg-card border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Bridge Assets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PopularTokens onSelectToken={(token) => setSelectedToken(token)} />

          {/* Token Selection */}
          <div className="space-y-2">
            <Label>Select Token</Label>
            <Button
              variant="outline"
              className="w-full h-16 justify-between text-left hover:bg-accent/50 transition-colors bg-transparent"
              onClick={() => setShowTokenModal(true)}
            >
              {selectedToken ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                    {selectedToken.logo}
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
          </div>

          <div className="space-y-2">
            <Label>From</Label>
            <button
              onClick={() => setShowFromChainModal(true)}
              className="w-full flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                {fromNetwork.logo}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">{fromNetwork.name}</div>
                <div className="text-xs text-muted-foreground">Source Chain</div>
              </div>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Switch Networks Button */}
          <div className="flex justify-center -my-3 relative z-10">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full h-10 w-10 bg-card hover:bg-accent transition-all duration-300 hover:rotate-180"
              onClick={handleSwitchNetworks}
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
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-xl">
                {toNetwork.logo}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">{toNetwork.name}</div>
                <div className="text-xs text-muted-foreground">Destination Chain</div>
              </div>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Amount Input */}
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
            {selectedToken && (
              <p className="text-xs text-muted-foreground">
                Balance: {selectedToken.balance} {selectedToken.symbol}
              </p>
            )}
          </div>

          {/* Recipient */}
          <div className="space-y-2">
            <Label>Recipient</Label>
            {recipient ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex-1 font-mono text-sm truncate">{recipient}</div>
                <Button size="sm" variant="ghost" onClick={() => setRecipient("")}>
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
                    <Button
                      variant="outline"
                      className="h-12 bg-background hover:bg-accent transition-colors"
                      onClick={() => {
                        setRecipient("0x1234...5678")
                        setIsWalletSectionExpanded(false)
                      }}
                    >
                      Connect Wallet
                    </Button>
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
          </div>

          {/* Bridge Button */}
          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-primary/50"
            disabled={!selectedToken || !amount || !recipient}
          >
            Bridge Assets
          </Button>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="text-xs text-muted-foreground">Estimated Time</div>
              <div className="text-sm font-semibold mt-1">~2-3 min</div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="text-xs text-muted-foreground">Network Fee</div>
              <div className="text-sm font-semibold mt-1">~$2.50</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TokenSelectModal
        open={showTokenModal}
        onOpenChange={setShowTokenModal}
        onSelectToken={(token) => {
          setSelectedToken(token)
          setShowTokenModal(false)
        }}
      />

      <RecipientModal
        open={showRecipientModal}
        onOpenChange={setShowRecipientModal}
        onSubmit={(address) => {
          setRecipient(address)
          setShowRecipientModal(false)
        }}
      />

      <ChainSelectModal
        open={showFromChainModal}
        onOpenChange={setShowFromChainModal}
        onSelectChain={(chain) => {
          setFromNetwork(chain)
          setShowFromChainModal(false)
        }}
        title="Select Source Chain"
      />

      <ChainSelectModal
        open={showToChainModal}
        onOpenChange={setShowToChainModal}
        onSelectChain={(chain) => {
          setToNetwork(chain)
          setShowToChainModal(false)
        }}
        title="Select Destination Chain"
      />
    </>
  )
}
