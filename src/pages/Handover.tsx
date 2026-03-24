import { useState } from 'react'
import { db } from '@/db/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { InfoBox } from '@/components/ui/InfoBox'
import { formatCurrency, formatDate } from '@/utils/format'
import { exportTransactionsCSV, downloadCSV } from '@/utils/csv'
import { generateAnnualReportPDF } from '@/utils/pdf'
import { jsPDF } from 'jspdf'
import { useActiveClassInfo, useClassTransactions, useClassStudents } from '@/hooks/useClassData'

type HandoverStep = 'overview' | 'protocol' | 'newYear'

export function Handover() {
  const classInfo = useActiveClassInfo()
  const transactions = useClassTransactions()
  const students = useClassStudents()

  const [step, setStep] = useState<HandoverStep>('overview')
  const [newTreasurer, setNewTreasurer] = useState('')
  const [restOption, setRestOption] = useState<'carry' | 'refund' | 'donate'>('carry')
  const [removedStudents, setRemovedStudents] = useState<Set<number>>(new Set())
  const [newStudentName, setNewStudentName] = useState('')

  if (!classInfo || !transactions || !students) {
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
    downloadCSV(csv, `Uebergabe_${classInfo!.className}_${classInfo!.schoolYear.replace('/', '-')}.csv`)
  }

  function handlePDFReport() {
    const doc = generateAnnualReportPDF(classInfo!, transactions!, students!)
    doc.save(`Kassenbericht_${classInfo!.className}_${classInfo!.schoolYear.replace('/', '-')}.pdf`)
  }

  function generateHandoverProtocol() {
    const doc = new jsPDF()
    const m = 20
    let y = m

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Übergabeprotokoll Klassenkasse', m, y)
    y += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120)
    doc.text(`Erstellt am ${formatDate(new Date())}`, m, y)
    doc.setTextColor(0)
    y += 15

    // Class info
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Klassendaten', m, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const info = [
      ['Klasse', classInfo!.className],
      ['Schuljahr', classInfo!.schoolYear],
      ['IBAN', classInfo!.iban],
    ]
    for (const [label, value] of info) {
      doc.text(`${label}: ${value}`, m, y)
      y += 6
    }
    y += 8

    // Financial summary
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Kassenstand', m, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Einnahmen gesamt: ${formatCurrency(totalIncome)}`, m, y); y += 6
    doc.text(`Ausgaben gesamt: ${formatCurrency(totalExpense)}`, m, y); y += 6
    doc.setFont('helvetica', 'bold')
    doc.text(`Kontostand: ${formatCurrency(balance)}`, m, y); y += 6
    doc.setFont('helvetica', 'normal')
    doc.text(`Anzahl Buchungen: ${transactions!.length}`, m, y); y += 6
    doc.text(`Anzahl Schüler:innen: ${students!.length}`, m, y)
    y += 15

    // Signatures
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Übergabe', m, y)
    y += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Bisheriger Kassenwart:', m, y); y += 6
    doc.text(classInfo!.treasurerName, m, y); y += 15

    doc.text('Datum, Unterschrift:', m, y)
    doc.line(m, y + 12, m + 80, y + 12)
    y += 25

    doc.text('Neuer Kassenwart:', m, y); y += 6
    doc.text(newTreasurer || '___________________', m, y); y += 15

    doc.text('Datum, Unterschrift:', m, y)
    doc.line(m, y + 12, m + 80, y + 12)
    y += 25

    // Auditor
    doc.text('Kassenprüfer:in:', m, y); y += 6
    doc.text(classInfo!.auditorName || '___________________', m, y); y += 15

    doc.text('Datum, Unterschrift:', m, y)
    doc.line(m, y + 12, m + 80, y + 12)

    // Footer
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(
      'Dieses Protokoll wurde mit der Klassenkasse-App erstellt.',
      105, 285, { align: 'center' },
    )

    doc.save(`Uebergabeprotokoll_${classInfo!.className}.pdf`)
  }

  async function handleNewYear() {
    if (!classInfo?.id) return

    // Remove deselected students
    for (const studentId of removedStudents) {
      await db.students.delete(studentId)
    }

    // Update class info
    const currentYear = classInfo.schoolYear
    const parts = currentYear.split('/')
    const nextYear = parts.length === 2
      ? `${parseInt(parts[1]!)}/${parseInt(parts[1]!) + 1}`
      : `${parseInt(currentYear) + 1}/${parseInt(currentYear) + 2}`

    await db.classInfo.update(classInfo.id, {
      schoolYear: nextYear,
      treasurerName: newTreasurer || classInfo.treasurerName,
    })

    // Add new student if provided
    if (newStudentName.trim()) {
      await db.students.add({
        name: newStudentName.trim(),
        butStatus: false,
        notes: '',
        classId: classInfo.id,
        createdAt: new Date(),
      })
    }

    setStep('overview')
    window.location.reload()
  }

  if (step === 'protocol') {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">Übergabeprotokoll</h1>

        <Card>
          <div className="flex flex-col gap-3">
            <Input
              label="Name des neuen Kassenwarts"
              placeholder="Vor- und Nachname"
              value={newTreasurer}
              onChange={(e) => setNewTreasurer(e.target.value)}
            />
            <div className="rounded-lg bg-stone-50 p-3 text-sm">
              <p className="font-medium">Aktueller Stand:</p>
              <p className="text-stone-500 mt-1">
                Kontostand: <span className="currency">{formatCurrency(balance)}</span>
              </p>
              <p className="text-stone-500">
                Kassenwart: {classInfo.treasurerName}
              </p>
            </div>
            <Button onClick={generateHandoverProtocol}>
              Übergabeprotokoll als PDF
            </Button>
          </div>
        </Card>

        <Button variant="secondary" onClick={() => setStep('overview')}>
          Zurück
        </Button>
      </div>
    )
  }

  if (step === 'newYear') {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">Schuljahreswechsel</h1>

        <InfoBox variant="warning">
          Dieser Assistent hilft beim Übergang ins neue Schuljahr. Der aktuelle
          Kassenstand wird übernommen.
        </InfoBox>

        <Card>
          <h2 className="text-sm font-semibold mb-3">Restgeld</h2>
          <div className="flex flex-col gap-2">
            {(['carry', 'refund', 'donate'] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 cursor-pointer hover:bg-stone-50">
                <input
                  type="radio"
                  name="restOption"
                  checked={restOption === opt}
                  onChange={() => setRestOption(opt)}
                  className="h-4 w-4"
                />
                <div>
                  <p className="text-sm font-medium">
                    {opt === 'carry' && 'Übertragen ins neue Schuljahr'}
                    {opt === 'refund' && 'Rückzahlung an Eltern'}
                    {opt === 'donate' && 'Spende an Förderverein'}
                  </p>
                  <p className="text-xs text-stone-500">
                    {opt === 'carry' && `${formatCurrency(balance)} werden übernommen`}
                    {opt === 'refund' && 'Restbeträge pro Kind zurückzahlen'}
                    {opt === 'donate' && 'Rest an den Förderverein spenden'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-3">Schüler:innen aktualisieren</h2>
          <p className="text-xs text-stone-500 mb-3">
            Entfernen Sie Kinder, die die Klasse verlassen haben.
          </p>
          <div className="space-y-2">
            {students.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!removedStudents.has(s.id!)}
                  onChange={() => {
                    const next = new Set(removedStudents)
                    if (next.has(s.id!)) next.delete(s.id!)
                    else next.add(s.id!)
                    setRemovedStudents(next)
                  }}
                  className="h-4 w-4 rounded"
                />
                <span className={removedStudents.has(s.id!) ? 'line-through text-stone-400' : ''}>
                  {s.name}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3">
            <Input
              label="Neues Kind hinzufügen (optional)"
              placeholder="Vor- und Nachname"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <Input
            label="Neuer Kassenwart (optional)"
            placeholder={classInfo.treasurerName}
            value={newTreasurer}
            onChange={(e) => setNewTreasurer(e.target.value)}
            hint="Leer lassen, wenn Sie weiterhin Kassenwart bleiben"
          />
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setStep('overview')}>
            Abbrechen
          </Button>
          <Button onClick={handleNewYear}>
            Neues Schuljahr starten
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Übergabe & Wechsel</h1>

      <Card className="bg-brand-primary text-white">
        <p className="text-sm text-stone-300">Aktueller Kassenstand</p>
        <p className={`currency text-2xl ${balance < 0 ? 'text-rose-300' : 'text-white'}`}>
          {formatCurrency(balance)}
        </p>
        <p className="text-xs text-stone-400 mt-1">
          {classInfo.className} · {classInfo.schoolYear} · {classInfo.treasurerName}
        </p>
      </Card>

      <h2 className="text-sm font-semibold text-stone-500">Kassenwart-Wechsel</h2>

      <Card>
        <div className="flex flex-col gap-3">
          <p className="text-sm">Erstellen Sie alle Dokumente für eine ordnungsgemäße Übergabe:</p>
          <Button variant="secondary" onClick={handleCSVExport} className="w-full">
            1. CSV-Export herunterladen
          </Button>
          <Button variant="secondary" onClick={handlePDFReport} className="w-full">
            2. PDF-Kassenbericht erstellen
          </Button>
          <Button onClick={() => setStep('protocol')} className="w-full">
            3. Übergabeprotokoll erstellen
          </Button>
        </div>
      </Card>

      <h2 className="text-sm font-semibold text-stone-500">Schuljahreswechsel</h2>

      <Card>
        <p className="text-sm mb-3">
          Starten Sie ein neues Schuljahr: Restgeld verwalten, Schüler:innen-Liste
          aktualisieren und optional einen neuen Kassenwart benennen.
        </p>
        <Button variant="secondary" onClick={() => setStep('newYear')} className="w-full">
          Schuljahreswechsel starten
        </Button>
      </Card>
    </div>
  )
}
