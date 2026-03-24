import type { Transaction, Student } from '@/types'
import { formatDate } from './format'

export function exportTransactionsCSV(
  transactions: Transaction[],
  students: Student[],
): string {
  const studentMap = new Map(students.map((s) => [s.id, s.name]))

  const header = [
    'Datum',
    'Typ',
    'Betrag',
    'Kategorie',
    'Beschreibung',
    'Schueler',
    'Storno',
    'Erstellt',
  ].join(';')

  const rows = transactions.map((t) => {
    const studentName = t.studentId ? (studentMap.get(t.studentId) ?? '') : ''
    return [
      formatDate(t.date),
      t.type === 'income' ? 'Einnahme' : 'Ausgabe',
      t.amount.toFixed(2).replace('.', ','),
      t.category,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${studentName}"`,
      t.isStorno ? 'Ja' : 'Nein',
      formatDate(t.createdAt),
    ].join(';')
  })

  return '\uFEFF' + [header, ...rows].join('\r\n')
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
