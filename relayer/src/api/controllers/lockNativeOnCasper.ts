import expressAsyncHandler from 'express-async-handler';
import { toTokenUnits } from '../chains/casper/utils';
import { lockCanonicalOnCasper } from '../chains/casper/bridge-core/lockCanonical';

export const lockNativeCasper = expressAsyncHandler(async (req, res) => {
  const { amount = '1', token, destRecipient } = req.body;
  const isBytes32Hex = (value: string) => {
    const clean = value.startsWith('0x') ? value.slice(2) : value;
    return /^[0-9a-fA-F]{64}$/.test(clean);
  };
  const tokenHash =
    '71ac1a199ad8a5d33bbba9c0fb8357e26db8282c15addfa92db9f36c04b16dc4';
  const recipient =
    destRecipient ??
    '0x0000000000000000000000005f7260a3595713d6111c1381ba9bd520c0f6b4eb';
  const decimals = 6;

  if (!isBytes32Hex(recipient)) {
    res.status(400).json({ error: 'recipient must be 32 bytes hex' });
    return;
  }

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
