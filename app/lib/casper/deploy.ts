"use client"

import {
  Args,
  CLValue,
  ContractHash,
  Deploy,
  DeployHeader,
  Duration,
  ExecutableDeployItem,
  Key,
  PublicKey,
  StoredContractByHash,
} from "casper-js-sdk"
import { hexToBytes32, normalizeHex } from "@/lib/casper/format"

function clKeyFromContractHash(contractHash: string): CLValue {
  const normalized = normalizeHex(contractHash)
  return CLValue.newCLKey(Key.newKey(`hash-${normalized}`))
}

export function buildApproveDeploy(params: {
  tokenContractHash: string
  spenderContractHash: string
  amount: bigint
  chainName: string
  gasPayment: string
  senderPublicKeyHex: string
}): Deploy {
  const args = Args.fromMap({
    spender: clKeyFromContractHash(params.spenderContractHash),
    amount: CLValue.newCLUInt256(params.amount),
  })

  const session = new ExecutableDeployItem()
  session.storedContractByHash = new StoredContractByHash(
    ContractHash.newContract(normalizeHex(params.tokenContractHash)),
    "approve",
    args,
  )

  const header = DeployHeader.default()
  header.account = PublicKey.fromHex(params.senderPublicKeyHex)
  header.chainName = params.chainName
  header.ttl = Duration.fromJSON("30m")

  const payment = ExecutableDeployItem.standardPayment(params.gasPayment)
  return Deploy.makeDeploy(header, payment, session)
}

export function buildLockCanonicalDeploy(params: {
  bridgeCoreHash: string
  tokenContractHash: string
  amount: bigint
  destinationChainId: number
  recipientBytes32Hex: string
  chainName: string
  gasPayment: string
  senderPublicKeyHex: string
}): Deploy {
  const args = Args.fromMap({
    token: clKeyFromContractHash(params.tokenContractHash),
    amount: CLValue.newCLUInt256(params.amount),
    destination_chain: CLValue.newCLUInt32(params.destinationChainId),
    recipient: CLValue.newCLByteArray(hexToBytes32(params.recipientBytes32Hex)),
  })

  const session = new ExecutableDeployItem()
  session.storedContractByHash = new StoredContractByHash(
    ContractHash.newContract(normalizeHex(params.bridgeCoreHash)),
    "lock_canonical",
    args,
  )

  const header = DeployHeader.default()
  header.account = PublicKey.fromHex(params.senderPublicKeyHex)
  header.chainName = params.chainName
  header.ttl = Duration.fromJSON("30m")

  const payment = ExecutableDeployItem.standardPayment(params.gasPayment)
  return Deploy.makeDeploy(header, payment, session)
}

export function buildBurnWrappedDeploy(params: {
  bridgeCoreHash: string
  tokenContractHash: string
  amount: bigint
  destinationChainId: number
  recipientBytes32Hex: string
  chainName: string
  gasPayment: string
  senderPublicKeyHex: string
}): Deploy {
  const args = Args.fromMap({
    token: clKeyFromContractHash(params.tokenContractHash),
    amount: CLValue.newCLUInt256(params.amount),
    destination_chain: CLValue.newCLUInt32(params.destinationChainId),
    recipient: CLValue.newCLByteArray(hexToBytes32(params.recipientBytes32Hex)),
  })

  const session = new ExecutableDeployItem()
  session.storedContractByHash = new StoredContractByHash(
    ContractHash.newContract(normalizeHex(params.bridgeCoreHash)),
    "burn_wrapped",
    args,
  )

  const header = DeployHeader.default()
  header.account = PublicKey.fromHex(params.senderPublicKeyHex)
  header.chainName = params.chainName
  header.ttl = Duration.fromJSON("30m")

  const payment = ExecutableDeployItem.standardPayment(params.gasPayment)
  return Deploy.makeDeploy(header, payment, session)
}

export function deployToClickTransaction(deploy: Deploy): object {
  return Deploy.toJSON(deploy) as object
}
