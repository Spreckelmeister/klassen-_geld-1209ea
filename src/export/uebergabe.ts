// Übergabeprotokoll-PDF für Kassenwart-Wechsel

import type { ClassInfo, Transaction, Student } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

export async function generateUebergabeprotokollPDF(
  classInfo: ClassInfo,
  transactions: Transaction[],
  students: Student[],
  newTreasurer: string,
  newAuditor: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');

  const active = transactions.filter((t) => !t.isStorno);
  const totalIncome = active.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = active.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  let y = 20;

  // Titel
  doc.setFontSize(18);
  doc.text('Übergabeprotokoll Klassenkasse', 105, y, { align: 'center' });
  y += 12;

  doc.setFontSize(10);
  doc.text(`Erstellt am: ${formatDate(new Date())}`, 105, y, { align: 'center' });
  y += 15;

  // Klassendaten
  doc.setFontSize(12);
  doc.text('Klassendaten', 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Klasse: ${classInfo.className}`, 20, y); y += 6;
  doc.text(`Schuljahr: ${classInfo.schoolYear}`, 20, y); y += 12;

  // Übergabe
  doc.setFontSize(12);
  doc.text('Übergabe', 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Bisherige:r Kassenwart:in: ${classInfo.treasurerName}`, 20, y); y += 6;
  doc.text(`Neue:r Kassenwart:in: ${newTreasurer}`, 20, y); y += 6;
  doc.text(`Bisherige:r Kassenprüfer:in: ${classInfo.auditorName}`, 20, y); y += 6;
  doc.text(`Neue:r Kassenprüfer:in: ${newAuditor}`, 20, y); y += 12;

  // Kassenstand
  doc.setFontSize(12);
  doc.text('Kassenstand', 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Gesamteinnahmen: ${formatCurrency(totalIncome)}`, 20, y); y += 6;
  doc.text(`Gesamtausgaben: ${formatCurrency(totalExpense)}`, 20, y); y += 6;
  doc.setFontSize(12);
  doc.text(`Aktueller Kassenstand: ${formatCurrency(balance)}`, 20, y); y += 6;
  doc.setFontSize(10);
  doc.text(`Anzahl Buchungen: ${active.length}`, 20, y); y += 6;
  doc.text(`Anzahl Schüler:innen: ${students.length}`, 20, y); y += 15;

  // Unterschriften
  doc.setFontSize(12);
  doc.text('Unterschriften', 20, y);
  y += 15;

  doc.setFontSize(10);
  doc.line(20, y, 90, y);
  doc.text('Abgebende:r Kassenwart:in', 20, y + 5);
  doc.text('Datum, Unterschrift', 20, y + 10);

  doc.line(110, y, 190, y);
  doc.text('Übernehmende:r Kassenwart:in', 110, y + 5);
  doc.text('Datum, Unterschrift', 110, y + 10);

  y += 25;
  doc.line(20, y, 90, y);
  doc.text('Kassenprüfer:in', 20, y + 5);
  doc.text('Datum, Unterschrift', 20, y + 10);

  // Hinweis
  y += 25;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Erstellt mit KlassenKasse AI — Alle Daten lokal gespeichert, DSGVO-konform', 105, y, {
    align: 'center',
  });

  doc.save(
    `Uebergabeprotokoll_${classInfo.className}_${classInfo.schoolYear.replace('/', '-')}.pdf`,
  );
}
