import expressAsyncHandler from 'express-async-handler';
import {
  HttpHandler,
  ParamDictionaryIdentifier,
  ParamDictionaryIdentifierContractNamedKey,
  RpcClient,
} from 'casper-js-sdk';
import { loadCasperConfig } from '../chains/casper/config';
import {
  makeAllowanceDictionaryKey,
  normalizeHashHex,
} from '../chains/casper/utils';

const DICT_ALLOWANCES = 'allowances';

export const getCasperTokenAllowance = expressAsyncHandler(async (req, res) => {
  const ownerAccountHash = String(req.query.ownerAccountHash ?? '').trim();
  const tokenContractHash = String(req.query.tokenContractHash ?? '').trim();
  const spenderContractHash = String(
    req.query.spenderContractHash ?? '',
  ).trim();

  if (!ownerAccountHash || !tokenContractHash) {
    res.status(400).json({
      error: 'ownerAccountHash and tokenContractHash are required',
    });
    return;
  }

  const cfg = loadCasperConfig();
  const rpcClient = new RpcClient(new HttpHandler(cfg.CASPER_RPC_URL));

  const spender =
    spenderContractHash || cfg.CASPER_BRIDGE_CORE_CONTRACT_PACKAGE_HASH;

  const stateRootHash = (
    await rpcClient.getStateRootHashLatest()
  ).stateRootHash.toHex();

  async function queryAllowance(spenderHash: string) {
    const dictionaryItemKey = makeAllowanceDictionaryKey({
      ownerAccountHash,
      spenderContractHash: spenderHash,
    });

    const identifier = new ParamDictionaryIdentifier(
      undefined,
      new ParamDictionaryIdentifierContractNamedKey(
        `hash-${normalizeHashHex(tokenContractHash)}`,
        DICT_ALLOWANCES,
        dictionaryItemKey,
      ),
    );

    const result = await rpcClient.getDictionaryItemByIdentifier(
      stateRootHash,
      identifier,
    );

    return result.storedValue?.clValue?.toJSON?.() ?? '0';
  }

  try {
    const allowance = await queryAllowance(spender);
    res.status(200).json({
      ownerAccountHash: normalizeHashHex(ownerAccountHash),
      tokenContractHash: normalizeHashHex(tokenContractHash),
      spenderContractHash: normalizeHashHex(spender),
      allowance,
    });
    return;
  } catch (error) {
    const fallback = cfg.CASPER_BRIDGE_CORE_HASH;
    if (fallback && !spenderContractHash) {
      try {
        const allowance = await queryAllowance(fallback);
        res.status(200).json({
          ownerAccountHash: normalizeHashHex(ownerAccountHash),
          tokenContractHash: normalizeHashHex(tokenContractHash),
          spenderContractHash: normalizeHashHex(fallback),
          allowance,
        });
        return;
      } catch (fallbackError) {
        const message =
          fallbackError instanceof Error
            ? fallbackError.message
            : 'Failed to query allowance';
        res.status(200).json({
          ownerAccountHash: normalizeHashHex(ownerAccountHash),
          tokenContractHash: normalizeHashHex(tokenContractHash),
          spenderContractHash: normalizeHashHex(spender),
          allowance: '0',
          error: message,
        });
        return;
      }
    }

    const message =
      error instanceof Error ? error.message : 'Failed to query allowance';
    res.status(200).json({
      ownerAccountHash: normalizeHashHex(ownerAccountHash),
      tokenContractHash: normalizeHashHex(tokenContractHash),
      spenderContractHash: normalizeHashHex(spender),
      allowance: '0',
      error: message,
    });
  }
});
