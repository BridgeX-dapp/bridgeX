import { PublicKey } from "casper-js-sdk"

const HEX_REGEX = /^[0-9a-fA-F]+$/

export function normalizeHex(input: string): string {
  return input.startsWith("0x") ? input.slice(2).toLowerCase() : input.toLowerCase()
}

export function isHex(input: string): boolean {
  return HEX_REGEX.test(normalizeHex(input))
}

export function isBytes32Hex(input: string): boolean {
  const normalized = normalizeHex(input)
  return normalized.length === 64 && isHex(normalized)
}

export function toBytes32Hex(input: string, withPrefix = true): string {
  const normalized = normalizeHex(input)
  if (normalized.length !== 64 || !isHex(normalized)) {
    throw new Error("Value must be 32 bytes hex")
  }
  return withPrefix ? `0x${normalized}` : normalized
}

export function hexToBytes32(input: string): Uint8Array {
  const normalized = normalizeHex(input)
  if (normalized.length !== 64 || !isHex(normalized)) {
    throw new Error("Value must be 32 bytes hex")
  }
  const bytes = new Uint8Array(32)
  for (let i = 0; i < 32; i += 1) {
    const byte = normalized.slice(i * 2, i * 2 + 2)
    bytes[i] = Number.parseInt(byte, 16)
  }
  return bytes
}

export function publicKeyToAccountHash(publicKeyHex: string): string {
  const publicKey = PublicKey.fromHex(publicKeyHex)
  const legacy = (publicKey as unknown as { toAccountHashStr?: () => string }).toAccountHashStr
  if (legacy) {
    const hashWithPrefix = legacy.call(publicKey)
    return hashWithPrefix.replace("account-hash-", "")
  }
  return publicKey.accountHash().toHex()
}

export function publicKeyToRecipientBytes32(publicKeyHex: string, withPrefix = true): string {
  const accountHash = publicKeyToAccountHash(publicKeyHex)
  return toBytes32Hex(accountHash, withPrefix)
}

export function shortenHash(value: string, visible = 8): string {
  const normalized = normalizeHex(value)
  if (normalized.length <= visible * 2) return normalized
  return `${normalized.slice(0, visible)}...${normalized.slice(-visible)}`
}
