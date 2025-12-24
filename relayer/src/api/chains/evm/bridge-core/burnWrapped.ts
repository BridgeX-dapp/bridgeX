import { logger } from '../../../lib/utils/logger';
import { getBridgeCoreContract } from '../contracts';
import { normalizeAmount, normalizeRecipientBytes32 } from './utils';

export async function burnWrappedOnEvm(params: {
  wrappedToken: string;
  amount: string | number | bigint;
  destChainId: number;
  destRecipient: string;
  chainConfig?: Parameters<typeof getBridgeCoreContract>[0];
}) {
  const bridgeCore = getBridgeCoreContract(params.chainConfig);

  const tx = await bridgeCore.burnWrapped(
    params.wrappedToken,
    normalizeAmount(params.amount),
    params.destChainId,
    normalizeRecipientBytes32(params.destRecipient),
  );

  logger.info({ txHash: tx.hash }, 'EVM burnWrapped submitted');

  return { txHash: tx.hash };
}
