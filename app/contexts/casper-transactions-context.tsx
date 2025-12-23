"use client"

import type React from "react"
import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { TransactionStatus } from "@make-software/csprclick-core-types"
import { useClickRef } from "@make-software/csprclick-ui"
import { useCasperClientConfig } from "@/contexts/casper-client-config-context"
import { useCasperWallet } from "@/contexts/casper-wallet-context"
import { buildApproveDeploy, buildBurnWrappedDeploy, buildLockCanonicalDeploy, deployToClickTransaction } from "@/lib/casper/deploy"
import { fetchCasperTokenAllowance, fetchCasperTokenBalance } from "@/lib/casper/relayer"
import { sendCasperTransaction } from "@/lib/casper/signing"

type CasperTxKind = "approve" | "lock" | "burn"
type CasperTxStatus = "idle" | "pending" | "success" | "failed"

type CasperTxRecord = {
  kind: CasperTxKind
  status: CasperTxStatus
  hash?: string | null
  error?: string | null
  rawStatus?: string | null
}

type CasperTransactionsContextValue = {
  transactions: Record<CasperTxKind, CasperTxRecord>
  getTokenBalance: (params: {
    accountHash: string
    tokenContractHash?: string
    tokenContractPackageHash?: string
  }) => Promise<string>
  getTokenAllowance: (params: { ownerAccountHash: string; tokenContractHash: string; spenderContractHash?: string }) => Promise<bigint>
  ensureAllowance: (params: {
    tokenContractHash: string
    amount: bigint
    spenderContractHash?: string
  }) => Promise<boolean>
  approve: (params: { tokenContractHash: string; amount: bigint; spenderContractHash?: string }) => Promise<CasperTxRecord>
  lock: (params: {
    tokenContractHash: string
    amount: bigint
    destinationChainId: number
    recipientBytes32Hex: string
  }) => Promise<CasperTxRecord>
  burn: (params: {
    tokenContractHash: string
    amount: bigint
    destinationChainId: number
    recipientBytes32Hex: string
  }) => Promise<CasperTxRecord>
}

const initialTransactions: Record<CasperTxKind, CasperTxRecord> = {
  approve: { kind: "approve", status: "idle" },
  lock: { kind: "lock", status: "idle" },
  burn: { kind: "burn", status: "idle" },
}

const CasperTransactionsContext = createContext<CasperTransactionsContextValue | undefined>(undefined)

function extractClickHash(result: { deployHash?: string | null; transactionHash?: string | null }): string | null {
  return result.transactionHash ?? result.deployHash ?? null
}

function statusFromClick(status: string, data: any): CasperTxStatus {
  if (status === TransactionStatus.SENT) return "pending"
  if (status === TransactionStatus.PROCESSED) {
    const failure =
      data?.execution_results?.[0]?.result?.Failure?.error_message ??
      data?.execution_results?.[0]?.result?.Failure ??
      data?.execution_results?.[0]?.result?.error_message ??
      data?.execution_results?.[0]?.result?.failure ??
      data?.execution_result?.error_message ??
      data?.error_message ??
      null
    return failure ? "failed" : "success"
  }
  if (
    status === TransactionStatus.CANCELLED ||
    status === TransactionStatus.EXPIRED ||
    status === TransactionStatus.TIMEOUT ||
    status === TransactionStatus.ERROR
  ) {
    return "failed"
  }
  return "pending"
}

