"use client"

import { PublicKey } from "casper-js-sdk"
import { isAddress } from "viem"
import { isHex, normalizeHex, publicKeyToRecipientBytes32, toBytes32Hex } from "@/lib/casper/format"

type RecipientFormatResult = {
  isValid: boolean
  normalized?: string
  bytes32?: string
  error?: string
}

function toBytes32Address(address: string): string {
  return `0x${address.slice(2).padStart(64, "0")}`
}

export function formatEvmRecipient(input: string): RecipientFormatResult {
  const value = input.trim()
  if (!value) {
    return { isValid: false, error: "Recipient address is required." }
  }
  if (!isAddress(value)) {
    return { isValid: false, error: "Invalid EVM address." }
  }
  const normalized = value.toLowerCase()
  return {
    isValid: true,
    normalized,
    bytes32: toBytes32Address(normalized),
  }
}

export function formatCasperRecipient(input: string): RecipientFormatResult {
  const value = input.trim()
  if (!value) {
    return { isValid: false, error: "Recipient address is required." }
  }

  const withoutPrefix = value.startsWith("account-hash-") ? value.slice("account-hash-".length) : value
  const normalizedHex = normalizeHex(withoutPrefix)

  if (normalizedHex.length === 64 && isHex(normalizedHex)) {
    const bytes32 = toBytes32Hex(normalizedHex)
    return {
      isValid: true,
      normalized: normalizedHex,
      bytes32,
    }
  }

  try {
    const publicKey = PublicKey.fromHex(value)
    const publicKeyHex = publicKey.toHex()
    return {
      isValid: true,
      normalized: publicKeyHex,
      bytes32: publicKeyToRecipientBytes32(publicKeyHex),
    }
  } catch {
    return { isValid: false, error: "Invalid Casper public key or account hash." }
  }
}
