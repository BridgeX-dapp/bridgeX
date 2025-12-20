import expressAsyncHandler from 'express-async-handler';
import { lockCanonicalOnCasper } from '../chains/casper/bridgeCore';
import { toTokenUnits } from '../chains/casper/utils';

export const lockNativeCasper = expressAsyncHandler(async (req, res) => {
  const { amount, token } = req.body;
  const tokenHash =
    'b80fe386feaaec091183cd0587c5de3fd402e70d3f3b50e28f6b662b9a486d3e';
  const recipient =
    '0203b7f91dd1ddb5da792a79dfc9b6fe2d4447eb97790338718280ae1c0cbb24f2d5';
  const decimals = 6;

  const amountRaw = toTokenUnits(amount, decimals).toString();
  try {
    const { deployHash } = await lockCanonicalOnCasper({
      token: tokenHash,
      amount: BigInt(amountRaw),
      dstChainId: 5,
      recipient,
    });

    res.status(200).json({
      result: 'Locked tokens on Casper',
      deployHash,
      explorerUrl: `https://testnet.cspr.live/deploy/${deployHash}`,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
});
