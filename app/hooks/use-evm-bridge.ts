"use client"

import { useCallback, useMemo } from "react"
import type { Address, Hex } from "viem"
import { useChainId, usePublicClient, useWalletClient } from "wagmi"
import { useEvmClientConfig } from "@/contexts/evm-client-config-context"
import { resolveBridgeCoreAddress } from "@/lib/evm/config"
import { approveErc20, burnWrapped, lockCanonical, waitForReceipt } from "@/lib/evm/bridge-core"

type ApproveParams = {
  token: Address
  amount: bigint
  spender?: Address
}

type LockParams = {
  token: Address
  amount: bigint
  destinationChainId: bigint
  recipientBytes32: Hex
}

type BurnParams = {
  wrappedToken: Address
  amount: bigint
  destinationChainId: bigint
  recipientBytes32: Hex
}

export function useEvmBridge() {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const config = useEvmClientConfig()

  const bridgeCoreAddress = useMemo(
    () => resolveBridgeCoreAddress(config, chainId),
    [config, chainId],
  )

  const requireWalletClient = useCallback(() => {
    if (!walletClient) {
      throw new Error("Wallet not connected")
    }
    return walletClient
  }, [walletClient])

  const requirePublicClient = useCallback(() => {
    if (!publicClient) {
      throw new Error("Public client not available")
    }
    return publicClient
  }, [publicClient])

  const approve = useCallback(
    async ({ token, amount, spender }: ApproveParams) => {
      return approveErc20({
        walletClient: requireWalletClient(),
        token,
        spender: spender ?? bridgeCoreAddress as "0x",
        amount,
      })
    },
    [bridgeCoreAddress, requireWalletClient],
  )

  const lock = useCallback(
    async ({ token, amount, destinationChainId, recipientBytes32 }: LockParams) => {
      return lockCanonical({
        walletClient: requireWalletClient(),
        bridgeCore: bridgeCoreAddress as "0x",
        token,
        amount,
        destinationChainId,
        recipientBytes32,
      })
    },
    [bridgeCoreAddress, requireWalletClient],
  )

  const burn = useCallback(
    async ({ wrappedToken, amount, destinationChainId, recipientBytes32 }: BurnParams) => {
      return burnWrapped({
        walletClient: requireWalletClient(),
        bridgeCore: bridgeCoreAddress as "0x",
        wrappedToken,
        amount,
        destinationChainId,
        recipientBytes32,
      })
    },
    [bridgeCoreAddress, requireWalletClient],
  )

  const waitForTransaction = useCallback(
    async (hash: Hex) => waitForReceipt(requirePublicClient(), hash),
    [requirePublicClient],
  )

  return {
    bridgeCoreAddress,
    approve,
    lock,
    burn,
    waitForTransaction,
  }
}
