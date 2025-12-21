import expressAsyncHandler from 'express-async-handler';
import { unlockFromBurnOnEvm } from '../chains/evm/bridge-core/unlockFromBurn';

export const unlockFromBurnEvm = expressAsyncHandler(async (req, res) => {
  const { token, recipient, amount, eventId } = req.body ?? {};

  if (!token || !recipient || amount === undefined || !eventId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const { txHash } = await unlockFromBurnOnEvm({
    token,
    recipient,
    amount,
    eventId,
  });

  res.status(200).json({
    result: 'unlockFromBurn submitted',
    txHash,
  });
});

