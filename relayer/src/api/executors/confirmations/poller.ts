import prisma from '../../lib/utils/clients/prisma-client';
import { logger } from '../../lib/utils/logger';
import { CHAIN, TX_STATUS } from '@prisma/client';
import { resolveEvmChainConfig } from '../../chains/evm/config';
import { createEvmProviders } from '../../chains/evm/provider';
import { createCasperRestClient, fetchLatestCasperBlockHeight } from '../../chains/casper/provider';

const POLL_INTERVAL_MS = Number(
  process.env.CONFIRMATION_POLL_INTERVAL_MS ?? 15_000,
);
const EVM_CONFIRMATIONS_REQUIRED = Number(
  process.env.EVM_CONFIRMATIONS_REQUIRED ?? 2,
);
const CASPER_CONFIRMATIONS_REQUIRED = Number(
  process.env.CASPER_CONFIRMATIONS_REQUIRED ?? 1,
);
const BATCH_SIZE = Number(process.env.CONFIRMATION_BATCH_SIZE ?? 50);

async function handleEvmConfirmation(tx: any, chainName: string) {
  const chainConfig = resolveEvmChainConfig(chainName);
  const { httpProvider } = createEvmProviders(chainConfig);

  const receipt = await httpProvider.getTransactionReceipt(tx.destinationTxHash);
  if (!receipt) return;

  if (receipt.confirmations < EVM_CONFIRMATIONS_REQUIRED) return;

  const status = receipt.status === 1 ? TX_STATUS.EXECUTED : TX_STATUS.FAILED;

  await prisma.transaction.update({
    where: { id: tx.id },
    data: {
      status,
      destinationBlockNumber: BigInt(receipt.blockNumber),
    },
  });
}

async function handleCasperConfirmation(tx: any, latestBlockHeight?: number) {
  const client = createCasperRestClient();
  const res = await client.get(`/deploys/${tx.destinationTxHash}`);
  const data = res.data?.data ?? {};
  const execResult = data.execution_results?.[0]?.result;
  const execBlock = data.execution_results?.[0]?.block_height;

  if (!execResult) return;

  if (execResult.Failure) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: TX_STATUS.FAILED,
        destinationBlockNumber: execBlock ? BigInt(execBlock) : null,
      },
    });
    return;
  }

  if (CASPER_CONFIRMATIONS_REQUIRED > 1) {
    if (typeof latestBlockHeight !== 'number') return;
    if (typeof execBlock !== 'number') return;
    const confirmations = latestBlockHeight - execBlock + 1;
    if (confirmations < CASPER_CONFIRMATIONS_REQUIRED) return;
  }

  await prisma.transaction.update({
    where: { id: tx.id },
    data: {
      status: TX_STATUS.EXECUTED,
      destinationBlockNumber: execBlock ? BigInt(execBlock) : null,
    },
  });
}

export function startConfirmationPoller() {
  setInterval(async () => {
    try {
      const executing = await prisma.transaction.findMany({
        where: {
          status: TX_STATUS.EXECUTING,
          destinationTxHash: { not: null },
        },
        include: {
          destChainRef: true,
        },
        take: BATCH_SIZE,
      });

      if (executing.length === 0) return;

      const needsCasperHeight =
        CASPER_CONFIRMATIONS_REQUIRED > 1 &&
        executing.some((tx) => tx.destChainRef?.kind === CHAIN.CASPER);

      const latestCasperBlock = needsCasperHeight
        ? await fetchLatestCasperBlockHeight(createCasperRestClient())
        : undefined;

      for (const tx of executing) {
        if (!tx.destChainRef?.kind) continue;

        if (tx.destChainRef.kind === CHAIN.EVM) {
          await handleEvmConfirmation(tx, tx.destChainRef.name);
        } else if (tx.destChainRef.kind === CHAIN.CASPER) {
          await handleCasperConfirmation(tx, latestCasperBlock);
        }
      }
    } catch (error) {
      logger.error({ error }, 'Confirmation poller failed');
    }
  }, POLL_INTERVAL_MS);
}
