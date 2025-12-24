import { Contract } from 'ethers';
import BridgeCoreArtifact from '../evm/abis/bridgeCore.json';

import { EvmChainConfig, loadEvmConfig } from './config';
import { createEvmSigner } from './signer';

export function getBridgeCoreContract(chainConfig?: EvmChainConfig): Contract {
  const config = chainConfig ?? loadEvmConfig();
  const signer = createEvmSigner(chainConfig);

  const bridgeCore = new Contract(
    config.bridgeCoreAddress,
    ((BridgeCoreArtifact as any).abi ?? BridgeCoreArtifact) as any,
    signer,
  );

  return bridgeCore;
}
