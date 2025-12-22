import expressAsyncHandler from 'express-async-handler';
import { burnWrappedOnEvm } from '../chains/evm/bridge-core/burnWrapped';

export const burnWrappedEvm = expressAsyncHandler(async (req, res) => {
  const { wrappedToken, amount, destChainId, destRecipient } = req.body ?? {};

  const isBytes32Hex = (value: string) => {
    const clean = value.startsWith('0x') ? value.slice(2) : value;
    return /^[0-9a-fA-F]{64}$/.test(clean);
  };

  if (
    !wrappedToken ||
    amount === undefined ||
    destChainId === undefined ||
    !destRecipient
  ) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  if (!isBytes32Hex(destRecipient)) {
    res.status(400).json({ error: 'destRecipient must be 32 bytes hex' });
    return;
  }

  const { txHash } = await burnWrappedOnEvm({
    wrappedToken,
    amount,
    destChainId: Number(destChainId),
    destRecipient,
  });

  res.status(200).json({
    result: 'burnWrapped submitted',
    txHash,
  });
});
