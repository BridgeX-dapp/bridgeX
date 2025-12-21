import expressAsyncHandler from 'express-async-handler';
import { setTokenConfigOnCasper } from '../chains/casper/bridge-core/setTokenConfig';
import { toTokenUnits } from '../chains/casper/utils';

export const setTokenConfig = expressAsyncHandler(async (req, res) => {
  const { token, isWhitelisted, isCanonical, minAmount, maxAmount } = req.body;

  const decimals = 6;

  const minAmountRaw = toTokenUnits(minAmount, decimals).toString();
  const maxAmountRaw = toTokenUnits(maxAmount, decimals).toString();

  if (
    !token ||
    isWhitelisted === undefined ||
    isCanonical === undefined ||
    minAmount === undefined ||
    maxAmount === undefined
  ) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const { deployHash } = await setTokenConfigOnCasper({
    token,
    isWhitelisted: Boolean(isWhitelisted),
    isCanonical: Boolean(isCanonical),
    minAmount: BigInt(minAmountRaw),
    maxAmount: BigInt(maxAmountRaw),
  });

  res.status(200).json({
    result: 'Token config updated',
    deployHash,
    explorerUrl: `https://testnet.cspr.live/deploy/${deployHash}`,
  });
});
