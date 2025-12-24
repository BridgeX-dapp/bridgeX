import { CHAIN, Transaction } from '@prisma/client';
import prisma from './clients/prisma-client';
import { resolveChainRefId } from './chainResolver';

function normalizeHex(value: string) {
  return value.startsWith('0x') ? value.toLowerCase() : `0x${value.toLowerCase()}`;
}

function isEvmAddress(value: string) {
  const clean = value.startsWith('0x') ? value.slice(2) : value;
  return clean.length === 40;
}

function isCasperHash(value: string) {
  const clean = value
    .replace(/^hash-/, '')
    .replace(/^0x/, '');
  return clean.length === 64;
}

async function resolveChainIds(tx: Transaction) {
  const sourceChainRefId =
    tx.sourceChainRefId ??
    (tx.sourceChain === CHAIN.EVM
      ? null
      : await resolveChainRefId({ kind: CHAIN.CASPER }));

  const destChainIdNum =
    tx.destChainId && Number.isFinite(Number(tx.destChainId))
      ? Number(tx.destChainId)
      : null;
  const destChainRefId =
    tx.destChainRefId ??
    (destChainIdNum ? await resolveChainRefId({ chainId: destChainIdNum }) : null);

  return { sourceChainRefId, destChainRefId };
}

async function resolveSourceTokenId(sourceChainRefId: number, token: string) {
  if (isEvmAddress(token)) {
    const row = await prisma.token.findUnique({
      where: {
        chainId_contractAddress: {
          chainId: sourceChainRefId,
          contractAddress: normalizeHex(token),
        },
      },
    });
    return row?.id ?? null;
  }
  if (isCasperHash(token)) {
    const clean = token
      .replace(/^hash-/, '')
      .replace(/^0x/, '');
    const normalized = clean.toLowerCase();
    const byHash = await prisma.token.findUnique({
      where: {
        chainId_contractHash: {
          chainId: sourceChainRefId,
          contractHash: normalized,
        },
      },
    });
    if (byHash) return byHash.id;

    const byPackage = await prisma.token.findUnique({
      where: {
        chainId_contractPackageHash: {
          chainId: sourceChainRefId,
          contractPackageHash: normalized,
        },
      },
    });
    return byPackage?.id ?? null;
  }
  return null;
}

export async function resolveDestinationToken(tx: Transaction) {
  if (!tx.token) {
    throw new Error('transaction token missing');
  }

  const { sourceChainRefId, destChainRefId } = await resolveChainIds(tx);
  if (!sourceChainRefId || !destChainRefId) {
    throw new Error('chain refs missing for token mapping');
  }

  const sourceTokenId = await resolveSourceTokenId(sourceChainRefId, tx.token);
  if (!sourceTokenId) {
    throw new Error('source token not found in registry');
  }

  const pair = await prisma.tokenPair.findUnique({
    where: {
      sourceChainId_sourceTokenId_destChainId: {
        sourceChainId: sourceChainRefId,
        sourceTokenId,
        destChainId: destChainRefId,
      },
    },
  });

  if (!pair) {
    throw new Error('token pair not found for source/dest chain');
  }

  const destToken = await prisma.token.findUnique({
    where: { id: pair.destTokenId },
  });
  if (!destToken) {
    throw new Error('destination token not found in registry');
  }

  const destChain = await prisma.chain.findUnique({
    where: { id: destChainRefId },
  });
  if (!destChain) {
    throw new Error('destination chain not found in registry');
  }

  return { destToken, destChain };
}
