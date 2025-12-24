"use client"

import { useMemo, useState } from "react"
import type { Address, Hex } from "viem"
import { isAddress } from "viem"
import { usePublicClient } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEvmWallet } from "@/contexts/evm-wallet-context"
import { useEvmBridge } from "@/hooks/use-evm-bridge"
import { erc20Abi } from "@/lib/evm/erc20-abi"

type StatusLine = {
  label: string
  value: string
}

function toBytes32Address(address: Address): Hex {
  return `0x${address.slice(2).padStart(64, "0")}` as Hex
}

function isBytes32(value: string): value is Hex {
  return /^0x[0-9a-fA-F]{64}$/.test(value)
}

export function EvmTestPanel() {
  const { address, isConnected, chainId } = useEvmWallet()
  const { bridgeCoreAddress, approve, lock, burn, waitForTransaction } = useEvmBridge()
  const publicClient = usePublicClient()

  const [tokenAddress, setTokenAddress] = useState("0xc674Fc371792581A12Cd9F452eD7EC24Fba6e7dD")
  const [spenderAddress, setSpenderAddress] = useState("")
  const [recipientBytes32, setRecipientBytes32] = useState("0xddfcf412115cf2641e8182cd29f9996e28d7a2b8954b4b96990b80d70934963c")
  const [destinationChainId, setDestinationChainId] = useState("84532")
  const [amountRaw, setAmountRaw] = useState("1")
  const [balance, setBalance] = useState<string | null>(null)
  const [allowance, setAllowance] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)
  const [lastTxStatus, setLastTxStatus] = useState<string | null>(null)

  const statusLines = useMemo<StatusLine[]>(
    () => [
      { label: "Connected", value: isConnected ? "yes" : "no" },
      { label: "Chain Id", value: chainId ? String(chainId) : "-" },
      { label: "Bridge Core", value: bridgeCoreAddress },
      { label: "Last Tx", value: lastTxHash ?? "-" },
      { label: "Tx Status", value: lastTxStatus ?? "-" },
    ],
    [bridgeCoreAddress, chainId, isConnected, lastTxHash, lastTxStatus],
  )

  const parsedAmount = useMemo(() => {
    try {
      return BigInt(amountRaw || "0")
    } catch {
      return null
    }
  }, [amountRaw])

  const requireAddress = (value: string, label: string): Address => {
    if (!value || !isAddress(value)) {
      throw new Error(`${label} must be a valid EVM address.`)
    }
    return value as Address
  }

  const requireRecipient = (value: string): Hex => {
    if (!isBytes32(value)) {
      throw new Error("Recipient must be a 32-byte hex string.")
    }
    return value as Hex
  }

  const requirePublicClient = () => {
    if (!publicClient) {
      throw new Error("Public client not ready.")
    }
    return publicClient
  }

  const handleFetchBalance = async () => {
    if (!address) {
      setError("Connect an EVM wallet first.")
      return
    }
    setError(null)
    setBusy("balance")
    try {
      const token = requireAddress(tokenAddress, "Token address")
      const value = await requirePublicClient().readContract({
        address: token,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      })
      setBalance(value.toString())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance.")
    } finally {
      setBusy(null)
    }
  }

  const handleFetchAllowance = async () => {
    if (!address) {
      setError("Connect an EVM wallet first.")
      return
    }
    setError(null)
    setBusy("allowance")
    try {
      const token = requireAddress(tokenAddress, "Token address")
      const spender = spenderAddress ? requireAddress(spenderAddress, "Spender address") : bridgeCoreAddress
      const value = await requirePublicClient().readContract({
        address: token,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, spender],
      })
      setAllowance(value.toString())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch allowance.")
    } finally {
      setBusy(null)
    }
  }

  const handleApprove = async () => {
    if (!address) {
      setError("Connect an EVM wallet first.")
      return
    }
    if (!parsedAmount) {
      setError("Amount must be a valid integer.")
      return
    }
    setError(null)
    setBusy("approve")
    setLastTxStatus("pending")
    try {
      const token = requireAddress(tokenAddress, "Token address")
      const spender = spenderAddress ? requireAddress(spenderAddress, "Spender address") : bridgeCoreAddress
      const hash = await approve({ token, spender, amount: parsedAmount })
      setLastTxHash(hash)
      await waitForTransaction(hash)
      setLastTxStatus("success")
    } catch (err) {
      setLastTxStatus("failed")
      setError(err instanceof Error ? err.message : "Approve failed.")
    } finally {
      setBusy(null)
    }
  }

  const handleLock = async () => {
    if (!address) {
      setError("Connect an EVM wallet first.")
      return
    }
    if (!parsedAmount) {
      setError("Amount must be a valid integer.")
      return
    }
    const chain = Number(destinationChainId || "0")
    if (!Number.isFinite(chain) || chain <= 0) {
      setError("Destination chain id must be a positive number.")
      return
    }
    setError(null)
    setBusy("lock")
    setLastTxStatus("pending")
    try {
      const token = requireAddress(tokenAddress, "Token address")
      const recipient = requireRecipient(recipientBytes32)
      const hash = await lock({
        token,
        amount: parsedAmount,
        destinationChainId: BigInt(chain),
        recipientBytes32: recipient,
      })
      setLastTxHash(hash)
      await waitForTransaction(hash)
      setLastTxStatus("success")
    } catch (err) {
      setLastTxStatus("failed")
      setError(err instanceof Error ? err.message : "Lock failed.")
    } finally {
      setBusy(null)
    }
  }

  const handleBurn = async () => {
    if (!address) {
      setError("Connect an EVM wallet first.")
      return
    }
    if (!parsedAmount) {
      setError("Amount must be a valid integer.")
      return
    }
    const chain = Number(destinationChainId || "0")
    if (!Number.isFinite(chain) || chain <= 0) {
      setError("Destination chain id must be a positive number.")
      return
    }
    setError(null)
    setBusy("burn")
    setLastTxStatus("pending")
    try {
      const wrappedToken = requireAddress(tokenAddress, "Wrapped token address")
      const recipient = requireRecipient(recipientBytes32)
      const hash = await burn({
        wrappedToken,
        amount: parsedAmount,
        destinationChainId: BigInt(chain),
        recipientBytes32: recipient,
      })
      setLastTxHash(hash)
      await waitForTransaction(hash)
      setLastTxStatus("success")
    } catch (err) {
      setLastTxStatus("failed")
      setError(err instanceof Error ? err.message : "Burn failed.")
    } finally {
      setBusy(null)
    }
  }

  const setRecipientFromWallet = () => {
    if (!address) return
    setRecipientBytes32(toBytes32Address(address))
  }

  return (
    <Card className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">EVM Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Token Address</Label>
          <Input
            value={tokenAddress}
            onChange={(event) => setTokenAddress(event.target.value.trim())}
            placeholder="0x..."
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label>Spender Address (optional)</Label>
          <Input
            value={spenderAddress}
            onChange={(event) => setSpenderAddress(event.target.value.trim())}
            placeholder={bridgeCoreAddress}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label>Recipient (bytes32)</Label>
          <Input
            value={recipientBytes32}
            onChange={(event) => setRecipientBytes32(event.target.value.trim())}
            placeholder="0x..."
            className="font-mono"
          />
          <Button variant="ghost" size="sm" onClick={setRecipientFromWallet} disabled={!address}>
            Use connected wallet
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Destination Chain Id</Label>
            <Input
              value={destinationChainId}
              onChange={(event) => setDestinationChainId(event.target.value)}
              placeholder="84532"
            />
          </div>
          <div className="space-y-2">
            <Label>Amount (raw uint256)</Label>
            <Input value={amountRaw} onChange={(event) => setAmountRaw(event.target.value)} placeholder="1000000" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleFetchBalance} disabled={busy === "balance"}>
            {busy === "balance" ? "Loading..." : "Fetch Balance"}
          </Button>
          <Button variant="outline" onClick={handleFetchAllowance} disabled={busy === "allowance"}>
            {busy === "allowance" ? "Loading..." : "Fetch Allowance"}
          </Button>
          <Button onClick={handleApprove} disabled={busy === "approve"}>
            {busy === "approve" ? "Approving..." : "Approve"}
          </Button>
          <Button onClick={handleLock} disabled={busy === "lock"}>
            {busy === "lock" ? "Locking..." : "Lock"}
          </Button>
          <Button variant="secondary" onClick={handleBurn} disabled={busy === "burn"}>
            {busy === "burn" ? "Burning..." : "Burn"}
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm space-y-1">
          <div>Balance: {balance ?? "-"}</div>
          <div>Allowance: {allowance ?? "-"}</div>
          {statusLines.map((line) => (
            <div key={line.label}>
              {line.label}: {line.value}
            </div>
          ))}
          {error ? <div className="text-destructive">Error: {error}</div> : null}
        </div>
      </CardContent>
    </Card>
  )
}
