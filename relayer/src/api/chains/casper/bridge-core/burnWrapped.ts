import {
  Args,
  CLValue,
  ContractHash,
  StoredContractByHash,
  ExecutableDeployItem,
  Deploy,
  DeployHeader,
  Duration,
} from 'casper-js-sdk';
import { loadCasperConfig } from '../config';
import { createCasperSigner } from '../signer';
import { clAddressFromContractHash } from '../utils';

export async function burnWrappedOnCasper(params: {
  token: string;
  amount: bigint;
  dstChainId: number;
  recipient: string; // 32-byte hex
}) {
  const config = loadCasperConfig();
  const signer = await createCasperSigner();

  const recipientBytes = Uint8Array.from(
    Buffer.from(params.recipient.replace(/^0x/, ''), 'hex'),
  );

  const args = Args.fromMap({
    token: clAddressFromContractHash(params.token),
    amount: CLValue.newCLUInt256(params.amount),
    destination_chain: CLValue.newCLUInt32(params.dstChainId),
    recipient: CLValue.newCLByteArray(recipientBytes),
  });

  const session = new ExecutableDeployItem();
  session.storedContractByHash = new StoredContractByHash(
    ContractHash.newContract(config.CASPER_BRIDGE_CORE_HASH),
    'burn_wrapped',
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

  return signer.rpcClient.putDeploy(deploy);
}
