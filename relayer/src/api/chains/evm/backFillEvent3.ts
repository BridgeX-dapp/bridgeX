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

export async function queryLockedCanonicalEvents3(
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

  logger.info(
    { chain: config.name, fromBlock, toBlock },
    'Querying historical LockedCanonical events',
  );

  const filter = bridgeCore.filters.LockedCanonical();

  const events = await bridgeCore.queryFilter(filter, fromBlock, toBlock);

  logger.info({ chain: config.name, count: events.length }, 'Fetched LockedCanonical events');

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
