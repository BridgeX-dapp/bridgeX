const CASPER_ERROR_CODES: Record<string, string> = {
  "10000": "Token is not whitelisted.",
  "10001": "Amount is too small.",
  "10002": "Amount is too large.",
  "10003": "Token is not canonical.",
  "10004": "Token is not wrapped.",
  "10005": "Fee is too high.",
  "10006": "Fee receiver is not set.",
  "10007": "Event already handled.",
  "10008": "Caller is not an admin.",
  "10009": "Caller is not the relayer.",
  "10010": "Caller is not a pauser.",
  "60000": "Invalid CEP-18 context.",
  "60001": "Insufficient balance.",
  "60002": "Insufficient allowance.",
  "60003": "Overflow.",
  "60004": "Missing package hash.",
  "60005": "Invalid package hash.",
  "60006": "Invalid events mode.",
  "60007": "Missing events mode.",
  "60008": "Unknown error.",
  "60009": "Failed to read runtime arguments.",
  "60010": "Insufficient rights.",
  "60011": "Invalid admin list.",
  "60012": "Invalid minter list.",
  "60013": "Invalid none list.",
  "60014": "Invalid mint/burn flag.",
  "60015": "Already initialized.",
  "60016": "Mint/burn disabled.",
  "60017": "Cannot target self.",
  "60018": "Invalid burn target.",
  "60019": "Missing package hash for upgrade.",
  "60020": "Missing contract hash for upgrade.",
  "60021": "Invalid key type.",
  "60022": "Failed to convert to JSON.",
  "60023": "Failed to return entry point result.",
  "60024": "Failed to create dictionary.",
  "60025": "Failed to convert bytes.",
  "60026": "Failed to change total supply.",
  "60027": "Failed to read from storage.",
  "60028": "Failed to get key.",
  "60029": "Failed to disable contract version.",
  "60030": "Failed to insert to security list.",
  "60031": "Missing URef.",
  "60032": "Failed to get old contract hash key.",
  "60033": "Failed to get old package key.",
  "60034": "Failed to get package key.",
  "60035": "Missing storage URef.",
  "60036": "Invalid storage URef.",
  "60037": "Missing version contract key.",
  "60038": "Invalid version contract key.",
}

const EVM_ERROR_MESSAGES: Record<string, string> = {
  BridgeCore__NotRelayer: "Caller is not the relayer.",
  BridgeCore__ZeroAddress: "Address cannot be zero.",
  BridgeCore__TokenNotWhitelisted: "Token is not whitelisted.",
  BridgeCore__TokenNotCanonical: "Token is not canonical.",
  BridgeCore__TokenNotWrapped: "Token is not wrapped.",
  BridgeCore__AmountTooSmall: "Amount is too small.",
  BridgeCore__AmountTooLarge: "Amount is too large.",
  BridgeCore__AlreadyProcessed: "Event already processed.",
  BridgeCore__FeeTooHigh: "Fee is too high.",
  BridgeCore__InvalidAmount: "Invalid amount.",
  BridgeCore__NoFeesAvailable: "No fees available.",
  ERC20InsufficientAllowance: "Insufficient allowance.",
  ERC20InsufficientBalance: "Insufficient token balance.",
}

function extractCasperCode(message: string) {
  const match = message.match(/User error:\s*(\d+)/i)
  return match?.[1] ?? null
}

export function mapCasperError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  const code = extractCasperCode(message)
  if (code && CASPER_ERROR_CODES[code]) {
    return `${CASPER_ERROR_CODES[code]} (code ${code})`
  }
  return message
}

export function mapEvmError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  for (const [key, value] of Object.entries(EVM_ERROR_MESSAGES)) {
    if (message.includes(key)) return value
  }
  if (message.toLowerCase().includes("insufficient allowance")) {
    return EVM_ERROR_MESSAGES.ERC20InsufficientAllowance
  }
  if (message.toLowerCase().includes("insufficient balance")) {
    return EVM_ERROR_MESSAGES.ERC20InsufficientBalance
  }
  return message
}
