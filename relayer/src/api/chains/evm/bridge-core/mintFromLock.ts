import { logger } from '../../../lib/utils/logger';
import { getBridgeCoreContract } from '../contracts';
import { normalizeAmount, normalizeBytes32 } from './utils';

export async function mintFromLockOnEvm(params: {
  wrappedToken: string;
  recipient: string;
  amount: string | number | bigint;
  eventId: string;
}) {
  const bridgeCore = getBridgeCoreContract();

  const tx = await bridgeCore.mintFromLock(
    params.wrappedToken,
    params.recipient,
    normalizeAmount(params.amount),
    normalizeBytes32(params.eventId),
  );

  logger.info({ txHash: tx.hash }, 'EVM mintFromLock submitted');

  return { txHash: tx.hash };
}

