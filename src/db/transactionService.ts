// Zentrale Funktion für Buchungserstellung — stellt GoBD-Hashkette sicher
import { db } from './database';
import { computeTransactionHash } from '@/crypto/hash';
import type { Transaction } from '@/types';

type NewTransaction = Omit<Transaction, 'id' | 'sequenceNo' | 'hashPrev' | 'hashSelf' | 'createdAt' | 'updatedAt'>;

export async function createTransaction(tx: NewTransaction): Promise<number> {
  // Nächste Sequenznummer und letzten Hash innerhalb der Klasse ermitteln
  const lastTx = await db.transactions
    .where('classId')
    .equals(tx.classId ?? 0)
    .filter((t) => (t.sequenceNo ?? 0) > 0)
    .reverse()
    .sortBy('sequenceNo')
    .then((arr) => arr[0]);

  const sequenceNo = (lastTx?.sequenceNo ?? 0) + 1;
  const prevHash = lastTx?.hashSelf || 'GENESIS';

  const hashSelf = await computeTransactionHash(
    {
      sequenceNo,
      date: tx.date,
      amount: tx.amount,
      description: tx.description,
      type: tx.type,
    },
    prevHash,
  );

  const now = new Date();
  return db.transactions.add({
    ...tx,
    sequenceNo,
    hashPrev: prevHash,
    hashSelf,
    taxNote: tx.taxNote ?? '',
    aiSuggested: tx.aiSuggested ?? false,
    createdAt: now,
    updatedAt: now,
  });
}

// Storno: Erstellt eine Gegenbuchung (nie löschen!)
export async function stornoTransaction(originalId: number): Promise<number> {
  const original = await db.transactions.get(originalId);
  if (!original) throw new Error('Buchung nicht gefunden');
  if (original.isStorno) throw new Error('Bereits storniert');

  // Original als storniert markieren
  await db.transactions.update(originalId, {
    isStorno: true,
    updatedAt: new Date(),
  });

  // Gegenbuchung erstellen
  return createTransaction({
    type: original.type === 'income' ? 'expense' : 'income',
    amount: original.amount,
    date: new Date(),
    category: original.category,
    description: `Storno: ${original.description}`,
    studentId: original.studentId,
    isStorno: true,
    stornoRef: originalId,
    classId: original.classId,
  });
}
