export interface BridgeJob {
  eventId: string;

  sourceChain: string;
  destinationChain: string;

  token: string;
  sender: string;
  recipient: string;
  amount: string;

  sourceTxHash: string;
}
