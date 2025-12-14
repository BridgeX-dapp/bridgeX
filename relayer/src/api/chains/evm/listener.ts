import { Contract, utils, providers } from 'ethers';
import { createEvmProviders } from './provider';
import { getBridgeCoreContract } from './contracts';
import { logger } from '../../lib/utils/logger';
import { loadEvmConfig } from './config';
import { env } from '../../config/env';
import BridgeCoreArtifact from '../evm/abis/bridgeCore.json';

export function startEvmListener() {
  const { httpProvider, wsProvider } = createEvmProviders();

  // Prefer WebSocket for real-time events
  const provider: providers.JsonRpcProvider | providers.WebSocketProvider =
    wsProvider ?? httpProvider;

  //const bridgeCore = getBridgeCoreContract();
  const config = loadEvmConfig();

  const bridgeCore = new Contract(
    config.EVM_BRIDGE_CORE_ADDRESS as string,
    ((BridgeCoreArtifact as any).abi ?? BridgeCoreArtifact) as any,
    provider,
  );

  logger.info(
    {
      wsUrl: process.env.EVM_RPC_WS_URL,
      httpUrl: process.env.EVM_RPC_HTTP_URL,
    },
    'EVM RPC URLs',
  );

  logger.info({ wsUrl: config.EVM_RPC_WS_URL }, 'Using EVM WebSocket RPC');

  logger.info(
    {
      provider: wsProvider ? 'websocket' : 'http',
    },
    'Starting EVM event listener',
  );

  /**
   * 🔔 Listen for canonical lock events
   */

  /*provider.on('block', (blockNumber) => {
    console.log('🧱 New block:', blockNumber);
  });*/

  bridgeCore.on(
    'LockedCanonical',
    (
      token: string,
      sender: string,
      amount,
      netAmount,
      feeAmount,
      nonce,
      destChainId,
      destAddress,
      event,
    ) => {
      logger.info(
        {
          token,
          sender,
          amount: amount.toString(),
          netAmount: netAmount.toString(),
          feeAmount: feeAmount.toString(),
          nonce: nonce.toString(),
          destChainId: destChainId.toString(),
          destAddress,
          txHash: event.transactionHash,
        },
        '🔔 LockedCanonical event received',
      );

      // 👉 In next blocks:
      // - normalize event
      // - generate eventId
      // - persist to DB
      // - enqueue job
    },
  );
}
