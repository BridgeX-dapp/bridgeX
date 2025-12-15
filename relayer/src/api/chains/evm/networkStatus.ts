import prisma from '../../lib/utils/clients/prisma-client';

export async function updateEvmNetworkStatus(blockNumber: number) {
  await prisma.networkStatus.upsert({
    where: { chain: 'EVM' },
    update: {
      lastProcessedBlock: blockNumber,
    },
    create: {
      chain: 'EVM',
      lastProcessedBlock: blockNumber,
    },
  });
}
