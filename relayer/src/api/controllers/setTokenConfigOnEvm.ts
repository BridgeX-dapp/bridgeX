import expressAsyncHandler from 'express-async-handler';
import { setTokenConfigOnEvm } from '../chains/evm/bridge-core/setTokenConfig';

export const setTokenConfigEvm = expressAsyncHandler(async (req, res) => {
  const { token, isWhitelisted, isCanonical, minAmount, maxAmount } =
    req.body ?? {};

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

  const { txHash } = await setTokenConfigOnEvm({
    token,
    isWhitelisted: Boolean(isWhitelisted),
    isCanonical: Boolean(isCanonical),
    minAmount,
    maxAmount,
  });

  res.status(200).json({
    result: 'setTokenConfig submitted',
    txHash,
  });
});

