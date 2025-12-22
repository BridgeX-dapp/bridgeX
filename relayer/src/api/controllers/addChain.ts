import expressAsyncHandler from 'express-async-handler';
import { CHAIN } from '@prisma/client';
import prisma from '../lib/utils/clients/prisma-client';

export const addChain = expressAsyncHandler(async (req, res) => {
  const { name, kind, chainId, displayName, logoUrl } = req.body ?? {};

  if (!name || !kind) {
    res.status(400).json({ error: 'name and kind are required' });
    return;
  }

  const kindValue = String(kind).toUpperCase();
  if (!(kindValue in CHAIN)) {
    res.status(400).json({ error: 'kind must be EVM or CASPER' });
    return;
  }

  const parsedChainId =
    chainId === undefined || chainId === null ? null : Number(chainId);
  if (parsedChainId !== null && !Number.isFinite(parsedChainId)) {
    res.status(400).json({ error: 'chainId must be a number' });
    return;
  }

  const chain = await prisma.chain.create({
    data: {
      name: String(name).toLowerCase(),
      kind: kindValue as CHAIN,
      chainId: parsedChainId,
      displayName: displayName ?? null,
      logoUrl: logoUrl ?? null,
    },
  });

  res.status(201).json({
    result: 'chain created',
    chain,
  });
});

export const listChains = expressAsyncHandler(async (req, res) => {
  const { name, kind, chainId } = req.query ?? {};

  const where: any = {};

  if (name) {
    where.name = String(name).toLowerCase();
  }

  if (kind) {
    where.kind = String(kind).toUpperCase();
  }

  if (chainId !== undefined) {
    const parsedChainId = Number(chainId);
    if (!Number.isFinite(parsedChainId)) {
      res.status(400).json({ error: 'chainId must be a number' });
      return;
    }
    where.chainId = parsedChainId;
  }

  const chains = await prisma.chain.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  res.status(200).json({ chains });
});
