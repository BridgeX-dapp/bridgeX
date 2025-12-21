export function normalizeBytes32(eventId: string): string {
  const clean = eventId.startsWith('0x') ? eventId : `0x${eventId}`;
  if (clean.length !== 66) {
    throw new Error('eventId must be 32 bytes hex');
  }
  return clean.toLowerCase();
}

export function normalizeAmount(amount: string | number | bigint): string {
  if (typeof amount === 'string') return amount;
  return amount.toString();
}
