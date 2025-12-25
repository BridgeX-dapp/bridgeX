import expressAsyncHandler from 'express-async-handler';
import { CHAIN, TOKEN_TYPE } from '@prisma/client';
import { Contract } from 'ethers';
import { isAddress } from 'ethers/lib/utils';
import { PublicKey } from 'casper-js-sdk';
import prisma from '../lib/utils/clients/prisma-client';
import { resolveChain } from '../lib/utils/chainResolver';
import { loadEvmChainConfigs } from '../chains/evm/config';
import { createEvmSigner } from '../chains/evm/signer';
import { erc20Abi } from 'viem';
import { parseAmountToBaseUnits } from '../lib/utils/amount';
import { transferCep18OnCasper } from '../chains/casper/cep18/transfer';
import { normalizeHashHex } from '../chains/casper/utils';

const MAX_REQUEST_AMOUNT = '1500';

function normalizeEvmAddress(value: string) {
  return value.toLowerCase();
}

function normalizeCasperRecipient(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith('account-hash-')) {
    return normalizeHashHex(trimmed);
  }
  const normalized = normalizeHashHex(trimmed);
  if (normalized.length === 64) {
    return normalized;
  }

  const publicKey = PublicKey.fromHex(trimmed);
  return publicKey.accountHash().toHex();
}

function resolveEvmChainConfigById(chainId: number) {
  const configs = loadEvmChainConfigs();
  if (configs.length === 0) return null;
  return configs.find((cfg) => cfg.chainId === chainId) ?? null;
}

export const faucetRequest = expressAsyncHandler(async (req, res) => {
  const {
    amount,
    chainId,
    chainName,
    tokenId,
    tokenAddress,
    tokenContractHash,
    tokenContractPackageHash,
    recipient,
  } = req.body ?? {};

  if (!amount || typeof amount !== 'string') {
    res.status(400).json({ error: 'amount is required' });
    return;
  }

  if (!recipient || typeof recipient !== 'string') {
    res.status(400).json({ error: 'recipient is required' });
    return;
  }

  const parsedChainId =
    chainId !== undefined && chainId !== null ? Number(chainId) : null;
  let chain = await resolveChain({
    chainId: Number.isFinite(parsedChainId ?? NaN) ? parsedChainId : null,
    name: chainName ? String(chainName) : null,
  });
  if (!chain && Number.isFinite(parsedChainId ?? NaN)) {
    chain = await prisma.chain.findFirst({
      where: { evmChainId: parsedChainId },
    });
  }

  if (!chain) {
    res.status(404).json({ error: 'chain not found' });
    return;
  }

  let token = null;
  if (tokenId) {
    token = await prisma.token.findUnique({ where: { id: Number(tokenId) } });
  } else if (tokenAddress || tokenContractHash || tokenContractPackageHash) {
    token = await prisma.token.findFirst({
      where: {
        chainId: chain.id,
        OR: [
          tokenAddress
            ? { contractAddress: normalizeEvmAddress(String(tokenAddress)) }
            : undefined,
          tokenContractHash
            ? { contractHash: normalizeHashHex(String(tokenContractHash)) }
            : undefined,
          tokenContractPackageHash
            ? {
                contractPackageHash: normalizeHashHex(
                  String(tokenContractPackageHash),
                ),
              }
            : undefined,
        ].filter(Boolean) as any[],
      },
    });
  }

  if (!token || token.chainId !== chain.id) {
    res.status(404).json({ error: 'token not found for chain' });
    return;
  }

  if (token.tokenType !== TOKEN_TYPE.CANONICAL) {
    res.status(400).json({ error: 'token is not canonical' });
    return;
  }

  let amountBase: bigint;
  let limitBase: bigint;
  try {
    amountBase = parseAmountToBaseUnits(amount, token.decimals);
    limitBase = parseAmountToBaseUnits(MAX_REQUEST_AMOUNT, token.decimals);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? 'invalid amount' });
    return;
  }
  if (amountBase > limitBase) {
    res.status(400).json({ error: 'amount exceeds faucet limit' });
    return;
  }

  if (chain.kind === CHAIN.EVM) {
    if (!token.contractAddress) {
      res.status(400).json({ error: 'token contractAddress missing' });
      return;
    }

    if (!chain.evmChainId) {
      res.status(400).json({ error: 'evmChainId missing on chain' });
      return;
    }

    if (!isAddress(recipient)) {
      res.status(400).json({ error: 'invalid EVM recipient address' });
      return;
    }

    const chainConfig = resolveEvmChainConfigById(chain.evmChainId);
    if (!chainConfig) {
      res.status(400).json({ error: 'unsupported EVM chain' });
      return;
    }

    const signer = createEvmSigner(chainConfig);
    const tokenContract = new Contract(token.contractAddress, erc20Abi, signer);
    const tx = await tokenContract.transfer(recipient, amountBase);

    res.status(200).json({
      status: 'success',
      chain: chain.name,
      token: token.symbol,
      txHash: tx.hash,
    });
    return;
  }

  if (chain.kind === CHAIN.CASPER) {
    if (!token.contractHash) {
      res.status(400).json({ error: 'token contractHash missing' });
      return;
    }

    let accountHash: string;
    try {
      accountHash = normalizeCasperRecipient(recipient);
    } catch (err) {
      res.status(400).json({ error: 'invalid Casper recipient' });
      return;
    }

    const { deployHash } = await transferCep18OnCasper({
      tokenContractHash: token.contractHash,
      recipientAccountHash: accountHash,
      amount: amountBase,
    });

    res.status(200).json({
      status: 'success',
      chain: chain.name,
      token: token.symbol,
      txHash: deployHash.toHex(),
    });
    return;
  }

  res.status(400).json({ error: 'unsupported chain kind' });
});
