import expressAsyncHandler from 'express-async-handler';
import prisma from '../lib/utils/clients/prisma-client';

export const addToken = expressAsyncHandler(async (req, res) => {
  const {
    chainRefId,
    chainName,
    name,
    symbol,
    decimals,
    logoUrl,
    contractAddress,
    contractHash,
  } = req.body ?? {};

  if (!name || !symbol || decimals === undefined) {
    res.status(400).json({ error: 'name, symbol, and decimals are required' });
    return;
  }

  if (!contractAddress && !contractHash) {
    res.status(400).json({
      error: 'contractAddress or contractHash is required',
    });
    return;
  }

  let chain = null;
  if (chainRefId) {
    chain = await prisma.chain.findUnique({
      where: { id: Number(chainRefId) },
    });
  } else if (chainName) {
    chain = await prisma.chain.findUnique({
      where: { name: String(chainName).toLowerCase() },
    });
  }

  if (!chain) {
    res.status(404).json({ error: 'chain not found' });
    return;
  }

  const parsedDecimals = Number(decimals);
  if (!Number.isFinite(parsedDecimals)) {
    res.status(400).json({ error: 'decimals must be a number' });
    return;
  }

  const token = await prisma.token.create({
    data: {
      chainId: chain.id,
      name,
      symbol,
      decimals: parsedDecimals,
      logoUrl: logoUrl ?? null,
      contractAddress: contractAddress?.toLowerCase() ?? null,
      contractHash: contractHash?.toLowerCase() ?? null,
    },
  });

  res.status(201).json({
    result: 'token created',
    token,
  });
});

export const listTokens = expressAsyncHandler(async (req, res) => {
  const {
    chain,
    chainId,
    contractAddress,
    contractHash,
    symbol,
  } = req.query ?? {};

  const where: any = {};

  if (symbol) {
    where.symbol = String(symbol).toUpperCase();
  }

  if (contractAddress) {
    where.contractAddress = String(contractAddress).toLowerCase();
  }

  if (contractHash) {
    where.contractHash = String(contractHash).toLowerCase();
  }

  if (chainId !== undefined) {
    const parsedChainId = Number(chainId);
    if (!Number.isFinite(parsedChainId)) {
      res.status(400).json({ error: 'chainId must be a number' });
      return;
    }
    where.chainId = parsedChainId;
  }

  if (chain) {
    const chainRow = await prisma.chain.findUnique({
      where: { name: String(chain).toLowerCase() },
    });
    if (!chainRow) {
      res.status(404).json({ error: 'chain not found' });
      return;
    }
    where.chainId = chainRow.id;
  }

  const tokens = await prisma.token.findMany({
    where,
    include: { chain: true },
    orderBy: { symbol: 'asc' },
  });

  res.status(200).json({ tokens });
});