export function CasperTransactionsProvider({ children }: { children: React.ReactNode }) {
  const clickRef = useClickRef()
  const casperConfig = useCasperClientConfig()
  const { account, accountHash } = useCasperWallet()
  const [transactions, setTransactions] = useState<Record<CasperTxKind, CasperTxRecord>>(initialTransactions)

  const updateTx = useCallback((kind: CasperTxKind, next: Partial<CasperTxRecord>) => {
    setTransactions((prev) => ({
      ...prev,
      [kind]: {
        ...prev[kind],
        ...next,
      },
    }))
  }, [])

  const getTokenBalance = useCallback(
    async (params: { accountHash: string; tokenContractHash?: string; tokenContractPackageHash?: string }) => {
      const result = await fetchCasperTokenBalance({
        relayerUrl: `${casperConfig.CASPER_MAIN_RELAYER}/api/v1/test`,
        accountHash: params.accountHash,
        contractHash: params.tokenContractHash,
        contractPackageHash: params.tokenContractPackageHash,
      })
      return result.balance
    },
    [casperConfig.CASPER_MAIN_RELAYER],
  )

  const getTokenAllowance = useCallback(
    async (params: { ownerAccountHash: string; tokenContractHash: string; spenderContractHash?: string }) => {
      const result = await fetchCasperTokenAllowance({
        relayerUrl: casperConfig.CASPER_MAIN_RELAYER,
        ownerAccountHash: params.ownerAccountHash,
        tokenContractHash: params.tokenContractHash,
        spenderContractHash:
          params.spenderContractHash ?? casperConfig.CASPER_BRIDGE_CORE_CONTRACT_PACKAGE_HASH,
      })
      return BigInt(result.allowance ?? "0")
    },
    [casperConfig.CASPER_BRIDGE_CORE_CONTRACT_PACKAGE_HASH, casperConfig.CASPER_MAIN_RELAYER],
  )

  const ensureAllowance = useCallback(
    async (params: { tokenContractHash: string; amount: bigint; spenderContractHash?: string }) => {
      if (!account?.public_key || !accountHash) {
        throw new Error("Wallet not connected")
      }

      const allowance = await getTokenAllowance({
        ownerAccountHash: accountHash,
        tokenContractHash: params.tokenContractHash,
        spenderContractHash: params.spenderContractHash,
      })

      if (allowance >= params.amount) {
        return true
      }

      await approve({
        tokenContractHash: params.tokenContractHash,
        amount: params.amount,
        spenderContractHash: params.spenderContractHash,
      })

      return false
    },
    [account?.public_key, accountHash, getTokenAllowance],
  )

  const sendDeploy = useCallback(
    async (kind: CasperTxKind, deploy: any) => {
      if (!account?.public_key) {
        throw new Error("Wallet not connected")
      }

      updateTx(kind, { status: "pending", error: null, rawStatus: null })

      const result = await sendCasperTransaction({
        clickRef,
        transaction: deployToClickTransaction(deploy),
        signingPublicKey: account.public_key,
        onStatus: (status, data) => {
          console.log(`transaction lifecycle status,  raw status : ${status}, data status ${data}`)
          updateTx(kind, {
            status: statusFromClick(status, data),
            rawStatus: status,
          })
        },
      })

      const hash = result ? extractClickHash(result) : null
      const finalStatus: CasperTxStatus = result?.error ? "failed" : "pending"
      updateTx(kind, {
        hash,
        status: finalStatus,
        error: result?.error ?? null,
      })

      return {
        kind,
        status: finalStatus,
        hash,
        error: result?.error ?? null,
        rawStatus: null,
      }
    },
    [account?.public_key, clickRef, updateTx],
  )

  const approve = useCallback(
    async (params: { tokenContractHash: string; amount: bigint; spenderContractHash?: string }) => {
      if (!account?.public_key) {
        throw new Error("Wallet not connected")
      }

      const deploy = buildApproveDeploy({
        tokenContractHash: params.tokenContractHash,
        spenderContractHash:
          params.spenderContractHash ?? casperConfig.CASPER_BRIDGE_CORE_CONTRACT_PACKAGE_HASH,
        amount: params.amount,
        chainName: casperConfig.CASPER_CHAIN_NAME,
        gasPayment: casperConfig.CASPER_GAS_PAYMENT,
        senderPublicKeyHex: account.public_key,
      })

      return sendDeploy("approve", deploy)
    },
    [
      account?.public_key,
      casperConfig.CASPER_BRIDGE_CORE_CONTRACT_PACKAGE_HASH,
      casperConfig.CASPER_CHAIN_NAME,
      casperConfig.CASPER_GAS_PAYMENT,
      sendDeploy,
    ],
  )

  const lock = useCallback(
    async (params: {
      tokenContractHash: string
      amount: bigint
      destinationChainId: number
      recipientBytes32Hex: string
    }) => {
      if (!account?.public_key) {
        throw new Error("Wallet not connected")
      }

      const deploy = buildLockCanonicalDeploy({
        bridgeCoreHash: casperConfig.CASPER_BRIDGE_CORE_HASH,
        tokenContractHash: params.tokenContractHash,
        amount: params.amount,
        destinationChainId: params.destinationChainId,
        recipientBytes32Hex: params.recipientBytes32Hex,
        chainName: casperConfig.CASPER_CHAIN_NAME,
        gasPayment: casperConfig.CASPER_GAS_PAYMENT,
        senderPublicKeyHex: account.public_key,
      })

      return sendDeploy("lock", deploy)
    },
    [
      account?.public_key,
      casperConfig.CASPER_BRIDGE_CORE_HASH,
      casperConfig.CASPER_CHAIN_NAME,
      casperConfig.CASPER_GAS_PAYMENT,
      sendDeploy,
    ],
  )

  const burn = useCallback(
    async (params: {
      tokenContractHash: string
      amount: bigint
      destinationChainId: number
      recipientBytes32Hex: string
    }) => {
      if (!account?.public_key) {
        throw new Error("Wallet not connected")
      }

      const deploy = buildBurnWrappedDeploy({
        bridgeCoreHash: casperConfig.CASPER_BRIDGE_CORE_HASH,
        tokenContractHash: params.tokenContractHash,
        amount: params.amount,
        destinationChainId: params.destinationChainId,
        recipientBytes32Hex: params.recipientBytes32Hex,
        chainName: casperConfig.CASPER_CHAIN_NAME,
        gasPayment: casperConfig.CASPER_GAS_PAYMENT,
        senderPublicKeyHex: account.public_key,
      })

      return sendDeploy("burn", deploy)
    },
    [
      account?.public_key,
      casperConfig.CASPER_BRIDGE_CORE_HASH,
      casperConfig.CASPER_CHAIN_NAME,
      casperConfig.CASPER_GAS_PAYMENT,
      sendDeploy,
    ],
  )

  const value = useMemo(
    () => ({
      transactions,
      getTokenBalance,
      getTokenAllowance,
      ensureAllowance,
      approve,
      lock,
      burn,
    }),
    [transactions, getTokenBalance, getTokenAllowance, ensureAllowance, approve, lock, burn],
  )

  return <CasperTransactionsContext.Provider value={value}>{children}</CasperTransactionsContext.Provider>
}

export function useCasperTransactions() {
  const context = useContext(CasperTransactionsContext)
  if (!context) {
    throw new Error("useCasperTransactions must be used within CasperTransactionsProvider")
  }
  return context
}
