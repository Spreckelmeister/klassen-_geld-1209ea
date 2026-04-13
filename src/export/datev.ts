// DATEV-kompatibler CSV-Export
// Format: Buchungsstapel nach DATEV-Standard (vereinfacht)

import type { Transaction, ClassInfo } from '@/types';
import { formatCurrency } from '@/utils/format';

function formatDateDATEV(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}${month}`; // TTMM ohne Trennzeichen
}

export function generateDATEVExport(
  transactions: Transaction[],
  _classInfo: ClassInfo,
): string {
  const active = transactions.filter((t) => !t.isStorno);
  const sorted = [...active].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // DATEV-Header
  const header = [
    'Umsatz (ohne Soll/Haben-Kz)',
    'Soll/Haben-Kennzeichen',
    'WKZ Umsatz',
    'Kurs',
    'Basis-Umsatz',
    'WKZ Basis-Umsatz',
    'Konto',
    'Gegenkonto (ohne BU-Schlüssel)',
    'BU-Schlüssel',
    'Belegdatum',
    'Belegfeld 1',
    'Buchungstext',
  ].join(';');

  const lines = sorted.map((t) => {
    const amount = formatCurrency(t.amount).replace(/[€\s]/g, '');
    const shk = t.type === 'income' ? 'S' : 'H';
    const konto = t.type === 'income' ? '1200' : '4900'; // Vereinfachte Konten
    const gegenkonto = t.type === 'income' ? '8400' : '1200';
    const belegNr = t.sequenceNo ? String(t.sequenceNo) : '';
    const buchungstext = (t.description || t.category).slice(0, 60);

    return [
      amount,
      shk,
      'EUR',
      '',
      '',
      '',
      konto,
      gegenkonto,
      '',
      formatDateDATEV(t.date),
      belegNr,
      `"${buchungstext}"`,
    ].join(';');
  });

  return [header, ...lines].join('\r\n');
}

export function downloadDATEV(
  transactions: Transaction[],
  classInfo: ClassInfo,
): void {
  const csv = generateDATEVExport(transactions, classInfo);
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DATEV_${classInfo.className}_${classInfo.schoolYear.replace('/', '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
