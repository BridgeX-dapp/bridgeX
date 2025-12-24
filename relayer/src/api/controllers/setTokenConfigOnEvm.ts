import expressAsyncHandler from 'express-async-handler';
import { setTokenConfigOnEvm } from '../chains/evm/bridge-core/setTokenConfig';
import { resolveEvmChainFromRequest } from './evmChain';
import { normalizeAmountInput } from '../lib/utils/amount';

export const setTokenConfigEvm = expressAsyncHandler(async (req, res) => {
  const {
    chain,
    token,
    isWhitelisted,
    isCanonical,
    minAmount,
    maxAmount,
    decimals,
  } = req.body ?? {};

  if (
    !token ||
    isWhitelisted === undefined ||
    isCanonical === undefined ||
    minAmount === undefined ||
    maxAmount === undefined
  ) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  let chainConfig;
  try {
    chainConfig = resolveEvmChainFromRequest(chain);
  } catch (error: any) {
    res.status(400).json({ error: error?.message ?? 'Invalid chain' });
    return;
  }

  const { txHash } = await setTokenConfigOnEvm({
    token,
    isWhitelisted: Boolean(isWhitelisted),
    isCanonical: Boolean(isCanonical),
    minAmount: normalizeAmountInput({
      amount: minAmount,
      decimals: decimals !== undefined ? Number(decimals) : undefined,
    }),
    maxAmount: normalizeAmountInput({
      amount: maxAmount,
      decimals: decimals !== undefined ? Number(decimals) : undefined,
    }),
    chainConfig,
  });

  res.status(200).json({
    result: 'setTokenConfig submitted',
    txHash,
  });
});
