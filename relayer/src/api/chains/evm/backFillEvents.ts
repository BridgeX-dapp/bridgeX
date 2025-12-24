import { Contract, providers, Event } from 'ethers';
import { EvmChainConfig, loadEvmConfig } from './config';
import BridgeCoreArtifact from '../evm/abis/bridgeCore.json';
import { logger } from '../../lib/utils/logger';
import { NormalizedLockedEvent } from './bridge-core/normalizers/normalizeLockedCanonicalEvent';
import { BRIDGE_EVENT } from '@prisma/client';

export type LockedCanonicalEvent = {
  token: string;
  sender: string;
  amount: string;
  destChainId: string;
  destAddress: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
};
const BLOCK_CHUNK_SIZE = 1000;
export async function queryLockedCanonicalEvents(
  provider: providers.Provider,
  fromBlock: number,
  toBlock: number,
  chainConfig?: EvmChainConfig,
): Promise<NormalizedLockedEvent[]> {
  const config = chainConfig ?? loadEvmConfig();

  const bridgeCore = new Contract(
    config.bridgeCoreAddress,
    (BridgeCoreArtifact as any).abi ?? BridgeCoreArtifact,
    provider,
  );

  const filter = bridgeCore.filters.LockedCanonical();

  const allEvents: NormalizedLockedEvent[] = [];

  logger.info(
    { chain: config.name, fromBlock, toBlock },
    'Starting chunked backfill for LockedCanonical',
  );

  for (let start = fromBlock; start <= toBlock; start += BLOCK_CHUNK_SIZE) {
    const end = Math.min(start + BLOCK_CHUNK_SIZE - 1, toBlock);

    logger.info({ chain: config.name, start, end }, 'Fetching LockedCanonical chunk');

    const events = await bridgeCore.queryFilter(filter, start, end);

    for (const ev of events) {
      const [
        token,
        sender,
        grossAmount,
        netAmount,
        feeAmount,
        nonce,
        destChainId,
        destRecipient,
      ] = ev.args!;

      allEvents.push({
        sourceChain: 'EVM',
        eventName: BRIDGE_EVENT.LOCKED_CANONICAL,

        token,
        sender,
        amount: grossAmount.toString(),
        netAmount: netAmount.toString(),
        feeAmount: feeAmount.toString(),
        nonce: nonce.toString(),

        destChainId: destChainId.toString(),
        destAddress: destRecipient,

        txHash: ev.transactionHash!,
        blockNumber: ev.blockNumber!,
        logIndex: ev.logIndex!,
      });
    }
  }

  logger.info(
    { chain: config.name, count: allEvents.length },
    'Finished backfill for LockedCanonical',
  );

  return allEvents;
}
