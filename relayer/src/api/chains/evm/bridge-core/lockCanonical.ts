import { logger } from '../../../lib/utils/logger';
import { getBridgeCoreContract } from '../contracts';
import { normalizeAmount } from './utils';

export async function lockCanonicalOnEvm(params: {
  token: string;
  amount: string | number | bigint;
  destChainId: number;
  destAddress: string;
}) {
  const bridgeCore = getBridgeCoreContract();
  try {
    const tx = await bridgeCore.lockCanonical(
      params.token,
      normalizeAmount(params.amount),
      params.destChainId,
      params.destAddress,
    );

    logger.info({ txHash: tx.hash }, 'EVM lockCanonical submitted');

    return { txHash: tx.hash };
  } catch (error) {
    logger.error(
      { Trace: 'Locking canonical on evm', error: 'EVM lockCanonical failed' },
      error,
    );
  }
}
