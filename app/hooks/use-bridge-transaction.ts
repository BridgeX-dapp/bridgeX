"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { usePublicClient } from "wagmi"
import type { CatalogChain, CatalogToken } from "@/lib/relayer/catalog"
import { useCasperTransactions } from "@/contexts/casper-transactions-context"
import { useCasperWallet } from "@/contexts/casper-wallet-context"
import { useEvmWallet } from "@/contexts/evm-wallet-context"
import { useEvmClientConfig } from "@/contexts/evm-client-config-context"
import { useCasperClientConfig } from "@/contexts/casper-client-config-context"
import { useEvmBridge } from "@/hooks/use-evm-bridge"
import { formatCasperRecipient, formatEvmRecipient } from "@/lib/recipient"
import { parseAmountToBaseUnits } from "@/lib/amount"
import { ARBITRUM_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID, POLYGON_AMOY_CHAIN_ID } from "@/lib/evm/chains"
import { erc20Abi } from "@/lib/evm/erc20-abi"
import { mapCasperError, mapEvmError } from "@/lib/transaction-errors"

type ModalStep = "gas" | "allowance" | "approving" | "approved" | "processing" | "success" | "error"
type ErrorStep = "allowance" | "approval" | "source" | "destination" | "balance"

type BridgeInput = {
  sourceChain: CatalogChain | null
  destChain: CatalogChain | null
  sourceToken: CatalogToken | null
  destToken: CatalogToken | null
  amount: string
  recipient: string
}

type BridgeTxState = {
  open: boolean
  step: ModalStep
  errorMessage: string | null
  errorStep: ErrorStep | null
  sourceTxHash: string | null
  destTxHash: string | null
  isLoading: boolean
  gasMessage: string | null
  gasFaucetUrl: string | null
}

function normalizeTxHash(hash: string) {
  const trimmed = hash.trim()
  const clean = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed
  return clean.toLowerCase()
}

