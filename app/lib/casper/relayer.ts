"use client"

type CasperBalanceResponse = {
  accountHash: string
  contractPackageHash: string
  balance: string
}

type CasperAllowanceResponse = {
  ownerAccountHash: string
  tokenContractHash: string
  spenderContractHash: string
  allowance: string
}

export async function fetchCasperTokenBalance(params: {
  relayerUrl: string
  accountHash: string
  contractHash?: string
  contractPackageHash?: string
}): Promise<CasperBalanceResponse> {
  const { relayerUrl, accountHash, contractHash, contractPackageHash } = params
  const url = new URL("/api/v1/casper/token-balance", relayerUrl)
  url.searchParams.set("accountHash", accountHash)
  if (contractHash) url.searchParams.set("contractHash", contractHash)
  if (contractPackageHash) url.searchParams.set("contractPackageHash", contractPackageHash)

  const response = await fetch(url.toString())
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Failed to fetch Casper token balance")
  }
  return response.json()
}

export async function fetchCasperTokenAllowance(params: {
  relayerUrl: string
  ownerAccountHash: string
  tokenContractHash: string
  spenderContractHash?: string
}): Promise<CasperAllowanceResponse> {
  const { relayerUrl, ownerAccountHash, tokenContractHash, spenderContractHash } = params
  const url = new URL("/api/v1/casper/token-allowance", relayerUrl)
  url.searchParams.set("ownerAccountHash", ownerAccountHash)
  url.searchParams.set("tokenContractHash", tokenContractHash)
  if (spenderContractHash) url.searchParams.set("spenderContractHash", spenderContractHash)

  const response = await fetch(url.toString())
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Failed to fetch Casper token allowance")
  }
  return response.json()
}
