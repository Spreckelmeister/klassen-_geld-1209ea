// GoBD-konforme SHA-256 Hashkette für Buchungen

export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeTransactionHash(
  tx: {
    sequenceNo: number;
    date: Date;
    amount: number;
    description: string;
    type: string;
  },
  prevHash: string,
): Promise<string> {
  const dateStr = tx.date instanceof Date ? tx.date.toISOString().split('T')[0] : String(tx.date);
  const data = `${prevHash}|${tx.sequenceNo}|${dateStr}|${tx.amount}|${tx.type}|${tx.description}`;
  return sha256(data);
}

// Prüfe ob die gesamte Hashkette konsistent ist
export async function verifyHashChain(
  transactions: Array<{
    sequenceNo?: number;
    date: Date;
    amount: number;
    description: string;
    type: string;
    hashPrev?: string;
    hashSelf?: string;
  }>,
): Promise<{ valid: boolean; brokenAt?: number }> {
  const sorted = [...transactions]
    .filter((t) => t.sequenceNo !== undefined && t.sequenceNo > 0)
    .sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0));

  for (const tx of sorted) {
    if (!tx.hashSelf || !tx.hashPrev) continue;

    const expected = await computeTransactionHash(
      {
        sequenceNo: tx.sequenceNo ?? 0,
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
        type: tx.type,
      },
      tx.hashPrev,
    );

    if (expected !== tx.hashSelf) {
      return { valid: false, brokenAt: tx.sequenceNo };
    }
  }

  return { valid: true };
}
