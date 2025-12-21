import expressAsyncHandler from 'express-async-handler';
import { approveErc20OnEvm } from '../chains/evm/bridge-core/approveErc20';

export const approveErc20Evm = expressAsyncHandler(async (req, res) => {
  const { token, spender, amount } = req.body ?? {};

  if (!token || !spender || amount === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const { txHash } = await approveErc20OnEvm({
    token,
    spender,
    amount,
  });

  res.status(200).json({
    result: 'approve submitted',
    txHash,
  });
});

