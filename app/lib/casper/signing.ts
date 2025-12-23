import type {
  ICSPRClickSDK,
  SendResult,
  SignResult,
  TransactionStatus,
} from "@make-software/csprclick-core-types"

export type CasperStatusCallback = (status: TransactionStatus, data: any) => void

export async function sendCasperTransaction(params: {
  clickRef: ICSPRClickSDK | null | undefined
  transaction: string | object
  signingPublicKey: string
  onStatus?: CasperStatusCallback
  timeoutSeconds?: number
}): Promise<SendResult | undefined> {
  const { clickRef, transaction, signingPublicKey, onStatus, timeoutSeconds } = params

  if (!clickRef) {
    throw new Error("CSPR.click is not initialized")
  }

  if (!signingPublicKey) {
    throw new Error("signingPublicKey is required")
  }

  const waitProcessing = onStatus ?? true
  return clickRef.send(transaction, signingPublicKey, waitProcessing, timeoutSeconds)
}

export async function signCasperTransaction(params: {
  clickRef: ICSPRClickSDK | null | undefined
  transaction: string | object
  signingPublicKey: string
}): Promise<SignResult | undefined> {
  const { clickRef, transaction, signingPublicKey } = params

  if (!clickRef) {
    throw new Error("CSPR.click is not initialized")
  }

  if (!signingPublicKey) {
    throw new Error("signingPublicKey is required")
  }

  return clickRef.sign(transaction, signingPublicKey)
}
