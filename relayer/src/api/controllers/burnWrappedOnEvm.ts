import expressAsyncHandler from 'express-async-handler';
import { burnWrappedOnEvm } from '../chains/evm/bridge-core/burnWrapped';

export const burnWrappedEvm = expressAsyncHandler(async (req, res) => {
  const { wrappedToken, amount, destChainId, destAddress } = req.body ?? {};

  if (
    !wrappedToken ||
    amount === undefined ||
    destChainId === undefined ||
    !destAddress
  ) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const { txHash } = await burnWrappedOnEvm({
    wrappedToken,
    amount,
    destChainId: Number(destChainId),
    destAddress,
  });

  res.status(200).json({
    result: 'burnWrapped submitted',
    txHash,
  });
});

