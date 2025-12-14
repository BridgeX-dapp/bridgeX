import expressAsyncHandler from 'express-async-handler';
import { getBridgeCoreContract } from '../chains/evm/contracts';

export const lockNative = expressAsyncHandler(async (req, res) => {
  const bridgeCore = getBridgeCoreContract();

  const handleLock = async () => {
    await bridgeCore.lockCanonical(
      '0xc674Fc371792581A12Cd9F452eD7EC24Fba6e7dD',
      10,
      20,
      '0x4c9972f2aa16b643440488a788e933c139ff0323',
    );
  };

  try {
    await handleLock();
    res.status(200).json({
      result: 'Locked tokens',
    });
  } catch (error) {
    res.status(500).json({ error });
  }
});
