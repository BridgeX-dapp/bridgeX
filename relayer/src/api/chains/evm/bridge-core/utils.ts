export function normalizeBytes32(value: string): string {
  const clean = value.startsWith('0x') ? value : `0x${value}`;
  if (clean.length !== 66) {
    throw new Error('value must be 32 bytes hex');
  }
  return clean.toLowerCase();
}

export function normalizeRecipientBytes32(value: string): string {
  return normalizeBytes32(value);
}

export function normalizeAmount(amount: string | number | bigint): string {
  if (typeof amount === 'string') return amount;
  return amount.toString();
}
