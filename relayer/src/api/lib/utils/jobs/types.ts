export enum BridgeJobType {
  PROCESS_LOCKED_CANONICAL = 'PROCESS_LOCKED_CANONICAL',
}

export interface ProcessLockedCanonicalJob {
  eventId: string;
}
