export const bridgeCoreAbi = [
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "destChainId", type: "uint256" },
      { internalType: "bytes32", name: "destRecipient", type: "bytes32" },
    ],
    name: "lockCanonical",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "wrappedToken", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "destChainId", type: "uint256" },
      { internalType: "bytes32", name: "destRecipient", type: "bytes32" },
    ],
    name: "burnWrapped",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "tokenConfigs",
    outputs: [
      { internalType: "bool", name: "isWhitelisted", type: "bool" },
      { internalType: "bool", name: "isCanonical", type: "bool" },
      { internalType: "uint256", name: "minAmount", type: "uint256" },
      { internalType: "uint256", name: "maxAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeBps",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nonce",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const
