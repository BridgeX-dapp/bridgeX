import expressAsyncHandler from 'express-async-handler';
import { toTokenUnits } from '../chains/casper/utils';
import { lockCanonicalOnCasper } from '../chains/casper/bridge-core/lockCanonical';

export const lockNativeCasper = expressAsyncHandler(async (req, res) => {
  const { amount, token } = req.body;
  const tokenHash =
    '71ac1a199ad8a5d33bbba9c0fb8357e26db8282c15addfa92db9f36c04b16dc4';
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
