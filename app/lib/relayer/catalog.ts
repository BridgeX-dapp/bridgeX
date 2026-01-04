export type CatalogChain = {
  id: number
  name: string
  kind: "EVM" | "CASPER"
  chainId: number | null
  evmChainId?: number | null
  displayName?: string | null
  logoUrl?: string | null
}

export type CatalogToken = {
  id: number
  chainId: number
  name: string
  symbol: string
  decimals: number
  logoUrl?: string | null
  contractAddress?: string | null
  contractHash?: string | null
  contractPackageHash?: string | null
  tokenType?: "CANONICAL" | "WRAPPED" | null
  canonicalChainId?: number | null
  chain?: CatalogChain
}

export type CatalogTokenPair = {
  id: number
  sourceChainId: number
  destChainId: number
  sourceTokenId: number
  destTokenId: number
  sourceChain?: CatalogChain
  destChain?: CatalogChain
  sourceToken?: CatalogToken
  destToken?: CatalogToken
}

type CatalogChainsResponse = { chains: CatalogChain[] }
type CatalogTokensResponse = { tokens: CatalogToken[] }
type CatalogTokenPairsResponse = { tokenPairs: CatalogTokenPair[] }
type CatalogSnapshotResponse = {
  chains: CatalogChain[]
  tokens: CatalogToken[]
  tokenPairs: CatalogTokenPair[]
}

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path}`
}

export async function fetchCatalogChains(baseUrl: string): Promise<CatalogChain[]> {
  const response = await fetch(joinUrl(baseUrl, "/api/v1/catalog/chains"))
  if (!response.ok) {
    throw new Error(`Failed to fetch chains (${response.status})`)
  }
  const data = (await response.json()) as CatalogChainsResponse
  return data.chains ?? []
}

export async function fetchCatalogTokens(baseUrl: string): Promise<CatalogToken[]> {
  const response = await fetch(joinUrl(baseUrl, "/api/v1/catalog/tokens"))
  if (!response.ok) {
    throw new Error(`Failed to fetch tokens (${response.status})`)
  }
  const data = (await response.json()) as CatalogTokensResponse
  return data.tokens ?? []
}

export async function fetchCatalogTokenPairs(baseUrl: string): Promise<CatalogTokenPair[]> {
  const response = await fetch(joinUrl(baseUrl, "/api/v1/catalog/token-pairs"))
  if (!response.ok) {
    throw new Error(`Failed to fetch token pairs (${response.status})`)
  }
  const data = (await response.json()) as CatalogTokenPairsResponse
  return data.tokenPairs ?? []
}

export async function fetchCatalogSnapshot(): Promise<CatalogSnapshotResponse> {
  const response = await fetch("/api/catalog")
  if (!response.ok) {
    throw new Error(`Failed to fetch catalog (${response.status})`)
  }
  const data = (await response.json()) as CatalogSnapshotResponse
  return {
    chains: data.chains ?? [],
    tokens: data.tokens ?? [],
    tokenPairs: data.tokenPairs ?? [],
  }
}
