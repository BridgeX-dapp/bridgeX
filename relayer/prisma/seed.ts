import { PrismaClient, CHAIN } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeAddress(value: string) {
  return value.toLowerCase();
}

function normalizeHash(value: string) {
  const clean = value.startsWith('0x') ? value.slice(2) : value;
  return clean.toLowerCase();
}

type ChainSeed = {
  name: string;
  kind: CHAIN;
  chainId: number;
  displayName: string;
};

type TokenSeed = {
  key: string;
  chainName: string;
  name: string;
  symbol: string;
  decimals: number;
  contractAddress?: string | null;
  contractHash?: string | null;
  contractPackageHash?: string | null;
};

type TokenPairSeed = {
  sourceTokenKey: string;
  destChainName: string;
  destTokenKey: string;
};

async function upsertChain(seed: ChainSeed) {
  return prisma.chain.upsert({
    where: { name: seed.name },
    update: {
      kind: seed.kind,
      chainId: seed.chainId,
      displayName: seed.displayName,
    },
    create: {
      name: seed.name,
      kind: seed.kind,
      chainId: seed.chainId,
      displayName: seed.displayName,
      logoUrl: null,
    },
  });
}

async function upsertToken(seed: TokenSeed, chainId: number) {
  if (seed.contractAddress) {
    const address = normalizeAddress(seed.contractAddress);
    return prisma.token.upsert({
      where: {
        chainId_contractAddress: {
          chainId,
          contractAddress: address,
        },
      },
      update: {
        name: seed.name,
        symbol: seed.symbol,
        decimals: seed.decimals,
      },
      create: {
        chainId,
        name: seed.name,
        symbol: seed.symbol,
        decimals: seed.decimals,
        logoUrl: null,
        contractAddress: address,
        contractHash: null,
      },
    });
  }

  if (seed.contractHash) {
    const hash = normalizeHash(seed.contractHash);
    const packageHash = seed.contractPackageHash
      ? normalizeHash(seed.contractPackageHash)
      : null;
    return prisma.token.upsert({
      where: {
        chainId_contractHash: {
          chainId,
          contractHash: hash,
        },
      },
      update: {
        name: seed.name,
        symbol: seed.symbol,
        decimals: seed.decimals,
        contractPackageHash: packageHash,
      },
      create: {
        chainId,
        name: seed.name,
        symbol: seed.symbol,
        decimals: seed.decimals,
        logoUrl: null,
        contractAddress: null,
        contractHash: hash,
        contractPackageHash: packageHash,
      },
    });
  }

  throw new Error(`Token seed ${seed.key} is missing contractAddress/contractHash`);
}

async function upsertTokenPair(params: {
  sourceChainId: number;
  sourceTokenId: number;
  destChainId: number;
  destTokenId: number;
}) {
  return prisma.tokenPair.upsert({
    where: {
      sourceChainId_sourceTokenId_destChainId: {
        sourceChainId: params.sourceChainId,
        sourceTokenId: params.sourceTokenId,
        destChainId: params.destChainId,
      },
    },
    update: {
      destTokenId: params.destTokenId,
    },
    create: {
      sourceChainId: params.sourceChainId,
      sourceTokenId: params.sourceTokenId,
      destChainId: params.destChainId,
      destTokenId: params.destTokenId,
    },
  });
}

