import { NextResponse } from "next/server"

export const revalidate = 30

type ChainsResponse = { chains: unknown[] }
type TokensResponse = { tokens: unknown[] }
type TokenPairsResponse = { tokenPairs: unknown[] }

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "force-cache" })
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`)
  }
  return response.json() as Promise<T>
}

export async function GET() {
  const baseUrl = process.env.CASPER_MAIN_RELAYER
  if (!baseUrl) {
    return NextResponse.json({ error: "CASPER_MAIN_RELAYER is not set" }, { status: 500 })
  }

  try {
    const [chains, tokens, tokenPairs] = await Promise.all([
      fetchJson<ChainsResponse>(`${baseUrl}/api/v1/catalog/chains`),
      fetchJson<TokensResponse>(`${baseUrl}/api/v1/catalog/tokens`),
      fetchJson<TokenPairsResponse>(`${baseUrl}/api/v1/catalog/token-pairs`),
    ])

    return NextResponse.json({
      chains: chains.chains ?? [],
      tokens: tokens.tokens ?? [],
      tokenPairs: tokenPairs.tokenPairs ?? [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch catalog"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
