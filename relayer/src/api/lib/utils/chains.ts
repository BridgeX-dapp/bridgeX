export type Chain = 'EVM' | 'CASPER';

export function isEvm(chain: Chain): boolean {
  return chain === 'EVM';
}

export function isCasper(chain: Chain): boolean {
  return chain === 'CASPER';
}
