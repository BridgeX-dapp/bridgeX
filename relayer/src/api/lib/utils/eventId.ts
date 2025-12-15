import { utils } from 'ethers';

export function generateEventId(params: {
  sourceChain: string;
  txHash: string;
  logIndex: number;
  token: string;
  amount: string;
  nonce: string;
  destChainId: string;
  destAddress: string;
}) {
  return utils.keccak256(
    utils.defaultAbiCoder.encode(
      [
        'string', // sourceChain
        'bytes32', // txHash
        'uint256', // logIndex
        'address', // token
        'uint256', // amount
        'uint256', // nonce
        'string', // destChainId
        'address', // destAddress
      ],
      [
        params.sourceChain,
        params.txHash,
        params.logIndex,
        params.token,
        params.amount,
        params.nonce,
        params.destChainId,
        params.destAddress,
      ],
    ),
  );
}
