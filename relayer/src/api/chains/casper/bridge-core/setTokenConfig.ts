import {
  Args,
  CLValue,
  ContractHash,
  Deploy,
  DeployHeader,
  Duration,
  ExecutableDeployItem,
  StoredContractByHash,
} from 'casper-js-sdk';

import { createCasperSigner } from '../signer';
import { loadCasperConfig } from '../config';
import { clAddressFromContractHash, toTokenUnits } from '../utils';

export async function setTokenConfigOnCasper(params: {
  token: string; // token package hash (hex, no prefix)
  isWhitelisted: boolean;
  isCanonical: boolean;
  minAmount: bigint;
  maxAmount: bigint;
}) {
  const config = loadCasperConfig();
  const signer = await createCasperSigner();

  // 1️⃣ Build args (match Odra exactly)
  const args = Args.fromMap({
    token: clAddressFromContractHash(params.token),
    is_whitelisted: CLValue.newCLValueBool(params.isWhitelisted),
    is_canonical: CLValue.newCLValueBool(params.isCanonical),
    min_amount: CLValue.newCLUInt256(params.minAmount),
    max_amount: CLValue.newCLUInt256(params.maxAmount),
  });

  // 2️⃣ Stored contract call
  const session = new ExecutableDeployItem();
  session.storedContractByHash = new StoredContractByHash(
    ContractHash.newContract(config.CASPER_BRIDGE_CORE_HASH),
    'set_token_config',
    args,
  );

  // 3️⃣ Build deploy
  const header = DeployHeader.default();
  header.account = signer.publicKey;
  header.chainName = config.CASPER_CHAIN_NAME;
  header.ttl = Duration.fromJSON('30m');

  const payment = ExecutableDeployItem.standardPayment(
    config.CASPER_GAS_PAYMENT,
  );

  const deploy = Deploy.makeDeploy(header, payment, session);

  // 4️⃣ Sign & submit
  deploy.sign(signer.privateKey);

  const { deployHash } = await signer.rpcClient.putDeploy(deploy);

  console.log('✅ set_token_config sent. Deploy hash:', deployHash);

  return { deployHash };
}
