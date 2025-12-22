import expressAsyncHandler from 'express-async-handler';
import { burnWrappedOnCasper } from '../chains/casper/bridge-core/burnWrapped';
import { toTokenUnits } from '../chains/casper/utils';

function isBytes32Hex(value: string) {
  const clean = value.startsWith('0x') ? value.slice(2) : value;
  return /^[0-9a-fA-F]{64}$/.test(clean);
}

export const burnWrappedCasper = expressAsyncHandler(async (req, res) => {
  const { token, amount, dstChainId, recipient, decimals = 6 } = req.body ?? {};

  if (!token || amount === undefined || dstChainId === undefined || !recipient) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if (!isBytes32Hex(recipient)) {
    res.status(400).json({ error: 'recipient must be 32 bytes hex' });
    return;
  }

  const amountRaw = toTokenUnits(amount, Number(decimals)).toString();

  const { deployHash } = await burnWrappedOnCasper({
    token,
    amount: BigInt(amountRaw),
    dstChainId: Number(dstChainId),
    recipient,
  });

  res.status(200).json({
    result: 'burn_wrapped submitted',
    deployHash,
    explorerUrl: `https://testnet.cspr.live/deploy/${deployHash}`,
  });
});
