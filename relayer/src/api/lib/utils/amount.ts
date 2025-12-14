import { BigNumber } from 'ethers';

export function normalizeAmount(amount: string | number | bigint): string {
  return BigNumber.from(amount.toString()).toString();
}
