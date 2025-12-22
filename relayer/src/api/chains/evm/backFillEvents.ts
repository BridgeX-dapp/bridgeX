import { Contract, providers, Event } from 'ethers';
import { loadEvmConfig } from './config';
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
): Promise<NormalizedLockedEvent[]> {
  const config = loadEvmConfig();

  const bridgeCore = new Contract(
    config.EVM_BRIDGE_CORE_ADDRESS!,
    (BridgeCoreArtifact as any).abi ?? BridgeCoreArtifact,
    provider,
  );

  const filter = bridgeCore.filters.LockedCanonical();

  const allEvents: NormalizedLockedEvent[] = [];

  logger.info(
    { fromBlock, toBlock },
    'Starting chunked backfill for LockedCanonical',
  );

  for (let start = fromBlock; start <= toBlock; start += BLOCK_CHUNK_SIZE) {
    const end = Math.min(start + BLOCK_CHUNK_SIZE - 1, toBlock);

    logger.info({ start, end }, 'Fetching LockedCanonical chunk');

    const events = await bridgeCore.queryFilter(filter, start, end);

    for (const ev of events) {
      /**
       * LockedCanonical event signature:
       *
       * event LockedCanonical(
       *   address token,
       *   address sender,
       *   uint256 grossAmount,
       *   uint256 netAmount,
       *   uint256 feeAmount,
       *   uint256 nonce,
       *   uint256 destChainId,
       *   bytes32 destRecipient
       * )
       */
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
    { count: allEvents.length },
    'Finished backfill for LockedCanonical',
  );

  return allEvents;
}
