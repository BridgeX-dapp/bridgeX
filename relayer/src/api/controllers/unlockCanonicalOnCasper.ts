import expressAsyncHandler from 'express-async-handler';
import { unlockCanonicalOnCasper } from '../chains/casper/bridge-core/unlokCanonical';

export const unlockCanonical = expressAsyncHandler(async (req, res) => {
  const { token, recipient, amount, sourceChain, eventId } = req.body ?? {};

  const { deployHash } = await unlockCanonicalOnCasper({
    token,
    recipient,
    amount,
    sourceChain: Number(sourceChain),
    eventId,
  });

  res.json({
    result: 'unlock_canonical submitted',
    deployHash,
    explorer: `https://testnet.cspr.live/deploy/${deployHash}`,
  });
});
