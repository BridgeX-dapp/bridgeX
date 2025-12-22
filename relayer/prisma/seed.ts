import { PrismaClient, CHAIN } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // --- Chains (edit these to match your real deployments) ---
  const casper = await prisma.chain.upsert({
    where: { name: 'casper' },
    update: {
      kind: CHAIN.CASPER,
      chainId: null,
      displayName: 'Casper',
    },
    create: {
      name: 'casper',
      kind: CHAIN.CASPER,
      chainId: null,
      displayName: 'Casper',
      logoUrl: null,
    },
  });

  const ethereum = await prisma.chain.upsert({
    where: { name: 'ethereum' },
    update: {
      kind: CHAIN.EVM,
      chainId: 1,
      displayName: 'Ethereum',
    },
    create: {
      name: 'ethereum',
      kind: CHAIN.EVM,
      chainId: 1,
      displayName: 'Ethereum',
      logoUrl: null,
    },
  });

  const base = await prisma.chain.upsert({
    where: { name: 'base' },
    update: {
      kind: CHAIN.EVM,
      chainId: 8453,
      displayName: 'Base',
    },
    create: {
      name: 'base',
      kind: CHAIN.EVM,
      chainId: 8453,
      displayName: 'Base',
      logoUrl: null,
    },
  });

  const arbitrum = await prisma.chain.upsert({
    where: { name: 'arb' },
    update: {
      kind: CHAIN.EVM,
      chainId: 42161,
      displayName: 'Arbitrum',
    },
    create: {
      name: 'arb',
      kind: CHAIN.EVM,
      chainId: 42161,
      displayName: 'Arbitrum',
      logoUrl: null,
    },
  });

  // --- Tokens (placeholders: replace with your real addresses/hashes) ---
  const casperUsdc = await prisma.token.upsert({
    where: {
      chainId_contractHash: {
        chainId: casper.id,
        contractHash:
          'b80fe386feaaec091183cd0587c5de3fd402e70d3f3b50e28f6b662b9a486d3e',
      },
    },
    update: {
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
    },
    create: {
      chainId: casper.id,
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
      logoUrl: null,
      contractHash:
        'b80fe386feaaec091183cd0587c5de3fd402e70d3f3b50e28f6b662b9a486d3e',
      contractAddress: null,
    },
  });

  const baseUsdc = await prisma.token.upsert({
    where: {
      chainId_contractAddress: {
        chainId: base.id,
        contractAddress: '0x0000000000000000000000000000000000000000',
      },
    },
    update: {
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
    },
    create: {
      chainId: base.id,
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
      logoUrl: null,
      contractAddress: '0x0000000000000000000000000000000000000000',
      contractHash: null,
    },
  });

  const ethUsdc = await prisma.token.upsert({
    where: {
      chainId_contractAddress: {
        chainId: ethereum.id,
        contractAddress: '0x0000000000000000000000000000000000000000',
      },
    },
    update: {
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
    },
    create: {
      chainId: ethereum.id,
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
      logoUrl: null,
      contractAddress: '0x0000000000000000000000000000000000000000',
      contractHash: null,
    },
  });

  // --- Token pairs (placeholders: update mappings as needed) ---
  await prisma.tokenPair.upsert({
    where: {
      sourceChainId_sourceTokenId_destChainId: {
        sourceChainId: casper.id,
        sourceTokenId: casperUsdc.id,
        destChainId: base.id,
      },
    },
    update: {
      destTokenId: baseUsdc.id,
    },
    create: {
      sourceChainId: casper.id,
      sourceTokenId: casperUsdc.id,
      destChainId: base.id,
      destTokenId: baseUsdc.id,
    },
  });

  await prisma.tokenPair.upsert({
    where: {
      sourceChainId_sourceTokenId_destChainId: {
        sourceChainId: casper.id,
        sourceTokenId: casperUsdc.id,
        destChainId: ethereum.id,
      },
    },
    update: {
      destTokenId: ethUsdc.id,
    },
    create: {
      sourceChainId: casper.id,
      sourceTokenId: casperUsdc.id,
      destChainId: ethereum.id,
      destTokenId: ethUsdc.id,
    },
  });

  await prisma.tokenPair.upsert({
    where: {
      sourceChainId_sourceTokenId_destChainId: {
        sourceChainId: base.id,
        sourceTokenId: baseUsdc.id,
        destChainId: casper.id,
      },
    },
    update: {
      destTokenId: casperUsdc.id,
    },
    create: {
      sourceChainId: base.id,
      sourceTokenId: baseUsdc.id,
      destChainId: casper.id,
      destTokenId: casperUsdc.id,
    },
  });

  await prisma.tokenPair.upsert({
    where: {
      sourceChainId_sourceTokenId_destChainId: {
        sourceChainId: ethereum.id,
        sourceTokenId: ethUsdc.id,
        destChainId: casper.id,
      },
    },
    update: {
      destTokenId: casperUsdc.id,
    },
    create: {
      sourceChainId: ethereum.id,
      sourceTokenId: ethUsdc.id,
      destChainId: casper.id,
      destTokenId: casperUsdc.id,
    },
  });

  await prisma.tokenPair.upsert({
    where: {
      sourceChainId_sourceTokenId_destChainId: {
        sourceChainId: base.id,
        sourceTokenId: baseUsdc.id,
        destChainId: ethereum.id,
      },
    },
    update: {
      destTokenId: ethUsdc.id,
    },
    create: {
      sourceChainId: base.id,
      sourceTokenId: baseUsdc.id,
      destChainId: ethereum.id,
      destTokenId: ethUsdc.id,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
