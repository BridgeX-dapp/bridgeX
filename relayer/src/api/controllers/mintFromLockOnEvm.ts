import expressAsyncHandler from 'express-async-handler';
import { mintFromLockOnEvm } from '../chains/evm/bridge-core/mintFromLock';
import { resolveEvmChainFromRequest } from './evmChain';
import { normalizeAmountInput } from '../lib/utils/amount';

export const mintFromLockEvm = expressAsyncHandler(async (req, res) => {
  const { chain, wrappedToken, recipient, amount, eventId, decimals } =
    req.body ?? {};

  if (!wrappedToken || !recipient || amount === undefined || !eventId) {
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

  const { txHash } = await mintFromLockOnEvm({
    wrappedToken,
    recipient,
    amount: normalizeAmountInput({
      amount,
      decimals: decimals !== undefined ? Number(decimals) : undefined,
    }),
    eventId,
    chainConfig,
  });

  res.status(200).json({
    result: 'mintFromLock submitted',
    txHash,
  });
});
