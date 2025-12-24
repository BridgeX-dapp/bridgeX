import { logger } from '../../../lib/utils/logger';
import { getBridgeCoreContract } from '../contracts';
import { normalizeAmount } from './utils';

export async function setTokenConfigOnEvm(params: {
  token: string;
  isWhitelisted: boolean;
  isCanonical: boolean;
  minAmount: string | number | bigint;
  maxAmount: string | number | bigint;
  chainConfig?: Parameters<typeof getBridgeCoreContract>[0];
}) {
  const bridgeCore = getBridgeCoreContract(params.chainConfig);

  const tx = await bridgeCore.setTokenConfig(
    params.token,
    params.isWhitelisted,
    params.isCanonical,
    normalizeAmount(params.minAmount),
    normalizeAmount(params.maxAmount),
  );

  logger.info({ txHash: tx.hash }, 'EVM setTokenConfig submitted');

  return { txHash: tx.hash };
}
