import { logger } from '../../../lib/utils/logger';
import { getBridgeCoreContract } from '../contracts';
import { normalizeAmount } from './utils';

export async function burnWrappedOnEvm(params: {
  wrappedToken: string;
  amount: string | number | bigint;
  destChainId: number;
  destAddress: string;
}) {
  const bridgeCore = getBridgeCoreContract();

  const tx = await bridgeCore.burnWrapped(
    params.wrappedToken,
    normalizeAmount(params.amount),
    params.destChainId,
    params.destAddress,
  );

  logger.info({ txHash: tx.hash }, 'EVM burnWrapped submitted');

  return { txHash: tx.hash };
}

