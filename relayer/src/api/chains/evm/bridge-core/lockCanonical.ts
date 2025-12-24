import { logger } from '../../../lib/utils/logger';
import { getBridgeCoreContract } from '../contracts';
import { normalizeAmount, normalizeRecipientBytes32 } from './utils';

export async function lockCanonicalOnEvm(params: {
  token: string;
  amount: string | number | bigint;
  destChainId: number;
  destRecipient: string;
  chainConfig?: Parameters<typeof getBridgeCoreContract>[0];
}) {
  const bridgeCore = getBridgeCoreContract(params.chainConfig);
  try {
    const tx = await bridgeCore.lockCanonical(
      params.token,
      normalizeAmount(params.amount),
      params.destChainId,
      normalizeRecipientBytes32(params.destRecipient),
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
