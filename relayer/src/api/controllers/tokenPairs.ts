import expressAsyncHandler from 'express-async-handler';
import prisma from '../lib/utils/clients/prisma-client';

function isHex(value: string) {
  return /^[0-9a-fA-F]+$/.test(value);
}

function normalizeHex(value: string) {
  return value.startsWith('0x') ? value.slice(2).toLowerCase() : value.toLowerCase();
}

function isEvmAddress(value: string) {
  const clean = normalizeHex(value);
  return clean.length === 40 && isHex(clean);
}

function isCasperHash(value: string) {
  const clean = normalizeHex(value);
  return clean.length === 64 && isHex(clean);
}

async function resolveChainId(input?: string | number) {
  if (input === undefined || input === null) return null;
  if (typeof input === 'number') return input;
  if (/^\d+$/.test(String(input))) return Number(input);
  const chain = await prisma.chain.findUnique({
    where: { name: String(input).toLowerCase() },
  });
  return chain?.id ?? null;
}

async function resolveTokenId(chainId: number, token: string) {
  const clean = normalizeHex(token);
  if (isEvmAddress(clean)) {
    const row = await prisma.token.findUnique({
      where: {
        chainId_contractAddress: { chainId, contractAddress: `0x${clean}` },
      },
    });
    if (row) return row.id;
  }
  if (isCasperHash(clean)) {
    const row = await prisma.token.findUnique({
      where: {
        chainId_contractHash: { chainId, contractHash: clean },
      },
    });
    if (row) return row.id;
  }
  return null;
}

export const addTokenPair = expressAsyncHandler(async (req, res) => {
  const {
    sourceChain,
    sourceChainId,
    sourceToken,
    sourceTokenId,
    destChain,
    destChainId,
    destToken,
    destTokenId,
  } = req.body ?? {};

  const resolvedSourceChainId = await resolveChainId(
    sourceChainId ?? sourceChain,
  );
  const resolvedDestChainId = await resolveChainId(destChainId ?? destChain);

  if (!resolvedSourceChainId || !resolvedDestChainId) {
    res.status(400).json({ error: 'sourceChain and destChain are required' });
    return;
  }

  const resolvedSourceTokenId =
    sourceTokenId ??
    (sourceToken
      ? await resolveTokenId(resolvedSourceChainId, sourceToken)
      : null);
  const resolvedDestTokenId =
    destTokenId ??
    (destToken
      ? await resolveTokenId(resolvedDestChainId, destToken)
      : null);

  if (!resolvedSourceTokenId || !resolvedDestTokenId) {
    res.status(400).json({ error: 'sourceToken and destToken are required' });
    return;
  }

  const tokenPair = await prisma.tokenPair.create({
    data: {
      sourceChainId: resolvedSourceChainId,
      destChainId: resolvedDestChainId,
      sourceTokenId: Number(resolvedSourceTokenId),
      destTokenId: Number(resolvedDestTokenId),
    },
  });

  res.status(201).json({ result: 'token pair created', tokenPair });
});

export const listTokenPairs = expressAsyncHandler(async (req, res) => {
  const { sourceChain, destChain, sourceToken, destToken } = req.query ?? {};

  const where: any = {};

  if (sourceChain) {
    const chain = await prisma.chain.findUnique({
      where: { name: String(sourceChain).toLowerCase() },
    });
    if (!chain) {
      res.status(404).json({ error: 'sourceChain not found' });
      return;
    }
    where.sourceChainId = chain.id;
  }

  if (destChain) {
    const chain = await prisma.chain.findUnique({
      where: { name: String(destChain).toLowerCase() },
    });
    if (!chain) {
      res.status(404).json({ error: 'destChain not found' });
      return;
    }
    where.destChainId = chain.id;
  }

  if (sourceToken && where.sourceChainId) {
    const tokenId = await resolveTokenId(where.sourceChainId, String(sourceToken));
    if (!tokenId) {
      res.status(404).json({ error: 'sourceToken not found' });
      return;
    }
    where.sourceTokenId = tokenId;
  }

  if (destToken && where.destChainId) {
    const tokenId = await resolveTokenId(where.destChainId, String(destToken));
    if (!tokenId) {
      res.status(404).json({ error: 'destToken not found' });
      return;
    }
    where.destTokenId = tokenId;
  }

  const tokenPairs = await prisma.tokenPair.findMany({
    where,
    include: {
      sourceChain: true,
      destChain: true,
      sourceToken: true,
      destToken: true,
    },
    orderBy: { id: 'asc' },
  });

  res.status(200).json({ tokenPairs });
});
