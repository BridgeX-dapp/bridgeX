import {
  Args,
  CLValue,
  ContractHash,
  Deploy,
  DeployHeader,
  Duration,
  ExecutableDeployItem,
  Hash,
  Key,
  PublicKey,
  StoredContractByHash,
} from 'casper-js-sdk';
import { loadCasperConfig } from '../config';
import { createCasperSigner } from '../signer';
import { clAddressFromContractHash } from '../utils';

export async function approveOnCasper(params: {
  token: string; // CEP-18 contract hash (raw hex or prefixed)
  spender: string; // bridge CONTRACT hash
  amount: bigint;
}) {
  const config = loadCasperConfig();
  const signer = await createCasperSigner();

  // 1️⃣ Build args (CEP-18 approve)
  const args = Args.fromMap({
    spender: clAddressFromContractHash(params.spender),
    amount: CLValue.newCLUInt256(params.amount),
  });

  // 2️⃣ Stored contract call (token contract)
  const session = new ExecutableDeployItem();
  session.storedContractByHash = new StoredContractByHash(
    ContractHash.newContract(params.token),
    'approve',
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

  console.log('✅ CEP-18 approve sent. Deploy hash:', deployHash);

  return {
    deployHash,
  };
}
