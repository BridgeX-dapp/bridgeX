import { Contract, providers } from 'ethers';
import { createEvmProviders } from './provider';
import { logger } from '../../lib/utils/logger';
import { EvmChainConfig, loadEvmChainConfigs, loadEvmConfig } from './config';
import BridgeCoreArtifact from '../evm/abis/bridgeCore.json';
import { normalizeLockedCanonical } from './bridge-core/normalizers/normalizeLockedCanonicalEvent';
import { normalizeBurnedWrapped } from './bridge-core/normalizers/normalizeBurnedWrappedEvent';
import { normalizeMintedWrapped } from './bridge-core/normalizers/normalizeMintedWrappedEvent';
import { normalizeUnlockedCanonical } from './bridge-core/normalizers/normalizeUnlockedCanonicalEvent';
import { generateEventIdCore } from '../../lib/utils/crossEventId';
import {
  enqueueLockedCanonical,
  enqueueEvmBurnedWrapped,
} from '../../lib/utils/jobs/queue/enqueue';
import {
  persistEvmSourceEvent,
  updateEvmDestinationStatus,
} from './persistEvents';
import prisma from '../../lib/utils/clients/prisma-client';

async function updateNetworkStatus(chainKey: string, blockNumber: number) {
  await prisma.networkStatus.upsert({
    where: { chain: chainKey },
    update: {
      lastProcessedBlock: {
        set: blockNumber,
      },
    },
    create: {
      chain: chainKey,
      lastProcessedBlock: blockNumber,
    },
  });
}

function getChainKey(config: EvmChainConfig) {
  return `evm:${config.name}`;
}

