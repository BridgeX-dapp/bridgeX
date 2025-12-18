import {
  PrivateKey,
  PublicKey,
  KeyAlgorithm,
  HttpHandler,
  RpcClient,
} from 'casper-js-sdk';
import { loadCasperConfig } from './config';

export interface CasperRelayerSigner {
  privateKey: PrivateKey;
  publicKey: PublicKey;
  rpcClient: RpcClient;
}

export async function createCasperSigner(): Promise<CasperRelayerSigner> {
  const config = loadCasperConfig();

  // 1️⃣ Load private key (PEM, secp256k1)
  const privateKey = await PrivateKey.fromPem(
    config.CASPER_RELAYER_PRIVATE_KEY,
    KeyAlgorithm.SECP256K1,
  );

  const publicKey = privateKey.publicKey;

  // 2️⃣ Create RPC client
  const httpHandler = new HttpHandler(config.CASPER_RPC_URL);
  const rpcClient = new RpcClient(httpHandler);

  return {
    privateKey,
    publicKey,
    rpcClient,
  };
}
