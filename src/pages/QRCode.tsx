import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { InfoBox } from '@/components/ui/InfoBox'
import { generateEPCQRCode } from '@/utils/qrcode'
import { formatCurrency } from '@/utils/format'
import { useActiveClassInfo, useClassStudents } from '@/hooks/useClassData'

export function QRCodePage() {
  const classInfo = useActiveClassInfo()
  const students = useClassStudents()

  const [selectedStudent, setSelectedStudent] = useState('')
  const [amount, setAmount] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (classInfo?.defaultAmount && !amount) {
      setAmount(String(classInfo.defaultAmount))
    }
  }, [classInfo, amount])

  if (!classInfo || !students) {
    return <div className="flex h-40 items-center justify-center text-stone-400">Laden...</div>
  }

  const selectedStudentName = students.find((s) => String(s.id) === selectedStudent)?.name

  async function handleGenerate() {
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (!parsedAmount || !classInfo) return

    setGenerating(true)
    try {
      const reference = selectedStudentName
        ? `Klassenkasse ${classInfo.className} – ${selectedStudentName}`
        : `Klassenkasse ${classInfo.className}`

      const dataUrl = await generateEPCQRCode({
        name: classInfo.treasurerName,
        iban: classInfo.iban,
        amount: parsedAmount,
        reference,
        bic: classInfo.bic,
      })
      setQrDataUrl(dataUrl)
    } catch (err) {
      console.error('QR-Code Fehler:', err)
    } finally {
      setGenerating(false)
    }
  }

  function handlePrint() {
    if (!qrDataUrl) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html lang="de">
      <head><title>QR-Code – Klassenkasse ${classInfo!.className}</title>
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        p { font-size: 12px; color: #666; margin: 4px 0; }
        img { margin: 20px auto; display: block; }
        .info { font-size: 11px; color: #999; margin-top: 20px; }
      </style></head>
      <body>
        <h1>Klassenkasse ${classInfo!.className}</h1>
        <p>${classInfo!.schoolYear}</p>
        <p>Betrag: ${formatCurrency(parseFloat(amount.replace(',', '.')))}</p>
        ${selectedStudentName ? `<p>${selectedStudentName}</p>` : ''}
        <img src="${qrDataUrl}" width="250" height="250" alt="GiroCode QR-Code" />
        <p>Scannen Sie diesen QR-Code mit Ihrer Banking-App</p>
        <p class="info">IBAN: ${classInfo!.iban}</p>
        <script>window.print();</script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">QR-Code Zahlung</h1>

      <InfoBox variant="info">
        Der EPC-QR-Code (GiroCode) kann mit jeder deutschen Banking-App gescannt werden.
        Die Überweisungsdaten werden automatisch ausgefüllt.
      </InfoBox>

      <Card>
        <div className="flex flex-col gap-4">
          <Input
            label="Betrag (€)"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setQrDataUrl(null)
            }}
          />

          <Select
            label="Schüler:in (optional)"
            value={selectedStudent}
            onChange={(e) => {
              setSelectedStudent(e.target.value)
              setQrDataUrl(null)
            }}
            options={[
              { value: '', label: '– Allgemein –' },
              ...students.map((s) => ({
                value: String(s.id),
                label: s.name,
              })),
            ]}
          />

          <Button
            onClick={handleGenerate}
            disabled={generating || !amount || !classInfo.iban}
          >
            {generating ? 'Wird erstellt...' : 'QR-Code erstellen'}
          </Button>
        </div>
      </Card>

      {!classInfo.iban && (
        <InfoBox variant="warning">
          Bitte hinterlegen Sie eine IBAN in den Einstellungen, um QR-Codes zu erstellen.
        </InfoBox>
      )}

      {qrDataUrl && (
        <Card className="text-center">
          <img
            src={qrDataUrl}
            alt="EPC QR-Code für Banküberweisung"
            className="mx-auto mb-4"
            width={250}
            height={250}
          />
          <p className="text-sm font-medium">
            {formatCurrency(parseFloat(amount.replace(',', '.')))}
          </p>
          {selectedStudentName && (
            <p className="text-xs text-stone-500">{selectedStudentName}</p>
          )}
          <p className="mt-1 text-xs text-stone-400 font-mono">{classInfo.iban}</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={handlePrint}>
              Drucken
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const a = document.createElement('a')
                a.href = qrDataUrl!
                a.download = `QR_${classInfo.className}${selectedStudentName ? `_${selectedStudentName}` : ''}.png`
                a.click()
              }}
            >
              Speichern
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
