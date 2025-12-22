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

/** 32-byte hex -> Uint8Array(32) */
function hexToBytes32(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]+$/.test(clean)) {
    throw new Error('eventId must be hex');
  }
  if (clean.length !== 64) {
    throw new Error('eventId must be 32 bytes (64 hex chars)');
  }
  return Uint8Array.from(Buffer.from(clean, 'hex'));
}

export async function unlockCanonicalOnCasper(params: {
  token: string; // canonical token contract hash (64 hex, no prefix)
  recipient: string; // 32-byte account-hash hex
  amount: string; // U256 decimal string (raw units)
  sourceChain: number; // u32
  eventId: string; // 32-byte hex
}) {
  const config = loadCasperConfig();
  const signer = await createCasperSigner();

  // Light validation (saves gas)
  if (!params.token || params.token.length !== 64) {
    throw new Error('token must be 64-hex contract hash (no prefix)');
  }
  if (!params.recipient || params.recipient.replace(/^0x/, '').length !== 64) {
    throw new Error('recipient must be 32 bytes hex (account-hash)');
  }
  if (!/^\d+$/.test(params.amount)) {
    throw new Error('amount must be a decimal string (raw units)');
  }

  const eventIdBytes = hexToBytes32(params.eventId);

  // 1️⃣ Build args (Odra Address => CLKey)
  const args = Args.fromMap({
    token: clAddressFromContractHash(params.token), // Address (contract)
    recipient: clAddressFromAccountHash(params.recipient), // Address (account)
    amount: CLValue.newCLUInt256(params.amount), // U256
    source_chain: CLValue.newCLUInt32(params.sourceChain), // u32
    event_id: CLValue.newCLByteArray(eventIdBytes), // [u8;32]
  });

  // 2️⃣ Stored contract call
  const session = new ExecutableDeployItem();
  session.storedContractByHash = new StoredContractByHash(
    ContractHash.newContract(config.CASPER_BRIDGE_CORE_HASH),
    'unlock_canonical',
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

  // 4️⃣ Sign & submit
  deploy.sign(signer.privateKey);
  const { deployHash } = await signer.rpcClient.putDeploy(deploy);

  return { deployHash };
}
