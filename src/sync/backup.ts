// Verschlüsseltes Backup: Export + Import + Merge

import { db } from '@/db/database';
import { encryptBackup, decryptBackup } from '@/crypto/encrypt';

export interface BackupData {
  version: 2;
  exportedAt: string;
  classInfo: unknown[];
  students: unknown[];
  transactions: unknown[];
  dueDates: unknown[];
  budgetItems: unknown[];
  fundraisingActions: unknown[];
  socialFund: unknown[];
  auditRecords: unknown[];
  bankTransactions: unknown[];
}

export async function createBackup(): Promise<BackupData> {
  const [classInfo, students, transactions, dueDates, budgetItems, fundraisingActions, socialFund, auditRecords, bankTransactions] =
    await Promise.all([
      db.classInfo.toArray(),
      db.students.toArray(),
      db.transactions.toArray(),
      db.dueDates.toArray(),
      db.budgetItems.toArray(),
      db.fundraisingActions.toArray(),
      db.socialFund.toArray(),
      db.auditRecords.toArray(),
      db.bankTransactions.toArray(),
    ]);

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    classInfo,
    students,
    transactions,
    dueDates,
    budgetItems,
    fundraisingActions,
    socialFund,
    auditRecords,
    bankTransactions,
  };
}

export async function exportEncryptedBackup(password: string): Promise<void> {
  const backup = await createBackup();
  const json = JSON.stringify(backup);
  const encrypted = await encryptBackup(json, password);

  const blob = new Blob([encrypted], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `klassenkasse-backup-${new Date().toISOString().split('T')[0]}.enc`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importEncryptedBackup(file: File, password: string): Promise<number> {
  const buffer = await file.arrayBuffer();
  const json = await decryptBackup(buffer, password);
  const backup: BackupData = JSON.parse(json);

  if (!backup.version || !backup.classInfo) {
    throw new Error('Ungültiges Backup-Format');
  }

  // Merge: Bestehende Daten behalten, neue hinzufügen
  let imported = 0;

  for (const item of backup.classInfo as { id?: number; className: string }[]) {
    const existing = await db.classInfo.where('id').equals(item.id ?? 0).first();
    if (!existing) {
      await db.classInfo.add(item as never);
      imported++;
    }
  }

  for (const item of backup.students as { id?: number }[]) {
    const existing = await db.students.where('id').equals(item.id ?? 0).first();
    if (!existing) {
      await db.students.add(item as never);
      imported++;
    }
  }

  for (const item of backup.transactions as { id?: number }[]) {
    const existing = await db.transactions.where('id').equals(item.id ?? 0).first();
    if (!existing) {
      await db.transactions.add(item as never);
      imported++;
    }
  }

  return imported;
}
