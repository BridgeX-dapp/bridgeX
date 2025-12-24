function assertDigits(value: string, label: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} must be a non-negative integer string`);
  }
}

export function toBaseUnits(
  amount: string | number | bigint,
  decimals: number,
): string {
  if (!Number.isFinite(decimals) || decimals < 0) {
    throw new Error('decimals must be a non-negative number');
  }

  if (typeof amount === 'bigint') {
    return amount.toString();
  }

  const raw = String(amount).trim();
  if (raw.length === 0) {
    throw new Error('amount is required');
  }

  const [wholePart, fracPart = ''] = raw.split('.');
  const whole = wholePart.length === 0 ? '0' : wholePart;

  assertDigits(whole, 'amount');
  assertDigits(fracPart || '0', 'amount');

  if (fracPart.length > decimals) {
    throw new Error('amount has too many decimal places');
  }

  let scale = BigInt(1);
  for (let i = 0; i < decimals; i += 1) {
    scale *= BigInt(10);
  }

  const wholeUnits = BigInt(whole) * scale;
  const fracUnits = fracPart
    ? BigInt(fracPart.padEnd(decimals, '0'))
    : BigInt(0);

  return (wholeUnits + fracUnits).toString();
}

export function normalizeAmountInput(params: {
  amount: string | number | bigint;
  decimals?: number;
}): string {
  const { amount, decimals } = params;
  if (decimals === undefined || decimals === null) {
    return typeof amount === 'bigint' ? amount.toString() : String(amount);
  }
  return toBaseUnits(amount, decimals);
}
