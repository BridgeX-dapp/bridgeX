import expressAsyncHandler from 'express-async-handler';
import { lockCanonicalOnCasper } from '../chains/casper/bridge-core/lockCanonical';
import { normalizeAmountInput } from '../lib/utils/amount';

export const lockNativeCasper = expressAsyncHandler(async (req, res) => {
  const { amount = '1', token, destRecipient, decimals = 6 } = req.body;
  const isBytes32Hex = (value: string) => {
    const clean = value.startsWith('0x') ? value.slice(2) : value;
    return /^[0-9a-fA-F]{64}$/.test(clean);
  };
  const tokenHash =
    'b2a04010466d5dff85802a46f8f24a38507c673598fd8c5279deb0c829c3cbe7';
  const recipient =
    destRecipient ??
    '0x0000000000000000000000005f7260a3595713d6111c1381ba9bd520c0f6b4eb';
  if (!isBytes32Hex(recipient)) {
    res.status(400).json({ error: 'recipient must be 32 bytes hex' });
    return;
  }

  const amountRaw = normalizeAmountInput({
    amount,
    decimals: Number(decimals),
  });
  try {
    const { deployHash } = await lockCanonicalOnCasper({
      token: tokenHash,
      amount: BigInt(amountRaw),
      dstChainId: 102,
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
