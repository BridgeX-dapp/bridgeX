import {
  Args,
  CLValue,
  ContractHash,
  StoredContractByHash,
  ExecutableDeployItem,
  Deploy,
  DeployHeader,
  Duration,
  PublicKey,
  Hash,
  Key,
} from 'casper-js-sdk';
import { createCasperSigner } from './signer';
import { loadCasperConfig } from './config';
import { logger } from '../../lib/utils/logger';
import { clAddressFromContractHash, clAddressFromPublicKey } from './utils';

export async function lockCanonicalOnCasper(params: {
  token: string;
  amount: bigint;
  dstChainId: number;
  recipient: string;
}) {
  const config = loadCasperConfig();

  const signer = await createCasperSigner();
  //token: CLValue.newCLPublicKey(PublicKey.fromHex(params.recipient)),
  // 1️⃣ Build args (names MUST match Odra exactly)
  const args = Args.fromMap({
    token: clAddressFromContractHash(params.token),
    amount: CLValue.newCLUInt256(params.amount),
    destination_chain: CLValue.newCLUInt32(params.dstChainId),
    recipient: clAddressFromPublicKey(params.recipient),
  });

  // 2️⃣ Describe execution
  const session = new ExecutableDeployItem();
  session.storedContractByHash = new StoredContractByHash(
    ContractHash.newContract(config.CASPER_BRIDGE_CORE_HASH),
    'lock_canonical',
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
  const result = await signer.rpcClient.putDeploy(deploy);

  logger.error(
    {
      source: 'Casper deploy',
    },
    result.deployHash.toHex(),
  );

  return result;
}
