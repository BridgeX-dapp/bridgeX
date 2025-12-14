export const CHAINS = {
  EVM: 'EVM',
  CASPER: 'CASPER',
} as const;

export type Chain = keyof typeof CHAINS;

export const QUEUES = {
  EVM_TO_CASPER: 'evm_to_casper',
  CASPER_TO_EVM: 'casper_to_evm',
};
