import expressAsyncHandler from 'express-async-handler';
import { mintFromLockOnEvm } from '../chains/evm/bridge-core/mintFromLock';

export const mintFromLockEvm = expressAsyncHandler(async (req, res) => {
  const { wrappedToken, recipient, amount, eventId } = req.body ?? {};

  if (!wrappedToken || !recipient || amount === undefined || !eventId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const { txHash } = await mintFromLockOnEvm({
    wrappedToken,
    recipient,
    amount,
    eventId,
  });

  res.status(200).json({
    result: 'mintFromLock submitted',
    txHash,
  });
});

