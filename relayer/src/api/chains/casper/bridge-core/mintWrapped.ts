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
import { clAddressFromAccountHash, clAddressFromContractHash } from '../utils';

export async function mintWrappedOnCasper(params: {
  token: string; // contract hash (hex)
  recipient: string; // 32-byte account-hash hex
  amount: string; // raw units (string!)
  sourceChain: number;
  eventId: string; // 32-byte hex string
}) {
  const config = loadCasperConfig();
  const signer = await createCasperSigner();

  // Validate event_id length early
  if (params.eventId.length !== 64) {
    throw new Error('eventId must be 32 bytes hex (64 chars)');
  }

  const eventIdBytes = Uint8Array.from(Buffer.from(params.eventId, 'hex'));

  // 1️⃣ Build args
  const args = Args.fromMap({
    token: clAddressFromContractHash(params.token),
    recipient: clAddressFromAccountHash(params.recipient),
    amount: CLValue.newCLUInt256(params.amount),
    source_chain: CLValue.newCLUInt32(params.sourceChain),
    event_id: CLValue.newCLByteArray(eventIdBytes),
  });

  // 2️⃣ Stored contract call
  const session = new ExecutableDeployItem();
  session.storedContractByHash = new StoredContractByHash(
    ContractHash.newContract(config.CASPER_BRIDGE_CORE_HASH),
    'mint_wrapped',
    args,
  );

  // 3️⃣ Deploy
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
