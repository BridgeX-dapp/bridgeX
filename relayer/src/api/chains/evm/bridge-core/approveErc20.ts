import { Contract } from 'ethers';
import { erc20Abi } from 'viem';
import { logger } from '../../../lib/utils/logger';
import { createEvmSigner } from '../signer';
import { normalizeAmount } from './utils';

export async function approveErc20OnEvm(params: {
  token: string;
  spender: string;
  amount: string | number | bigint;
}) {
  const signer = createEvmSigner();
  const token = new Contract(params.token, erc20Abi, signer);

  const tx = await token.approve(
    params.spender,
    normalizeAmount(params.amount),
  );

  logger.info({ txHash: tx.hash }, 'EVM approve ERC20 submitted');

  return { txHash: tx.hash };
}