export function useBridgeTransaction(input: BridgeInput) {
  const casperTx = useCasperTransactions()
  const casperWallet = useCasperWallet()
  const evmWallet = useEvmWallet()
  const evmClient = useEvmClientConfig()
  const casperClient = useCasperClientConfig()
  const evmBridge = useEvmBridge()
  const publicClient = usePublicClient({
    chainId: input.sourceChain?.evmChainId ?? undefined,
  })
  const socketRef = useRef<Socket | null>(null)
  const [state, setState] = useState<BridgeTxState>({
    open: false,
    step: "allowance",
    errorMessage: null,
    errorStep: null,
    sourceTxHash: null,
    destTxHash: null,
    isLoading: false,
    gasMessage: null,
    gasFaucetUrl: null,
  })
  const [pendingAction, setPendingAction] = useState<"approve" | "bridge" | null>(null)
  const [activeCasperKind, setActiveCasperKind] = useState<"approve" | "lock" | "burn" | null>(null)
  const approveSettledRef = useRef(false)

  const requiresEvmSource = input.sourceChain?.kind === "EVM"
  const casperMinGas = useMemo(() => parseAmountToBaseUnits(casperClient.CASPER_MIN_GAS_CSPR, 9), [
    casperClient.CASPER_MIN_GAS_CSPR,
  ])
  const evmGasPolicy = useMemo(() => {
    if (input.sourceChain?.evmChainId === BASE_SEPOLIA_CHAIN_ID) {
      return {
        min: parseAmountToBaseUnits(evmClient.BASE_SEPOLIA_MIN_GAS, 18),
        minDisplay: evmClient.BASE_SEPOLIA_MIN_GAS,
        faucetUrl: evmClient.BASE_SEPOLIA_FAUCET_URL,
      }
    }
    if (input.sourceChain?.evmChainId === ARBITRUM_SEPOLIA_CHAIN_ID) {
      return {
        min: parseAmountToBaseUnits(evmClient.ARBITRUM_SEPOLIA_MIN_GAS, 18),
        minDisplay: evmClient.ARBITRUM_SEPOLIA_MIN_GAS,
        faucetUrl: evmClient.ARBITRUM_SEPOLIA_FAUCET_URL,
      }
    }
    if (input.sourceChain?.evmChainId === POLYGON_AMOY_CHAIN_ID) {
      return {
        min: parseAmountToBaseUnits(evmClient.POLYGON_AMOY_MIN_GAS, 18),
        minDisplay: evmClient.POLYGON_AMOY_MIN_GAS,
        faucetUrl: evmClient.POLYGON_AMOY_FAUCET_URL,
      }
    }
    return {
      min: parseAmountToBaseUnits(evmClient.BASE_SEPOLIA_MIN_GAS, 18),
      minDisplay: evmClient.BASE_SEPOLIA_MIN_GAS,
      faucetUrl: evmClient.BASE_SEPOLIA_FAUCET_URL,
    }
  }, [
    evmClient.ARBITRUM_SEPOLIA_FAUCET_URL,
    evmClient.ARBITRUM_SEPOLIA_MIN_GAS,
    evmClient.BASE_SEPOLIA_FAUCET_URL,
    evmClient.BASE_SEPOLIA_MIN_GAS,
    evmClient.POLYGON_AMOY_FAUCET_URL,
    evmClient.POLYGON_AMOY_MIN_GAS,
    input.sourceChain?.evmChainId,
  ])

  const parsedAmount = useMemo(() => {
    if (!input.sourceToken) return null
    return parseAmountToBaseUnits(input.amount, input.sourceToken.decimals)
  }, [input.amount, input.sourceToken])

  const formattedRecipient = useMemo(() => {
    if (!input.recipient) return null
    if (input.destChain?.kind === "EVM") return formatEvmRecipient(input.recipient)
    if (input.destChain?.kind === "CASPER") return formatCasperRecipient(input.recipient)
    return null
  }, [input.destChain?.kind, input.recipient])

  const resetState = useCallback(() => {
    setState({
      open: false,
      step: "allowance",
      errorMessage: null,
      errorStep: null,
      sourceTxHash: null,
      destTxHash: null,
      isLoading: false,
      gasMessage: null,
      gasFaucetUrl: null,
    })
    setPendingAction(null)
    setActiveCasperKind(null)
  }, [])

  const openModal = useCallback(() => {
    setState((prev) => ({ ...prev, open: true }))
  }, [])

  const closeModal = useCallback(() => {
    resetState()
  }, [resetState])

  const setError = useCallback((message: string, step: ErrorStep) => {
    setState((prev) => ({
      ...prev,
      open: true,
      step: "error",
      errorMessage: message,
      errorStep: step,
      isLoading: false,
      gasMessage: null,
      gasFaucetUrl: null,
    }))
  }, [])

  const setGasWarning = useCallback((message: string, faucetUrl?: string | null) => {
    setState((prev) => ({
      ...prev,
      open: true,
      step: "gas",
      isLoading: false,
      gasMessage: message,
      gasFaucetUrl: faucetUrl ?? null,
    }))
  }, [])

  const setProcessing = useCallback((step: ModalStep) => {
    setState((prev) => ({
      ...prev,
      step,
      isLoading: step === "processing" || step === "approving",
      errorMessage: null,
      errorStep: null,
      gasMessage: null,
      gasFaucetUrl: null,
    }))
  }, [])

  const updateSourceHash = useCallback((hash: string | null) => {
    setState((prev) => ({
      ...prev,
      sourceTxHash: hash,
    }))
  }, [])

  const updateDestHash = useCallback((hash: string | null) => {
    setState((prev) => ({
      ...prev,
      destTxHash: hash,
    }))
  }, [])

  const trackRelayerTransaction = useCallback(
    async (hash: string) => {
      const normalized = normalizeTxHash(hash)

      const handleTx = (tx: any) => {
        if (normalizeTxHash(tx.sourceTxHash ?? "") !== normalized) return
        if (tx.destinationTxHash) {
          updateDestHash(tx.destinationTxHash)
        }
        if (tx.status === "FAILED") {
          setError("Destination execution failed.", "destination")
        }
        if (tx.status === "EXECUTED" || tx.status === "FINALIZED") {
          setState((prev) => ({ ...prev, step: "success", isLoading: false }))
        }
      }

      try {
        const url = new URL("/api/v1/transactions", casperClient.CASPER_MAIN_RELAYER)
        url.searchParams.set("sourceTxHash", hash)
        const response = await fetch(url.toString())
        if (response.ok) {
          const data = await response.json()
          ;(data.transactions ?? []).forEach(handleTx)
        }
      } catch {
        // ignore fetch errors
      }

      if (!socketRef.current) {
        socketRef.current = io(casperClient.CASPER_MAIN_RELAYER, {
          transports: ["websocket"],
        })
      }

      const socket = socketRef.current
      const handleUpdate = (payload: any[]) => {
        payload.forEach(handleTx)
      }

      socket.on("transactions:snapshot", handleUpdate)
      socket.on("transactions:update", handleUpdate)
    },
    [casperClient.CASPER_MAIN_RELAYER, setError, updateDestHash],
  )

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  const checkEvmBalanceAndAllowance = useCallback(async () => {
    if (!publicClient || !evmWallet.address || !input.sourceToken?.contractAddress || !input.sourceChain?.evmChainId) {
      throw new Error("EVM wallet is not ready.")
    }
    if (!parsedAmount) {
      throw new Error("Amount is invalid.")
    }
    const balance = await publicClient.readContract({
      address: input.sourceToken.contractAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [evmWallet.address as `0x${string}`],
    })
    if (balance < parsedAmount) {
      throw new Error("Insufficient balance.")
    }
    const spender = evmBridge.bridgeCoreAddress as `0x${string}`
    const allowance = await publicClient.readContract({
      address: input.sourceToken.contractAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "allowance",
      args: [evmWallet.address as `0x${string}`, spender],
    })
    return allowance
  }, [
    evmBridge.bridgeCoreAddress,
    evmWallet.address,
    input.sourceChain?.evmChainId,
    input.sourceToken?.contractAddress,
    parsedAmount,
    publicClient,
  ])

  const checkCasperBalanceAndAllowance = useCallback(async () => {
    if (!casperWallet.accountHash || !input.sourceToken?.contractHash) {
      throw new Error("Casper wallet is not ready.")
    }
    if (!parsedAmount) {
      throw new Error("Amount is invalid.")
    }
    const balance = await casperTx.getTokenBalance({
      accountHash: casperWallet.accountHash,
      tokenContractHash: input.sourceToken.contractHash,
      tokenContractPackageHash: input.sourceToken.contractPackageHash ?? undefined,
    })
    if (BigInt(balance) < parsedAmount) {
      throw new Error("Insufficient balance.")
    }
    const allowance = await casperTx.getTokenAllowance({
      ownerAccountHash: casperWallet.accountHash,
      tokenContractHash: input.sourceToken.contractHash,
    })
    return allowance
  }, [casperTx, casperWallet.accountHash, input.sourceToken?.contractHash, parsedAmount])

  const checkNativeGasBalance = useCallback(async () => {
    const sourceName = input.sourceChain?.displayName ?? input.sourceChain?.name ?? "source chain"
    if (requiresEvmSource) {
      if (!publicClient || !evmWallet.address) {
        throw new Error("EVM wallet is not ready.")
      }
      const balance = await publicClient.getBalance({
        address: evmWallet.address as `0x${string}`,
      })
      //@ts-ignore
      if (balance < evmGasPolicy.min) {
        setGasWarning(
          `You need at least ${evmGasPolicy.minDisplay} native token on ${sourceName} to cover gas fees.`,
          evmGasPolicy.faucetUrl,
        )
        return false
      }
      return true
    }

    if (!casperWallet.account?.liquid_balance) {
      throw new Error("Casper wallet is not ready.")
    
    }
      //@ts-ignore
    if (BigInt(casperWallet.account.liquid_balance) < casperMinGas) {
      setGasWarning(
        `You need at least ${casperClient.CASPER_MIN_GAS_CSPR} CSPR on ${sourceName} to cover gas fees.`,
        casperClient.CASPER_FAUCET_URL,
      )
      return false
    }
    return true
  }, [
    casperClient.CASPER_FAUCET_URL,
    casperClient.CASPER_MIN_GAS_CSPR,
    casperMinGas,
    casperWallet.account?.liquid_balance,
    evmGasPolicy,
    evmWallet.address,
    input.sourceChain?.displayName,
    input.sourceChain?.name,
    publicClient,
    requiresEvmSource,
    setGasWarning,
  ])

  const executeApproval = useCallback(async () => {
    if (!parsedAmount || !input.sourceToken) return
    setProcessing("approving")
    if (requiresEvmSource) {
      try {
        const hash = await evmBridge.approve({
          token: input.sourceToken.contractAddress as `0x${string}`,
          amount: parsedAmount,
        })
        await evmBridge.waitForTransaction(hash)
        setState((prev) => ({ ...prev, step: "approved", isLoading: false }))
      } catch (err) {
        setError(mapEvmError(err), "approval")
      }
      return
    }

    try {
      approveSettledRef.current = false
      setActiveCasperKind("approve")
      await casperTx.approve({
        tokenContractHash: input.sourceToken.contractHash as string,
        amount: parsedAmount,
      })

      if (!casperWallet.accountHash || !input.sourceToken.contractHash) {
        return
      }

      const maxAttempts = 10
      const delayMs = 3000
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (approveSettledRef.current) return
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        if (approveSettledRef.current) return
        const allowance = await casperTx.getTokenAllowance({
          ownerAccountHash: casperWallet.accountHash,
          tokenContractHash: input.sourceToken.contractHash,
        })
        if (allowance >= parsedAmount) {
          approveSettledRef.current = true
          setState((prev) => ({ ...prev, step: "approved", isLoading: false }))
          setActiveCasperKind(null)
          return
        }
      }
    } catch (err) {
      setActiveCasperKind(null)
      approveSettledRef.current = true
      setError(mapCasperError(err), "approval")
    }
  }, [
    casperTx,
    casperWallet.accountHash,
    evmBridge,
    input.sourceToken,
    parsedAmount,
    requiresEvmSource,
    setError,
    setProcessing,
  ])

  const executeBridge = useCallback(async () => {
    if (!parsedAmount || !input.sourceToken || !formattedRecipient?.bytes32) return
    setProcessing("processing")
    setPendingAction("bridge")

    if (!input.sourceToken.tokenType) {
      setError("Token metadata is missing.", "source")
      return
    }

    const isCanonical = input.sourceToken.tokenType === "CANONICAL"

    if (requiresEvmSource) {
      try {
        const hash = isCanonical
          ? await evmBridge.lock({
              token: input.sourceToken.contractAddress as `0x${string}`,
              amount: parsedAmount,
              destinationChainId: BigInt(input.destChain?.chainId ?? 0),
              recipientBytes32: formattedRecipient.bytes32 as `0x${string}`,
            })
          : await evmBridge.burn({
              wrappedToken: input.sourceToken.contractAddress as `0x${string}`,
              amount: parsedAmount,
              destinationChainId: BigInt(input.destChain?.chainId ?? 0),
              recipientBytes32: formattedRecipient.bytes32 as `0x${string}`,
            })

        updateSourceHash(hash)
        await trackRelayerTransaction(hash)
        const receipt = await evmBridge.waitForTransaction(hash)
        if (receipt.status !== "success") {
          setError("Source transaction failed.", "source")
        }
      } catch (err) {
        setError(mapEvmError(err), "source")
      }
      return
    }

    try {
      const casperKind = isCanonical ? "lock" : "burn"
      if (!input.sourceToken.contractPackageHash) {
        throw new Error("Token package hash is required.")
      }
      setActiveCasperKind(casperKind)
      const action = casperKind === "lock" ? casperTx.lock : casperTx.burn
      const result = await action({
        tokenContractPackageHash: input.sourceToken.contractPackageHash,
        amount: parsedAmount,
        destinationChainId: Number(input.destChain?.chainId ?? 0),
        recipientBytes32Hex: formattedRecipient.bytes32,
      })
      if (result.hash) {
        updateSourceHash(result.hash)
        await trackRelayerTransaction(result.hash)
      }
    } catch (err) {
      setActiveCasperKind(null)
      setError(mapCasperError(err), "source")
    }
  }, [
    casperTx,
    evmBridge,
    formattedRecipient?.bytes32,
    input.destChain?.chainId,
    input.sourceToken,
    parsedAmount,
    requiresEvmSource,
    setError,
    setProcessing,
    trackRelayerTransaction,
    updateSourceHash,
  ])

  useEffect(() => {
    if (!activeCasperKind) return
    const record = casperTx.transactions[activeCasperKind]
    if (!record) return
    if (record.status === "success") {
      if (activeCasperKind === "approve") {
        approveSettledRef.current = true
        setState((prev) => ({ ...prev, step: "approved", isLoading: false }))
      } else {
        setState((prev) => ({ ...prev, step: "processing", isLoading: true }))
      }
      setActiveCasperKind(null)
    }
    if (record.status === "failed") {
      setActiveCasperKind(null)
      approveSettledRef.current = true
      setError(record.error ?? "Casper transaction failed.", activeCasperKind === "approve" ? "approval" : "source")
    }
  }, [activeCasperKind, casperTx.transactions, setError])

  const startBridge = useCallback(async () => {
    if (!input.sourceChain || !input.destChain || !input.sourceToken || !input.destToken) {
      setError("Bridge route is incomplete.", "source")
      return
    }
    //@ts-ignore
    if (parsedAmount === null || parsedAmount <= 0n) {
      setError("Enter a valid amount.", "allowance")
      return
    }
    if (!formattedRecipient || !formattedRecipient.isValid || !formattedRecipient.bytes32) {
      setError(formattedRecipient?.error ?? "Recipient is invalid.", "allowance")
      return
    }

    try {
      const hasGas = await checkNativeGasBalance()
      if (!hasGas) {
        return
      }
      if (requiresEvmSource) {
        const allowance = await checkEvmBalanceAndAllowance()
        if (allowance < parsedAmount) {
          setState((prev) => ({ ...prev, open: true, step: "allowance", isLoading: false }))
          setPendingAction("approve")
          return
        }
      } else {
        const allowance = await checkCasperBalanceAndAllowance()
        if (allowance < parsedAmount) {
          setState((prev) => ({ ...prev, open: true, step: "allowance", isLoading: false }))
          setPendingAction("approve")
          return
        }
      }
      setPendingAction("bridge")
      setState((prev) => ({ ...prev, open: true, step: "processing", isLoading: true }))
      await executeBridge()
    } catch (err) {
      const message = requiresEvmSource ? mapEvmError(err) : mapCasperError(err)
      setError(message, "balance")
    }
  }, [
    checkCasperBalanceAndAllowance,
    checkEvmBalanceAndAllowance,
    checkNativeGasBalance,
    executeBridge,
    formattedRecipient,
    input.destChain,
    input.destToken,
    input.sourceChain,
    input.sourceToken,
    parsedAmount,
    requiresEvmSource,
    setError,
  ])

  const retry = useCallback(async () => {
    if (pendingAction === "approve") {
      await executeApproval()
    } else if (pendingAction === "bridge") {
      await executeBridge()
    } else {
      await startBridge()
    }
  }, [executeApproval, executeBridge, pendingAction, startBridge])

  return {
    state,
    startBridge,
    closeModal,
    executeApproval,
    retry,
    continueAfterApproval: executeBridge,
  }
}
