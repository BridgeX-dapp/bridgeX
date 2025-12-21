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

