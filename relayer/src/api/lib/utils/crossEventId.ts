import { utils } from 'ethers';

/**
 * Chain-agnostic, deterministic event ID generator
 */
export function generateEventIdCore(params: {
  sourceChain: 'EVM' | 'CASPER';
  txHash: string; // normalized hex (0x...)
  logIndex: number;
  token: string; // normalized string
  amount: string; // decimal string
  nonce: string; // decimal string
  destChainId: string;
  destAddress: string; // normalized string
}) {
  return utils.keccak256(
    utils.defaultAbiCoder.encode(
      [
        'string', // sourceChain
        'bytes32', // txHash
        'uint256', // logIndex
        'string', // token
        'uint256', // amount
        'uint256', // nonce
        'string', // destChainId
        'string', // destAddress
      ],
      [
        params.sourceChain,
        normalizeBytes32(params.txHash),
        params.logIndex,
        params.token.toLowerCase(),
        params.amount,
        params.nonce,
        params.destChainId,
        params.destAddress.toLowerCase(),
      ],
    ),
  );
}

function normalizeBytes32(hash: string): string {
  return hash.startsWith('0x') ? hash : `0x${hash}`;
}
