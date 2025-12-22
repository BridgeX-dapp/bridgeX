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

export async function queryLockedCanonicalEvents3(
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

  logger.info(
    { fromBlock, toBlock },
    'Querying historical LockedCanonical events',
  );

  // Build typed filter
  const filter = bridgeCore.filters.LockedCanonical();

  const events = await bridgeCore.queryFilter(filter, fromBlock, toBlock);

  logger.info({ count: events.length }, 'Fetched LockedCanonical events');

  return events.map((ev) => {
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

    return {
      token,
      sender,
      amount: grossAmount.toString(),
      destChainId: destChainId.toString(),
      destAddress: destRecipient,
      txHash: ev.transactionHash!,
      blockNumber: ev.blockNumber!,
      logIndex: ev.logIndex!,
      sourceChain: 'EVM',
      eventName: BRIDGE_EVENT.LOCKED_CANONICAL,
      netAmount: netAmount.toString(),
      feeAmount: feeAmount.toString(),
      nonce: nonce.toString(),
    };
  });
}
