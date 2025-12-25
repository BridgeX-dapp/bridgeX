export function parseAmountToBaseUnits(amount: string, decimals: number): bigint {
  const trimmed = amount.trim();
  if (!trimmed) {
    throw new Error('amount is required');
  }
  if (!Number.isFinite(decimals) || decimals < 0) {
    throw new Error('invalid decimals');
  }
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error('amount must be a number');
  }

  const [whole, fraction = ''] = trimmed.split('.');
  if (fraction.length > decimals) {
    throw new Error('amount has too many decimal places');
  }

  const paddedFraction = fraction.padEnd(decimals, '0');
  const combined = `${whole}${paddedFraction}`.replace(/^0+/, '') || '0';
  return BigInt(combined);
}

export function normalizeAmountInput(params: {
  amount: string;
  decimals: number;
}): string {
  return parseAmountToBaseUnits(params.amount, params.decimals).toString();
}
