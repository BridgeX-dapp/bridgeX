import expressAsyncHandler from 'express-async-handler';
import { getBridgeCoreContract } from '../chains/evm/contracts';
import { erc20Abi } from 'viem';
import { Contract } from 'ethers';
import { createEvmSigner } from '../chains/evm/signer';
import { env } from '../config/env';

export const approveToken = expressAsyncHandler(async (req, res) => {
  const signer = createEvmSigner();
  const nativeToken = '0xc674Fc371792581A12Cd9F452eD7EC24Fba6e7dD';
  const bridgeCore = '0xEE8a1C43E67267E79a04EFce9c29537095301873';
  const token = new Contract(nativeToken, erc20Abi, signer);
  const handleApprove = async () => {
    await token.approve(bridgeCore, 10000);
  };

  try {
    await handleApprove();
    res.status(200).json({
      result: 'Approved tokens',
    });
  } catch (error) {
    res.status(500).json({ error });
  }
});
