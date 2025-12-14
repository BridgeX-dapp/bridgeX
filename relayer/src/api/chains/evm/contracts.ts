import { Contract } from 'ethers';
import BridgeCoreArtifact from '../evm/abis/bridgeCore.json';

import { loadEvmConfig } from './config';
import { createEvmSigner } from './signer';

export function getBridgeCoreContract(): Contract {
  const config = loadEvmConfig();
  const signer = createEvmSigner();

  const bridgeCore = new Contract(
    config.EVM_BRIDGE_CORE_ADDRESS,
    // the JSON artifact includes metadata; the Contract constructor expects the ABI array
    ((BridgeCoreArtifact as any).abi ?? BridgeCoreArtifact) as any,
    signer,
  );

  return bridgeCore;
}
