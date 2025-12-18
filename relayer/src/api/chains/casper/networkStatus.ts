import prisma from '../../lib/utils/clients/prisma-client';

export async function updateCasperNetworkStatus(blockHeight: number) {
  await prisma.networkStatus.upsert({
    where: { chain: 'CASPER' },
    update: {
      lastProcessedBlock: blockHeight,
    },
    create: {
      chain: 'CASPER',
      lastProcessedBlock: blockHeight,
    },
  });
}

