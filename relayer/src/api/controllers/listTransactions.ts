import expressAsyncHandler from 'express-async-handler';
import prisma from '../lib/utils/clients/prisma-client';

function serializeTransaction(tx: any) {
  return {
    ...tx,
    sourceBlockNumber: tx.sourceBlockNumber?.toString?.(),
    destinationBlockNumber: tx.destinationBlockNumber?.toString?.(),
    nonce: tx.nonce?.toString?.(),
  };
}

export const listTransactions = expressAsyncHandler(async (req, res) => {
  const { sourceTxHash, eventId, destChainId } = req.query ?? {};

  const where: any = {};

  if (sourceTxHash) {
    where.sourceTxHash = String(sourceTxHash);
  }

  if (eventId) {
    where.eventId = String(eventId);
  }

  if (destChainId) {
    where.destChainId = String(destChainId);
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: 50,
    include: {
      sourceChainRef: true,
      destChainRef: true,
      tokenRef: true,
    },
  });

  res.status(200).json({
    transactions: transactions.map(serializeTransaction),
  });
});
