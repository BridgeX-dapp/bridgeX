import expressAsyncHandler from 'express-async-handler';
import { unlockFromBurnOnEvm } from '../chains/evm/bridge-core/unlockFromBurn';
import { resolveEvmChainFromRequest } from './evmChain';
import { normalizeAmountInput } from '../lib/utils/amount';

export const unlockFromBurnEvm = expressAsyncHandler(async (req, res) => {
  const { chain, token, recipient, amount, eventId, decimals } = req.body ?? {};

  if (!token || !recipient || amount === undefined || !eventId) {
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

  const { txHash } = await unlockFromBurnOnEvm({
    token,
    recipient,
    amount: normalizeAmountInput({
      amount,
      decimals: decimals !== undefined ? Number(decimals) : undefined,
    }),
    eventId,
    chainConfig,
  });

  res.status(200).json({
    result: 'unlockFromBurn submitted',
    txHash,
  });
});