async function main() {
  const chains: ChainSeed[] = [
    {
      name: 'casper',
      kind: CHAIN.CASPER,
      chainId: 1,
      displayName: 'Casper',
    },
    {
      name: 'base-sepolia',
      kind: CHAIN.EVM,
      chainId: 102,
      displayName: 'Base Sepolia',
    },
    {
      name: 'arbitrum-sepolia',
      kind: CHAIN.EVM,
      chainId: 103,
      displayName: 'Arbitrum Sepolia',
    },
    {
      name: 'polygon-amoy',
      kind: CHAIN.EVM,
      chainId: 104,
      displayName: 'Polygon Amoy',
    },
  ];

  const chainRows = new Map<string, { id: number; name: string }>();

  for (const chain of chains) {
    const row = await upsertChain(chain);
    chainRows.set(chain.name, { id: row.id, name: row.name });
  }

  const tokens: TokenSeed[] = [
    // --- Casper canonical ---
    {
      key: 'casper-usdc',
      chainName: 'casper',
      name: 'USD Coin.cspr',
      symbol: 'USDC.cspr',
      decimals: 6,
      contractPackageHash:
        '7b5812d73c9b96ce306507c873d8cb5c422644dbbc7508100af73481894ee769',
      contractHash:
        '9d69442f04906c6190c8259d9e84ff562ce366e03aac85d232ecf177bf7efc58',
    },
    {
      key: 'casper-wcspr',
      chainName: 'casper',
      name: 'Casper Test',
      symbol: 'wCSPR.test',
      decimals: 9,
      contractPackageHash:
        'b2a04010466d5dff85802a46f8f24a38507c673598fd8c5279deb0c829c3cbe7',
      contractHash:
        'f1ef3c8f60fa956e2bf20528a0983f3bac3ec46264822d4daca0f0a7ce496e0c',
    },

    // --- Casper wrapped ---
    {
      key: 'casper-wusdc-base',
      chainName: 'casper',
      name: 'USD Coin.base',
      symbol: 'wUSDC.base',
      decimals: 6,
      contractPackageHash:
        '9716e13aee57220189da15da7e2b4600fc01665112951aa308f6903148f0b09b',
      contractHash:
        '9baa9fa6639bc4d924e79ef3712ca072db012c55a395d949e706901bb955ca2a',
    },
    {
      key: 'casper-wusdc-arb',
      chainName: 'casper',
      name: 'USD Coin.arb',
      symbol: 'wUSDC.arb',
      decimals: 6,
      contractPackageHash:
        '335f2733a356ef7eb752c181bebded3a25a85969cbc5bec21e64819470d1a531',
      contractHash:
        'f8ee53b753730e2e511cb1a3837e74fe9f313449bc0798dc850aadbcb83e753f',
    },
    {
      key: 'casper-wusdc-poly',
      chainName: 'casper',
      name: 'USD Coin.polygon',
      symbol: 'wUSDC.poly',
      decimals: 6,
      contractPackageHash:
        'd8c7d79bd05996c35aacf9a96eecd19f1b7df6a741baf712d8a6501dcd948350',
      contractHash:
        '0f132a7179155462878cdfa8851fccc8f511f2ddcbea7f5842a3ed9ea84c8899',
    },
    {
      key: 'casper-weth-base',
      chainName: 'casper',
      name: 'Ether.base',
      symbol: 'wETH.base',
      decimals: 18,
      contractPackageHash:
        'e6ba8453d61436d7240a8e24a3d53b23c0a86bfd4a212b43392a72159c07aa65',
      contractHash:
        'd8e6605c40b8e82a3443a3726a9085bf94c99f760ca798c55d1e6521e00c7c1f',
    },
    {
      key: 'casper-weth-arb',
      chainName: 'casper',
      name: 'Ether.arb',
      symbol: 'wETH.arb',
      decimals: 18,
      contractPackageHash:
        'ac9099b042d007fa84649b03711d977ce388fec3474eb0c0bf2f9bff2c7fd328',
      contractHash:
        '2b5c8a826d76bcc9d2b96113435d2bff86a31bafeeec9a672abf01d6939b1ed3',
    },

    // --- Base Sepolia canonical ---
    {
      key: 'base-usdc',
      chainName: 'base-sepolia',
      name: 'USDC Coin',
      symbol: 'USDC',
      decimals: 6,
      contractAddress: '0x485734C91949094133080Aa351bC87fb25678830',
    },
    {
      key: 'base-etht',
      chainName: 'base-sepolia',
      name: 'Ether Test',
      symbol: 'ETHt',
      decimals: 18,
      contractAddress: '0x51dcfF16de245e484acFB6E3Aa6844C22d08737A',
    },

    // --- Base Sepolia wrapped ---
    {
      key: 'base-wusdc-cspr',
      chainName: 'base-sepolia',
      name: 'USD Coin.casper',
      symbol: 'wUSDC.cspr',
      decimals: 6,
      contractAddress: '0x39925F7E871c59d01b1C094927D7CeBf5268d291',
    },
    {
      key: 'base-wcspr',
      chainName: 'base-sepolia',
      name: 'Casper',
      symbol: 'wCSPR',
      decimals: 9,
      contractAddress: '0xD2EC79Aefa832a944d239b648e9d4B221b919F79',
    },

    // --- Arbitrum Sepolia canonical ---
    {
      key: 'arb-usdc',
      chainName: 'arbitrum-sepolia',
      name: 'USDC Coin',
      symbol: 'USDC',
      decimals: 6,
      contractAddress: '0x485734C91949094133080Aa351bC87fb25678830',
    },
    {
      key: 'arb-etht',
      chainName: 'arbitrum-sepolia',
      name: 'Ether Test',
      symbol: 'ETHt',
      decimals: 18,
      contractAddress: '0x9Fb8A6fA52d130DeF6d5717a470b280E0e836418',
    },

    // --- Arbitrum Sepolia wrapped ---
    {
      key: 'arb-wusdc-cspr',
      chainName: 'arbitrum-sepolia',
      name: 'USD Coin.casper',
      symbol: 'wUSDC.cspr',
      decimals: 6,
      contractAddress: '0x9aD604B60D8b31D994Bb1934bEaDa1770368f005',
    },
    {
      key: 'arb-wcspr',
      chainName: 'arbitrum-sepolia',
      name: 'Casper',
      symbol: 'wCSPR',
      decimals: 9,
      contractAddress: '0xbCA2CF11A19778B55717d34404D916dEeBe86A65',
    },

    // --- Polygon Amoy canonical ---
    {
      key: 'amoy-usdc',
      chainName: 'polygon-amoy',
      name: 'USDC Coin',
      symbol: 'USDC',
      decimals: 6,
      contractAddress: '0x485734C91949094133080Aa351bC87fb25678830',
    },
    {
      key: 'amoy-etht',
      chainName: 'polygon-amoy',
      name: 'Ether Test',
      symbol: 'ETHt',
      decimals: 18,
      contractAddress: '0x9Fb8A6fA52d130DeF6d5717a470b280E0e836418',
    },

    // --- Polygon Amoy wrapped ---
    {
      key: 'amoy-wusdc-cspr',
      chainName: 'polygon-amoy',
      name: 'USD Coin.casper',
      symbol: 'wUSDC.cspr',
      decimals: 6,
      contractAddress: '0x9aD604B60D8b31D994Bb1934bEaDa1770368f005',
    },
    {
      key: 'amoy-wcspr',
      chainName: 'polygon-amoy',
      name: 'Casper',
      symbol: 'wCSPR',
      decimals: 9,
      contractAddress: '0x485734C91949094133080Aa351bC87fb25678830',
    },
  ];

  const tokenRows = new Map<string, { id: number; chainName: string }>();

  for (const token of tokens) {
    const chain = chainRows.get(token.chainName);
    if (!chain) {
      throw new Error(`Chain not found for token ${token.key}`);
    }
    const row = await upsertToken(token, chain.id);
    tokenRows.set(token.key, { id: row.id, chainName: token.chainName });
  }

  const tokenPairs: TokenPairSeed[] = [
    // EVM canonical -> Casper wrapped
    { sourceTokenKey: 'base-usdc', destChainName: 'casper', destTokenKey: 'casper-wusdc-base' },
    { sourceTokenKey: 'base-etht', destChainName: 'casper', destTokenKey: 'casper-weth-base' },
    { sourceTokenKey: 'arb-usdc', destChainName: 'casper', destTokenKey: 'casper-wusdc-arb' },
    { sourceTokenKey: 'arb-etht', destChainName: 'casper', destTokenKey: 'casper-weth-arb' },
    { sourceTokenKey: 'amoy-usdc', destChainName: 'casper', destTokenKey: 'casper-wusdc-poly' },

    // Casper canonical -> EVM wrapped
    { sourceTokenKey: 'casper-usdc', destChainName: 'base-sepolia', destTokenKey: 'base-wusdc-cspr' },
    { sourceTokenKey: 'casper-usdc', destChainName: 'arbitrum-sepolia', destTokenKey: 'arb-wusdc-cspr' },
    { sourceTokenKey: 'casper-usdc', destChainName: 'polygon-amoy', destTokenKey: 'amoy-wusdc-cspr' },
    { sourceTokenKey: 'casper-wcspr', destChainName: 'base-sepolia', destTokenKey: 'base-wcspr' },
    { sourceTokenKey: 'casper-wcspr', destChainName: 'arbitrum-sepolia', destTokenKey: 'arb-wcspr' },
    { sourceTokenKey: 'casper-wcspr', destChainName: 'polygon-amoy', destTokenKey: 'amoy-wcspr' },

    // Casper wrapped -> EVM canonical
    { sourceTokenKey: 'casper-wusdc-base', destChainName: 'base-sepolia', destTokenKey: 'base-usdc' },
    { sourceTokenKey: 'casper-weth-base', destChainName: 'base-sepolia', destTokenKey: 'base-etht' },
    { sourceTokenKey: 'casper-wusdc-arb', destChainName: 'arbitrum-sepolia', destTokenKey: 'arb-usdc' },
    { sourceTokenKey: 'casper-weth-arb', destChainName: 'arbitrum-sepolia', destTokenKey: 'arb-etht' },
    { sourceTokenKey: 'casper-wusdc-poly', destChainName: 'polygon-amoy', destTokenKey: 'amoy-usdc' },

    // EVM wrapped -> Casper canonical
    { sourceTokenKey: 'base-wusdc-cspr', destChainName: 'casper', destTokenKey: 'casper-usdc' },
    { sourceTokenKey: 'arb-wusdc-cspr', destChainName: 'casper', destTokenKey: 'casper-usdc' },
    { sourceTokenKey: 'amoy-wusdc-cspr', destChainName: 'casper', destTokenKey: 'casper-usdc' },
    { sourceTokenKey: 'base-wcspr', destChainName: 'casper', destTokenKey: 'casper-wcspr' },
    { sourceTokenKey: 'arb-wcspr', destChainName: 'casper', destTokenKey: 'casper-wcspr' },
    { sourceTokenKey: 'amoy-wcspr', destChainName: 'casper', destTokenKey: 'casper-wcspr' },
  ];

  for (const pair of tokenPairs) {
    const sourceToken = tokenRows.get(pair.sourceTokenKey);
    const destToken = tokenRows.get(pair.destTokenKey);
    const destChain = chainRows.get(pair.destChainName);

    if (!sourceToken || !destToken || !destChain) {
      throw new Error(
        `Token pair seed invalid: ${pair.sourceTokenKey} -> ${pair.destTokenKey}`,
      );
    }

    const sourceChain = chainRows.get(sourceToken.chainName);
    if (!sourceChain) {
      throw new Error(`Chain not found for token ${pair.sourceTokenKey}`);
    }

    await upsertTokenPair({
      sourceChainId: sourceChain.id,
      sourceTokenId: sourceToken.id,
      destChainId: destChain.id,
      destTokenId: destToken.id,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
