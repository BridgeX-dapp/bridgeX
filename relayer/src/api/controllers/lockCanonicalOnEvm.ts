import expressAsyncHandler from 'express-async-handler';
import { lockCanonicalOnEvm } from '../chains/evm/bridge-core/lockCanonical';

export const lockCanonicalEvm = expressAsyncHandler(async (req, res) => {
  const { token, amount, destChainId, destAddress } = req.body ?? {};

  if (!token || amount === undefined || destChainId === undefined || !destAddress) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const { txHash } = await lockCanonicalOnEvm({
    token,
    amount,
    destChainId: Number(destChainId),
    destAddress,
  });

  res.status(200).json({
    result: 'lockCanonical submitted',
    txHash,
  });
});

