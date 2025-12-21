# current issue

1. testing cep18 allowance
2. solving canonical issue

# Set token config body

{
"token": "USDC_CONTRACT_HASH_HERE",
"isWhitelisted": true,
"isCanonical": true,
"minAmount": "100",
"maxAmount": "100000000000"
}

# mint wrapped body

{
"token": "<wrapped token hash>",
"recipient": "<casper public key>",
"amount": "1000000",
"sourceChain": 1,
"eventId": "<32-byte hex>"
}

# Unlock canonical payload body

{
"token": "YOUR_CANONICAL_TOKEN_CONTRACT_HASH_64HEX",
"recipient": "02029551caf9e9be6f6533d545099011261a084fbd7565c813a2aa33f0e217caf436",
"amount": "12000000",
"sourceChain": 1,
"eventId": "b6e0f2d8cbe9eac1a2b6a8b0f1f2e8a0c9d1e3a5b7c9d1e3a5b7c9d1e3a5b7c9"
}

## re-using submitcontractCall example

import { Args, CLValue } from 'casper-js-sdk';
import { submitStoredContractCall } from './submitStoredContractCall';
import {
clAddressFromContractHash,
clAddressFromPublicKey,
} from '../utils/address';

export async function mintWrappedOnCasper(params: {
token: string;
recipient: string;
amount: string;
sourceChain: number;
eventId: string;
}) {
const eventIdBytes = Uint8Array.from(
Buffer.from(params.eventId, 'hex'),
);

const args = Args.fromMap({
token: clAddressFromContractHash(params.token),
recipient: clAddressFromPublicKey(params.recipient),
amount: CLValue.newCLUInt256(params.amount),
source_chain: CLValue.newCLUInt32(params.sourceChain),
event_id: CLValue.newCLByteArray(eventIdBytes),
});

return submitStoredContractCall({
entryPoint: 'mint_wrapped',
args,
});
}

alid dummy Keccak-256 hashes you can safely use for testing 👇
(each is 32 bytes = 64 hex chars)

Option 1 (simple)
4f3edf983ac636a65a842ce7c78d9aa706d3b113b37c0f9c8e3b5c1c4a7e9d21

Option 2
9d2c7a9c3f8b4c7e1a6e0b0a9e4d5c2b7f6a1c8d4e9b2f3a0c7d8e6b5a4f

Option 3 (looks like real bridge event)
c8e4f1d9b2a7e5c6d3f0a1b9e8c7d6a5f4b3c2e1a9d8f7b6c5a4e3d2
