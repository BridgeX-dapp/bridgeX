const EXPLORER_URLS: Record<string, string> = {
  "base-sepolia": "https://base-sepolia.blockscout.com/tx/{txHash}",
  basesepolia: "https://base-sepolia.blockscout.com/tx/{txHash}",
  "arbitrum-sepolia": "https://arbitrum-sepolia.blockscout.com/tx/{txHash}",
  "arbitrum sepolia": "https://arbitrum-sepolia.blockscout.com/tx/{txHash}",
  arbitrumsepolia: "https://arbitrum-sepolia.blockscout.com/tx/{txHash}",
  "polygon-amoy": "https://amoy.polygonscan.com/tx/{txHash}",
  polygonamoy: "https://amoy.polygonscan.com/tx/{txHash}",
  casper: "https://testnet.cspr.live/transaction/{txHash}",
  "casper-testnet": "https://testnet.cspr.live/transaction/{txHash}",
}

function normalizeChainKey(chainName: string) {
  return chainName.trim().toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9\s-]/g, "")
}

export function buildExplorerTxUrl(chainName: string | null | undefined, txHash: string) {
  if (!chainName) return null
  const normalized = normalizeChainKey(chainName)
  const compact = normalized.replace(/\s+/g, "")
  const template = EXPLORER_URLS[normalized] ?? EXPLORER_URLS[compact]
  if (!template) return null
  const isCasper = normalized.includes("casper")
  const cleanHash = isCasper && txHash.startsWith("0x") ? txHash.slice(2) : txHash
  return template.replace("{txHash}", cleanHash)
}
