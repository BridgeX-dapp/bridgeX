import { BRIDGE_EVENT } from '@prisma/client';

export interface NormalizedBridgeEvent {
  sourceChain: 'EVM' | 'CASPER';
  eventName: BRIDGE_EVENT;

  txHash: string;
  logIndex: number;
  blockNumber?: number;

  token: string;
  amount: string;

  sender?: string;
  recipient?: string;

  feeAmount?: string;
  netAmount?: string;
  nonce?: string;

  sourceChainId?: string;
  destChainId?: string;
  destAddress?: string;

  eventId?: string;
}
