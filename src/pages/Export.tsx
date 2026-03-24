import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { InfoBox } from '@/components/ui/InfoBox'
import { formatCurrency } from '@/utils/format'
import { exportTransactionsCSV, downloadCSV } from '@/utils/csv'
import { useActiveClassInfo, useClassTransactions, useClassStudents } from '@/hooks/useClassData'

export function Export() {
  const transactions = useClassTransactions()
  const students = useClassStudents()
  const classInfo = useActiveClassInfo()

  if (!transactions || !students || !classInfo) {
    return <div className="flex h-40 items-center justify-center text-stone-400">Laden...</div>
  }

  const active = transactions.filter((t) => !t.isStorno)
  const totalIncome = active.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = active.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  function handleCSVExport() {
    const sorted = [...transactions!].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    const csv = exportTransactionsCSV(sorted, students!)
    const filename = `Klassenkasse_${classInfo!.className}_${classInfo!.schoolYear.replace('/', '-')}.csv`
    downloadCSV(csv, filename)
  }

  function handleBackup() {
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      classInfo,
      students,
      transactions,
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Klassenkasse_Backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Export & Sicherung</h1>

      {/* Summary */}
      <Card>
        <h2 className="text-sm font-semibold mb-3">Kassenbericht</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-stone-500">Klasse</dt>
          <dd className="font-medium">{classInfo.className}</dd>
          <dt className="text-stone-500">Schuljahr</dt>
          <dd className="font-medium">{classInfo.schoolYear}</dd>
          <dt className="text-stone-500">Kassenwart</dt>
          <dd className="font-medium">{classInfo.treasurerName}</dd>
          <dt className="text-stone-500">Einnahmen</dt>
          <dd className="currency text-brand-income">{formatCurrency(totalIncome)}</dd>
          <dt className="text-stone-500">Ausgaben</dt>
          <dd className="currency text-brand-expense">{formatCurrency(totalExpense)}</dd>
          <dt className="text-stone-500 font-medium">Kontostand</dt>
          <dd className={`currency font-bold ${balance < 0 ? 'text-brand-expense' : 'text-brand-income'}`}>
            {formatCurrency(balance)}
          </dd>
          <dt className="text-stone-500">Buchungen</dt>
          <dd className="font-medium">{transactions.length}</dd>
          <dt className="text-stone-500">Schüler:innen</dt>
          <dd className="font-medium">{students.length}</dd>
        </dl>
      </Card>

      <InfoBox variant="info">
        Exporte enthalten keine personenbezogenen BuT-Informationen und sind für die
        Kassenprüfung oder den Elternabend geeignet.
      </InfoBox>

      {/* Export Actions */}
      <Card>
        <h2 className="text-sm font-semibold mb-3">CSV-Export (§22 UStG)</h2>
        <p className="text-xs text-stone-500 mb-3">
          Alle Buchungen als CSV-Datei mit Datum, Betrag, Kategorie und Beschreibung.
          Kompatibel mit Excel und für die Kassenprüfung geeignet.
        </p>
        <Button onClick={handleCSVExport} className="w-full">
          CSV herunterladen
        </Button>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3">Datensicherung</h2>
        <p className="text-xs text-stone-500 mb-3">
          Alle Daten als JSON-Datei sichern. Kann später wiederhergestellt werden.
        </p>
        <Button variant="secondary" onClick={handleBackup} className="w-full">
          Backup erstellen
        </Button>
      </Card>
    </div>
  )
}
