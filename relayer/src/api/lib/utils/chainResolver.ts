import { CHAIN, Chain as ChainRow } from '@prisma/client';
import prisma from './clients/prisma-client';
import { logger } from './logger';

type ResolveChainInput = {
  kind?: CHAIN;
  chainId?: number | null;
  name?: string | null;
};

const chainCache = new Map<string, ChainRow | null>();

function cacheKey(input: ResolveChainInput) {
  const kind = input.kind ?? 'ANY';
  const chainId = input.chainId ?? 'NONE';
  const name = input.name ? input.name.toLowerCase() : 'NONE';
  return `kind:${kind}|id:${chainId}|name:${name}`;
}

export async function resolveChain(input: ResolveChainInput) {
  const key = cacheKey(input);
  if (chainCache.has(key)) return chainCache.get(key) ?? null;

  let chain: ChainRow | null = null;

  const chainId =
    typeof input.chainId === 'number' && Number.isFinite(input.chainId)
      ? input.chainId
      : null;
  const name = input.name ? input.name.toLowerCase() : null;

  try {
    if (chainId !== null) {
      if (input.kind) {
        chain = await prisma.chain.findUnique({
          where: {
            kind_chainId: {
              kind: input.kind,
              chainId,
            },
          },
        });
      } else {
        const matches = await prisma.chain.findMany({
          where: { chainId },
          take: 2,
        });
        chain = matches[0] ?? null;
        if (matches.length > 1) {
          logger.warn(
            { chainId, count: matches.length },
            'Multiple chains share the same chainId; using the first match',
          );
        }
      }
    } else if (name) {
      chain = await prisma.chain.findUnique({
        where: { name },
      });
      if (chain && input.kind && chain.kind !== input.kind) {
        logger.warn(
          { name, expected: input.kind, actual: chain.kind },
          'Chain name resolved to a different kind',
        );
      }
    } else if (input.kind) {
      const matches = await prisma.chain.findMany({
        where: { kind: input.kind },
        take: 2,
      });
      chain = matches[0] ?? null;
      if (matches.length > 1) {
        logger.warn(
          { kind: input.kind, count: matches.length },
          'Multiple chains share the same kind; using the first match',
        );
      }
    } else {
      logger.warn('resolveChain called without chainId, name, or kind');
    }
  } catch (err) {
    logger.error({ err, input }, 'Failed to resolve chain');
  }

  chainCache.set(key, chain);
  return chain;
}

export async function resolveChainRefId(input: ResolveChainInput) {
  const chain = await resolveChain(input);
  return chain?.id ?? null;
}