export async function startEvmListener(chainConfig?: EvmChainConfig) {
  const config = chainConfig ?? loadEvmConfig();
  const { httpProvider, wsProvider } = createEvmProviders(config);

  const provider: providers.JsonRpcProvider | providers.WebSocketProvider =
    wsProvider ?? httpProvider;

  const bridgeCore = new Contract(
    config.bridgeCoreAddress,
    ((BridgeCoreArtifact as any).abi ?? BridgeCoreArtifact) as any,
    provider,
  );

  logger.info(
    {
      chain: config.name,
      provider: wsProvider ? 'websocket' : 'http',
      wsUrl: config.wsUrl,
      httpUrl: config.httpUrl,
    },
    'Starting EVM event listener',
  );

  const chainKey = getChainKey(config);

  bridgeCore.on(
    'LockedCanonical',
    async (
      token: string,
      sender: string,
      amount,
      netAmount,
      feeAmount,
      nonce,
      destChainId,
      destRecipient,
      event,
    ) => {
      logger.info(
        {
          chain: config.name,
          token,
          sender,
          amount: amount.toString(),
          netAmount: netAmount.toString(),
          feeAmount: feeAmount.toString(),
          nonce: nonce.toString(),
          destChainId: destChainId.toString(),
          destRecipient,
          txHash: event.transactionHash,
        },
        'LockedCanonical event received',
      );

      try {
        const normalized = normalizeLockedCanonical(event);

        if (!normalized.nonce || !normalized.destChainId || !normalized.destAddress) {
          throw new Error('LockedCanonical missing required fields');
        }

        const eventId = generateEventIdCore({
          sourceChain: normalized.sourceChain,
          txHash: normalized.txHash,
          logIndex: normalized.logIndex,
          token: normalized.token,
          amount: normalized.amount,
          nonce: normalized.nonce,
          destChainId: normalized.destChainId,
          destAddress: normalized.destAddress,
        });

        await persistEvmSourceEvent({ eventId, ev: normalized, chainConfig: config });

        await enqueueLockedCanonical(eventId);

        await updateNetworkStatus(chainKey, event.blockNumber);
      } catch (error: any) {
        logger.error(
          {
            chain: config.name,
            stage: 'LIVE_LISTENER',
            action: 'LOCKED_CANONICAL',
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex,
            errorMessage: error?.message,
            errorStack: error?.stack,
          },
          'Failed to process LockedCanonical event',
        );
      }
    },
  );

  bridgeCore.on(
    'BurnedWrapped',
    async (
      wrappedToken: string,
      sender: string,
      grossAmount,
      netAmount,
      feeAmount,
      nonce,
      destChainId,
      destRecipient,
      event,
    ) => {
      logger.info(
        {
          chain: config.name,
          wrappedToken,
          sender,
          grossAmount: grossAmount.toString(),
          netAmount: netAmount.toString(),
          feeAmount: feeAmount.toString(),
          nonce: nonce.toString(),
          destChainId: destChainId.toString(),
          destRecipient,
          txHash: event.transactionHash,
        },
        'BurnedWrapped event received',
      );

      try {
        const normalized = normalizeBurnedWrapped(event);

        if (!normalized.nonce || !normalized.destChainId || !normalized.destAddress) {
          throw new Error('BurnedWrapped missing required fields');
        }

        const eventId = generateEventIdCore({
          sourceChain: normalized.sourceChain,
          txHash: normalized.txHash,
          logIndex: normalized.logIndex,
          token: normalized.token,
          amount: normalized.amount,
          nonce: normalized.nonce,
          destChainId: normalized.destChainId,
          destAddress: normalized.destAddress,
        });

        await persistEvmSourceEvent({ eventId, ev: normalized, chainConfig: config });

        await enqueueEvmBurnedWrapped(eventId);

        await updateNetworkStatus(chainKey, event.blockNumber);
      } catch (error: any) {
        logger.error(
          {
            chain: config.name,
            stage: 'LIVE_LISTENER',
            action: 'BURNED_WRAPPED',
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex,
            errorMessage: error?.message,
            errorStack: error?.stack,
          },
          'Failed to process BurnedWrapped event',
        );
      }
    },
  );

  bridgeCore.on(
    'MintedWrapped',
    async (wrappedToken: string, recipient: string, amount, eventId, event) => {
      logger.info(
        {
          chain: config.name,
          wrappedToken,
          recipient,
          amount: amount.toString(),
          eventId: eventId.toString(),
          txHash: event.transactionHash,
        },
        'MintedWrapped event received',
      );

      try {
        const normalized = normalizeMintedWrapped(event);

        if (!normalized.eventId) {
          throw new Error('MintedWrapped missing eventId');
        }

        await updateEvmDestinationStatus({
          eventId: normalized.eventId,
          destinationTxHash: normalized.txHash,
          eventName: normalized.eventName,
        });

        await updateNetworkStatus(chainKey, event.blockNumber);
      } catch (error: any) {
        logger.error(
          {
            chain: config.name,
            stage: 'LIVE_LISTENER',
            action: 'MINTED_WRAPPED',
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex,
            errorMessage: error?.message,
            errorStack: error?.stack,
          },
          'Failed to process MintedWrapped event',
        );
      }
    },
  );

  bridgeCore.on(
    'UnlockedCanonical',
    async (token: string, recipient: string, amount, eventId, event) => {
      logger.info(
        {
          chain: config.name,
          token,
          recipient,
          amount: amount.toString(),
          eventId: eventId.toString(),
          txHash: event.transactionHash,
        },
        'UnlockedCanonical event received',
      );

      try {
        const normalized = normalizeUnlockedCanonical(event);

        if (!normalized.eventId) {
          throw new Error('UnlockedCanonical missing eventId');
        }

        await updateEvmDestinationStatus({
          eventId: normalized.eventId,
          destinationTxHash: normalized.txHash,
          eventName: normalized.eventName,
        });

        await updateNetworkStatus(chainKey, event.blockNumber);
      } catch (error: any) {
        logger.error(
          {
            chain: config.name,
            stage: 'LIVE_LISTENER',
            action: 'UNLOCKED_CANONICAL',
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex,
            errorMessage: error?.message,
            errorStack: error?.stack,
          },
          'Failed to process UnlockedCanonical event',
        );
      }
    },
  );
}

export async function startAllEvmListeners() {
  const configs = loadEvmChainConfigs();
  if (configs.length === 0) {
    await startEvmListener(loadEvmConfig());
    return;
  }

  await Promise.all(configs.map((cfg) => startEvmListener(cfg)));
}
