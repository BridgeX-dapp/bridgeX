import expressAsyncHandler from 'express-async-handler';
import { debugGetTokenConfigOnCasper } from '../chains/casper/debugTokenConfig';

export const debugGetTokenConfig = expressAsyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: 'token is required' });
    return;
  }

  const { deployHash } = await debugGetTokenConfigOnCasper(token);

  res.json({
    result: 'debug get_token_config submitted',
    deployHash,
    explorer: `https://testnet.cspr.live/deploy/${deployHash}`,
  });
});
