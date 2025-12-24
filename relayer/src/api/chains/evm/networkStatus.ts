import prisma from '../../lib/utils/clients/prisma-client';

export async function updateEvmNetworkStatus(chainKey: string, blockNumber: number) {
  await prisma.networkStatus.upsert({
    where: { chain: chainKey },
    update: {
      lastProcessedBlock: blockNumber,
    },
    create: {
      chain: chainKey,
      lastProcessedBlock: blockNumber,
    },
  });
}
