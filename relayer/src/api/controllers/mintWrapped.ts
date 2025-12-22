import expressAsyncHandler from 'express-async-handler';
import { mintWrappedOnCasper } from '../chains/casper/bridge-core/mintWrapped';

export const mintWrapped = expressAsyncHandler(async (req, res) => {
  const { token, recipient, amount, sourceChain, eventId } = req.body;

  const isBytes32Hex = (value: string) => {
    const clean = value.startsWith('0x') ? value.slice(2) : value;
    return /^[0-9a-fA-F]{64}$/.test(clean);
  };

  if (!isBytes32Hex(recipient)) {
    res.status(400).json({ error: 'recipient must be 32 bytes hex' });
    return;
  }

  const { deployHash } = await mintWrappedOnCasper({
    token,
    recipient,
    amount,
    sourceChain,
    eventId,
  });

  res.json({
    result: 'mint_wrapped submitted',
    deployHash,
    explorer: `https://testnet.cspr.live/deploy/${deployHash}`,
  });
});
