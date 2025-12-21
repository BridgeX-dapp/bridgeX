export enum BridgeJobType {
  PROCESS_LOCKED_CANONICAL = 'PROCESS_LOCKED_CANONICAL',
  PROCESS_CASPER_LOCKED_CANONICAL = 'PROCESS_CASPER_LOCKED_CANONICAL',
  PROCESS_CASPER_BURNED_WRAPPED = 'PROCESS_CASPER_BURNED_WRAPPED',
  PROCESS_EVM_BURNED_WRAPPED = 'PROCESS_EVM_BURNED_WRAPPED',
}

export interface ProcessLockedCanonicalJob {
  eventId: string;
}

export interface ProcessCasperLockedCanonicalJob {
  eventId: string;
}

export interface ProcessCasperBurnedWrappedJob {
  eventId: string;
}

export interface ProcessEvmBurnedWrappedJob {
  eventId: string;
}
