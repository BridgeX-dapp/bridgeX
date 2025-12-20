import {
  Args,
  ContractHash,
  Deploy,
  DeployHeader,
  Duration,
  ExecutableDeployItem,
  StoredContractByHash,
} from 'casper-js-sdk';
import { loadCasperConfig } from './config';
import { createCasperSigner } from './signer';

/**
 * Submits a stored-contract call deploy and returns deployHash.
 * This is the core execution primitive for the Casper relayer.
 */
export async function submitStoredContractCall(params: {
  entryPoint: string;
  args: Args;
}) {
  const config = loadCasperConfig();
  const signer = await createCasperSigner();

  // 1️⃣ Stored contract call
  const session = new ExecutableDeployItem();
  session.storedContractByHash = new StoredContractByHash(
    ContractHash.newContract(config.CASPER_BRIDGE_CORE_HASH),
    params.entryPoint,
    params.args,
  );

  // 2️⃣ Deploy header
  const header = DeployHeader.default();
  header.account = signer.publicKey;
  header.chainName = config.CASPER_CHAIN_NAME;
  header.ttl = Duration.fromJSON('30m');

  // 3️⃣ Payment
  const payment = ExecutableDeployItem.standardPayment(
    config.CASPER_GAS_PAYMENT,
  );

  // 4️⃣ Build, sign, submit
  const deploy = Deploy.makeDeploy(header, payment, session);
  deploy.sign(signer.privateKey);

  const { deployHash } = await signer.rpcClient.putDeploy(deploy);

  return { deployHash };
}
