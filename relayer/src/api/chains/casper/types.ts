/**
 * Raw WebSocket message from CSPR.cloud contract-events stream
 * This mirrors the exact payload from the docs.
 */
export interface CasperContractEventWSMessage {
  action: 'emitted';

  timestamp: string;

  data: {
    contract_package_hash: string;
    contract_hash?: string; // present for CES events
    name: string; // e.g. "LockedCanonical"

    data: Record<string, any>; // event payload
    raw_data?: string;
  };

  extra: {
    deploy_hash: string;
    event_id: number;
  };
}

export interface CasperLockedCanonicalPayload {
  token: string;
  sender: string;
  recipient: string | number[] | Uint8Array;
  amount?: string;
  gross_amount?: string;
  net_amount?: string;
  fee: string;
  destination_chain: number;
  nonce: number;
}
