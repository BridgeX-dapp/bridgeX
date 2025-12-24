import { logger } from '../../../lib/utils/logger';
import { getBridgeCoreContract } from '../contracts';
import { normalizeAmount, normalizeBytes32 } from './utils';

export async function unlockFromBurnOnEvm(params: {
  token: string;
  recipient: string;
  amount: string | number | bigint;
  eventId: string;
  chainConfig?: Parameters<typeof getBridgeCoreContract>[0];
}) {
  const bridgeCore = getBridgeCoreContract(params.chainConfig);

  const tx = await bridgeCore.unlockFromBurn(
    params.token,
    params.recipient,
    normalizeAmount(params.amount),
    normalizeBytes32(params.eventId),
  );

  logger.info({ txHash: tx.hash }, 'EVM unlockFromBurn submitted');

  return { txHash: tx.hash };
}
