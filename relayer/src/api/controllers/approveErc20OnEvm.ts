import expressAsyncHandler from 'express-async-handler';
import { approveErc20OnEvm } from '../chains/evm/bridge-core/approveErc20';
import { resolveEvmChainFromRequest } from './evmChain';
import { normalizeAmountInput } from '../lib/utils/amount';

export const approveErc20Evm = expressAsyncHandler(async (req, res) => {
  const { chain, token, spender, amount, decimals } = req.body ?? {};

  if (!token || !spender || amount === undefined) {
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

  const { txHash } = await approveErc20OnEvm({
    token,
    spender,
    amount: normalizeAmountInput({
      amount,
      decimals: decimals !== undefined ? Number(decimals) : undefined,
    }),
    chainConfig,
  });

  res.status(200).json({
    result: 'approve submitted',
    txHash,
  });
});
