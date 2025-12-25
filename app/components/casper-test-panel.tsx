"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCasperWallet } from "@/contexts/casper-wallet-context"
import { useCasperTransactions } from "@/contexts/casper-transactions-context"
import { publicKeyToRecipientBytes32 } from "@/lib/casper/format"
import { loadCasperConfig } from "@/lib/config"

type StatusLine = {
  label: string
  value: string
}

export function CasperTestPanel() {
  const { account, accountHash } = useCasperWallet()
  const { transactions, getTokenBalance, getTokenAllowance, approve, lock, burn } = useCasperTransactions()
 // const cfg = loadCasperConfig()
  const [tokenContractHash, setTokenContractHash] = useState("b80fe386feaaec091183cd0587c5de3fd402e70d3f3b50e28f6b662b9a486d3e")
  const [tokenPackageHash, setTokenPackageHash] = useState("71ac1a199ad8a5d33bbba9c0fb8357e26db8282c15addfa92db9f36c04b16dc4")
  const [spenderContractHash, setSpenderContractHash] = useState("cc3cf45a1fc7556e2a82194a30fb0d87d9080e18330745f62f8bf83bb8bb2008")
  const [recipientBytes32, setRecipientBytes32] = useState("0x0000000000000000000000005f7260a3595713d6111c1381ba9bd520c0f6b4eb")
  const [destinationChainId, setDestinationChainId] = useState("5")
  const [amountRaw, setAmountRaw] = useState("0")
  const [balance, setBalance] = useState<string | null>(null)
  const [allowance, setAllowance] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const statusLines = useMemo<StatusLine[]>(
    () => [
      { label: "Approve", value: transactions.approve.status },
      { label: "Lock", value: transactions.lock.status },
      { label: "Burn", value: transactions.burn.status },
    ],
    [transactions],
  )

  const parsedAmount = useMemo(() => {
    try {
      return BigInt(amountRaw || "0")
    } catch {
      return null
    }
  }, [amountRaw])

  const isWalletReady = Boolean(account?.public_key && accountHash)

  const handleFetchBalance = async () => {
    if (!accountHash) {
      setError("Connect a Casper wallet first.")
      return
    }
    if (!tokenContractHash) {
      setError("Token contract hash is required.")
      return
    }
    setError(null)
    setBusy("balance")
    try {
      const value = await getTokenBalance({
        accountHash,
        tokenContractHash,
      })
      setBalance(value)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance.")
    } finally {
      setBusy(null)
    }
  }

  const handleFetchAllowance = async () => {
    if (!accountHash) {
      setError("Connect a Casper wallet first.")
      return
    }
    if (!tokenContractHash) {
      setError("Token contract hash is required.")
      return
    }
    setError(null)
    setBusy("allowance")
    try {
      const value = await getTokenAllowance({
        ownerAccountHash: accountHash,
        tokenContractHash,
        spenderContractHash: spenderContractHash || undefined,
      })
      setAllowance(value.toString())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch allowance.")
    } finally {
      setBusy(null)
    }
  }

  const handleApprove = async () => {
    if (!isWalletReady) {
      setError("Connect a Casper wallet first.")
      return
    }
    if (!tokenContractHash) {
      setError("Token contract hash is required.")
      return
    }
    if (!parsedAmount) {
      setError("Amount must be a valid integer.")
      return
    }
    setError(null)
    setBusy("approve")
    try {
      await approve({
        tokenContractHash,
        spenderContractHash: spenderContractHash || undefined,
        amount: parsedAmount,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed.")
    } finally {
      setBusy(null)
    }
  }

  const handleLock = async () => {
    if (!isWalletReady) {
      setError("Connect a Casper wallet first.")
      return
    }
    if (!tokenPackageHash) {
      setError("Token package hash is required.")
      return
    }
    if (!parsedAmount) {
      setError("Amount must be a valid integer.")
      return
    }
    if (!recipientBytes32) {
      setError("Recipient bytes32 is required.")
      return
    }
    const chainId = Number(destinationChainId || "0")
    if (!Number.isFinite(chainId) || chainId <= 0) {
      setError("Destination chain id must be a positive number.")
      return
    }
    setError(null)
    setBusy("lock")
    try {
      await lock({
        tokenContractPackageHash: tokenPackageHash,
        amount: parsedAmount,
        destinationChainId: chainId,
        recipientBytes32Hex: recipientBytes32,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lock failed.")
    } finally {
      setBusy(null)
    }
  }

  const handleBurn = async () => {
    if (!isWalletReady) {
      setError("Connect a Casper wallet first.")
      return
    }
    if (!tokenPackageHash) {
      setError("Token package hash is required.")
      return
    }
    if (!parsedAmount) {
      setError("Amount must be a valid integer.")
      return
    }
    if (!recipientBytes32) {
      setError("Recipient bytes32 is required.")
      return
    }
    const chainId = Number(destinationChainId || "0")
    if (!Number.isFinite(chainId) || chainId <= 0) {
      setError("Destination chain id must be a positive number.")
      return
    }
    setError(null)
    setBusy("burn")
    try {
      await burn({
        tokenContractPackageHash: tokenPackageHash,
        amount: parsedAmount,
        destinationChainId: chainId,
        recipientBytes32Hex: recipientBytes32,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Burn failed.")
    } finally {
      setBusy(null)
    }
  }

  const setRecipientFromWallet = () => {
    if (!account?.public_key) return
    setRecipientBytes32(publicKeyToRecipientBytes32(account.public_key))
  }

  return (
    <Card className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Casper Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Token Contract Hash</Label>
          <Input
            value={tokenContractHash}
            onChange={(event) => setTokenContractHash(event.target.value.trim())}
            placeholder="acc0756a..."
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label>Token Package Hash</Label>
          <Input
            value={tokenPackageHash}
            onChange={(event) => setTokenPackageHash(event.target.value.trim())}
            placeholder="package hash (lock/burn)"
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label>Spender Contract Hash (optional)</Label>
          <Input
            value={spenderContractHash}
            onChange={(event) => setSpenderContractHash(event.target.value.trim())}
            placeholder="bridge core hash (optional)"
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
          <Button variant="ghost" size="sm" onClick={setRecipientFromWallet} disabled={!account?.public_key}>
            Use connected wallet
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Destination Chain Id</Label>
            <Input
              value={destinationChainId}
              onChange={(event) => setDestinationChainId(event.target.value)}
              placeholder="5"
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
