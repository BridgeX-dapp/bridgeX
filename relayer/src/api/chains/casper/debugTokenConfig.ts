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
import { clAddressFromContractHash } from './utils';

/**
 * DEBUG helper: calls get_token_config via deploy
 */
export async function debugGetTokenConfigOnCasper(token: string) {
  const config = loadCasperConfig();
  const signer = await createCasperSigner();

  const args = Args.fromMap({
    token: clAddressFromContractHash(token),
  });

  const session = new ExecutableDeployItem();
  session.storedContractByHash = new StoredContractByHash(
    ContractHash.newContract(config.CASPER_BRIDGE_CORE_HASH),
    'get_token_config',
    args,
  );

  const header = DeployHeader.default();
  header.account = signer.publicKey;
  header.chainName = config.CASPER_CHAIN_NAME;
  header.ttl = Duration.fromJSON('30m');

  const payment = ExecutableDeployItem.standardPayment(
    config.CASPER_GAS_PAYMENT,
  );

  const deploy = Deploy.makeDeploy(header, payment, session);
  deploy.sign(signer.privateKey);

  const { deployHash } = await signer.rpcClient.putDeploy(deploy);

  return { deployHash };
}
