import prisma from '../../lib/utils/clients/prisma-client';

export async function updateCasperNetworkStatus(chainKey: string, blockHeight: number) {
  await prisma.networkStatus.upsert({
    where: { chain: chainKey },
    update: {
      lastProcessedBlock: blockHeight,
    },
    create: {
      chain: chainKey,
      lastProcessedBlock: blockHeight,
    },
  });
}
