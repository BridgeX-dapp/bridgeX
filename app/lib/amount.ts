"use client"

export function parseAmountToBaseUnits(amount: string, decimals: number): bigint | null {
  const trimmed = amount.trim()
  if (!trimmed) return null
  if (!Number.isFinite(decimals) || decimals < 0) return null
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null

  const [whole, fraction = ""] = trimmed.split(".")
  if (fraction.length > decimals) return null

  const paddedFraction = fraction.padEnd(decimals, "0")
  const combined = `${whole}${paddedFraction}`.replace(/^0+/, "") || "0"
  return BigInt(combined)
}

export function formatAmountFromBaseUnits(amount: bigint, decimals: number): string {
  if (!Number.isFinite(decimals) || decimals < 0) return amount.toString()
  const negative = amount < 0n
  const value = negative ? -amount : amount
  const raw = value.toString().padStart(decimals + 1, "0")
  const whole = raw.slice(0, -decimals) || "0"
  const fraction = raw.slice(-decimals).replace(/0+$/, "")
  const result = fraction ? `${whole}.${fraction}` : whole
  return negative ? `-${result}` : result
}
