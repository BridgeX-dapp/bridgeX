import expressAsyncHandler from 'express-async-handler';
import { HttpHandler, RpcClient } from 'casper-js-sdk';
import { loadCasperConfig } from '../chains/casper/config';
import { createCasperRestClient } from '../chains/casper/provider';
import { normalizeHashHex } from '../chains/casper/utils';

function toContractPackageHex(raw: string): string {
  return normalizeHashHex(raw);
}

async function resolveContractPackageHash(
  contractHashHex: string,
): Promise<string> {
  const cfg = loadCasperConfig();
  const rpcClient = new RpcClient(new HttpHandler(cfg.CASPER_RPC_URL));
  const key = `hash-${normalizeHashHex(contractHashHex)}`;
  const result = await rpcClient.queryLatestGlobalState(key, []);
  const contract = result.storedValue?.contract;
  if (!contract?.contractPackageHash) {
    throw new Error('Contract package hash not found for contract');
  }
  return toContractPackageHex(contract.contractPackageHash.toJSON());
}

export const getCasperTokenBalance = expressAsyncHandler(async (req, res) => {
  const accountHash = String(req.query.accountHash ?? '').trim();
  const contractHash = String(req.query.contractHash ?? '').trim();
  const contractPackageHash = String(
    req.query.contractPackageHash ?? '',
  ).trim();

  if (!accountHash) {
    res.status(400).json({ error: 'accountHash is required' });
    return;
  }

  if (!contractHash && !contractPackageHash) {
    res
      .status(400)
      .json({ error: 'contractHash or contractPackageHash is required' });
    return;
  }

  const packageHash = contractPackageHash
    ? toContractPackageHex(contractPackageHash)
    : await resolveContractPackageHash(contractHash);

  const client = createCasperRestClient();
  const response = await client.get(
    `/accounts/${normalizeHashHex(accountHash)}/ft-token-ownership`,
  );

  const entries = Array.isArray(response.data?.data) ? response.data.data : [];

  console.log('entries is', entries);
  console.log(
    'normalized contract package hash',
    normalizeHashHex(packageHash),
  );
  console.log('my package hash input', packageHash);
  const match = entries.find(
    (entry) => normalizeHashHex(entry.contract_package_hash) === packageHash,
  );

  console.log('match is', match);

  res.status(200).json({
    accountHash: normalizeHashHex(accountHash),
    contractPackageHash: packageHash,
    balance: match?.balance ?? '0',
  });
});
