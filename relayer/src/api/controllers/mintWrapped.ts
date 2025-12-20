import expressAsyncHandler from 'express-async-handler';
import { mintWrappedOnCasper } from '../chains/casper/bridgeUtils/mintWrapped';

export const mintWrapped = expressAsyncHandler(async (req, res) => {
  const { token, recipient, amount, sourceChain, eventId } = req.body;

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
