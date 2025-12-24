import expressAsyncHandler from 'express-async-handler';
import { lockCanonicalOnEvm } from '../chains/evm/bridge-core/lockCanonical';
import { resolveEvmChainFromRequest } from './evmChain';
import { normalizeAmountInput } from '../lib/utils/amount';

export const lockCanonicalEvm = expressAsyncHandler(async (req, res) => {
  const { chain, token, amount, destChainId, destRecipient, decimals } =
    req.body ?? {};

  const isBytes32Hex = (value: string) => {
    const clean = value.startsWith('0x') ? value.slice(2) : value;
    return /^[0-9a-fA-F]{64}$/.test(clean);
  };

  if (!token || amount === undefined || destChainId === undefined || !destRecipient) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  if (!isBytes32Hex(destRecipient)) {
    res.status(400).json({ error: 'destRecipient must be 32 bytes hex' });
    return;
  }

  let chainConfig;
  try {
    chainConfig = resolveEvmChainFromRequest(chain);
  } catch (error: any) {
    res.status(400).json({ error: error?.message ?? 'Invalid chain' });
    return;
  }

  const { txHash } = await lockCanonicalOnEvm({
    token,
    amount: normalizeAmountInput({
      amount,
      decimals: decimals !== undefined ? Number(decimals) : undefined,
    }),
    destChainId: Number(destChainId),
    destRecipient,
    chainConfig,
  });

  res.status(200).json({
    result: 'lockCanonical submitted',
    txHash,
  });
});
