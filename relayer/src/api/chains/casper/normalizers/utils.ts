export function normalizeCasperTxHash(hash: string): string {
  return hash.startsWith('0x') ? hash : `0x${hash}`;
}

export function normalizeCasperEventId(eventId: unknown): string {
  if (Array.isArray(eventId)) {
    const hex = Buffer.from(Uint8Array.from(eventId)).toString('hex');
    return `0x${hex}`;
  }

  if (typeof eventId === 'string') {
    const clean = eventId.startsWith('0x') ? eventId : `0x${eventId}`;
    if (clean.length !== 66) {
      throw new Error('event_id must be 32 bytes hex');
    }
    return clean.toLowerCase();
  }

  throw new Error('event_id must be hex string or byte array');
}

export function normalizeCasperRecipientBytes32(value: unknown): string {
  if (Array.isArray(value)) {
    const hex = Buffer.from(Uint8Array.from(value)).toString('hex');
    return `0x${hex}`;
  }
  if (value instanceof Uint8Array) {
    return `0x${Buffer.from(value).toString('hex')}`;
  }
  if (typeof value === 'string') {
    const clean = value.startsWith('0x') ? value : `0x${value}`;
    if (clean.length !== 66) {
      throw new Error('recipient must be 32 bytes hex');
    }
    return clean.toLowerCase();
  }
  throw new Error('recipient must be hex string or byte array');
}
