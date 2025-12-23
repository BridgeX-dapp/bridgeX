import type { Address, Hex, PublicClient, WalletClient } from "viem"
import { bridgeCoreAbi } from "@/lib/evm/bridge-core-abi"
import { erc20Abi } from "@/lib/evm/erc20-abi"

type ApproveParams = {
  walletClient: WalletClient
  token: Address
  spender: Address
  amount: bigint
}

type LockCanonicalParams = {
  walletClient: WalletClient
  bridgeCore: Address
  token: Address
  amount: bigint
  destinationChainId: bigint
  recipientBytes32: Hex
}

type BurnWrappedParams = {
  walletClient: WalletClient
  bridgeCore: Address
  wrappedToken: Address
  amount: bigint
  destinationChainId: bigint
  recipientBytes32: Hex
}

export async function approveErc20({ walletClient, token, spender, amount }: ApproveParams): Promise<Hex> {
  return walletClient.writeContract({
    address: token,
    chain: walletClient.chain ?? null,
    account: walletClient.account ?? null,
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, amount],
  })
}

export async function lockCanonical({
  walletClient,
  bridgeCore,
  token,
  amount,
  destinationChainId,
  recipientBytes32,
}: LockCanonicalParams): Promise<Hex> {
  return walletClient.writeContract({
    address: bridgeCore,
    chain: walletClient.chain ?? null,
    account: walletClient.account ?? null,
    abi: bridgeCoreAbi,
    functionName: "lockCanonical",
    args: [token, amount, destinationChainId, recipientBytes32],
  })
}

export async function burnWrapped({
  walletClient,
  bridgeCore,
  wrappedToken,
  amount,
  destinationChainId,
  recipientBytes32,
}: BurnWrappedParams): Promise<Hex> {
  return walletClient.writeContract({
    address: bridgeCore,
    chain: walletClient.chain ?? null,
    account: walletClient.account ?? null,
    abi: bridgeCoreAbi,
    functionName: "burnWrapped",
    args: [wrappedToken, amount, destinationChainId, recipientBytes32],
  })
}

export async function waitForReceipt(publicClient: PublicClient, hash: Hex) {
  return publicClient.waitForTransactionReceipt({ hash })
}
