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
import { clAddressFromAccountHash } from '../utils';

export async function transferCep18OnCasper(params: {
  tokenContractHash: string;
  recipientAccountHash: string;
  amount: bigint;
}) {
  const config = loadCasperConfig();
  const signer = await createCasperSigner();

  const args = Args.fromMap({
    recipient: clAddressFromAccountHash(params.recipientAccountHash),
    amount: CLValue.newCLUInt256(params.amount),
  });

  const session = new ExecutableDeployItem();
  session.storedContractByHash = new StoredContractByHash(
    ContractHash.newContract(params.tokenContractHash),
    'transfer',
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
