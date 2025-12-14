//import { keccak256, stringToBytes } from 'viem';
import { utils } from 'ethers';
export function generateEventId(params: {
  sourceChain: string;
  destinationChain: string;
  token: string;
  sender: string;
  recipient: string;
  amount: string;
  nonce: string;
}) {
  const payload = [
    params.sourceChain,
    params.destinationChain,
    params.token.toLowerCase(),
    params.sender.toLowerCase(),
    params.recipient.toLowerCase(),
    params.amount,
    params.nonce,
  ].join('|');

  return utils.keccak256(utils.toUtf8Bytes(payload));
}
