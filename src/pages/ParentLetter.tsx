import { useState, useEffect } from 'react'
import type { LetterTemplate } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { InfoBox } from '@/components/ui/InfoBox'
import { generateParentLetterPDF } from '@/utils/pdf'
import { useActiveClassInfo } from '@/hooks/useClassData'

const TEMPLATE_OPTIONS: { value: LetterTemplate; label: string }[] = [
  { value: 'first', label: 'Erste Einzahlung' },
  { value: 'additional', label: 'Zusatzbeitrag' },
  { value: 'trip', label: 'Ausflugsgeld' },
  { value: 'yearEnd', label: 'Jahresabschluss' },
]

export function ParentLetter() {
  const classInfo = useActiveClassInfo()

  const [template, setTemplate] = useState<LetterTemplate>('first')
  const [amount, setAmount] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (classInfo?.defaultAmount && !amount) {
      setAmount(String(classInfo.defaultAmount))
    }
  }, [classInfo, amount])

  if (!classInfo) {
    return <div className="flex h-40 items-center justify-center text-stone-400">Laden...</div>
  }

  async function handleGenerate() {
    if (!classInfo) return
    const parsedAmount = parseFloat(amount.replace(',', '.')) || 0

    setGenerating(true)
    try {
      const doc = await generateParentLetterPDF(classInfo, template, parsedAmount)
      doc.save(`Elternbrief_${classInfo.className}_${template}.pdf`)
    } catch (err) {
      console.error('PDF-Fehler:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Elternbrief</h1>

      <InfoBox variant="privacy">
        Der generierte Elternbrief enthält keine personenbezogenen Daten und ist für
        die Verteilung an alle Eltern geeignet. Er enthält einen EPC-QR-Code zum
        bequemen Scannen mit der Banking-App.
      </InfoBox>

      <Card>
        <div className="flex flex-col gap-4">
          <Select
            label="Vorlage"
            value={template}
            onChange={(e) => setTemplate(e.target.value as LetterTemplate)}
            options={TEMPLATE_OPTIONS}
          />

          <Input
            label="Betrag (€)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? 'Wird erstellt...' : 'PDF erstellen'}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">Vorlagen-Info</h2>
        <ul className="text-xs text-stone-500 space-y-1.5">
          <li><strong>Erste Einzahlung:</strong> Standardbrief zu Schuljahresbeginn</li>
          <li><strong>Zusatzbeitrag:</strong> Wenn das Budget nicht reicht</li>
          <li><strong>Ausflugsgeld:</strong> Separate Einsammlung für Ausflüge</li>
          <li><strong>Jahresabschluss:</strong> Übersicht am Schuljahresende</li>
        </ul>
      </Card>
    </div>
  )
}
