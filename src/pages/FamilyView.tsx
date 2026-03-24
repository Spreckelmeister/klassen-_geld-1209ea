import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { InfoBox } from '@/components/ui/InfoBox'
import { formatCurrency, formatDate } from '@/utils/format'
import { generateEPCQRCode } from '@/utils/qrcode'

export function FamilyView() {
  const { token } = useParams<{ token: string }>()
  const [epcQR, setEpcQR] = useState<string | null>(null)

  const student = useLiveQuery(
    () => (token ? db.students.where('selfServiceToken').equals(token).first() : undefined),
    [token],
  )

  const classInfo = useLiveQuery(() => db.classInfo.toCollection().first())

  const transactions = useLiveQuery(
    () =>
      student?.id
        ? db.transactions
            .where('studentId')
            .equals(student.id)
            .toArray()
        : [],
    [student?.id],
  )

  const activeTransactions = transactions?.filter((t) => !t.isStorno) ?? []
  const payments = activeTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const defaultAmount = classInfo?.defaultAmount ?? 0
  const outstanding = Math.max(0, defaultAmount - payments)

  useEffect(() => {
    if (!classInfo || !student || outstanding <= 0) {
      setEpcQR(null)
      return
    }
    generateEPCQRCode({
      name: classInfo.treasurerName,
      iban: classInfo.iban,
      bic: classInfo.bic,
      amount: outstanding,
      reference: `Klassenkasse ${classInfo.className} - ${student.name}`,
    }).then(setEpcQR)
  }, [classInfo, student, outstanding])

  // Loading state
  if (student === undefined && token) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-stone-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-brand-primary" />
          <span className="text-sm">Laden...</span>
        </div>
      </div>
    )
  }

  // Token not found
  if (!student || !token) {
    return (
      <div className="min-h-screen bg-brand-bg font-sans">
        <div className="mx-auto max-w-lg px-4 py-8">
          <Card>
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="text-4xl">&#128683;</div>
              <h1 className="text-lg font-bold text-stone-800">Link nicht gefunden</h1>
              <p className="text-sm text-stone-500 leading-relaxed">
                Dieser Eltern-Link ist leider ungueltig oder wurde deaktiviert.
                Bitte wenden Sie sich an den Kassenwart Ihrer Klasse.
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg font-sans">
      <div className="mx-auto max-w-lg px-4 py-6 flex flex-col gap-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-stone-800">Klassenkasse</h1>
          {classInfo && (
            <p className="text-sm text-stone-500 mt-1">{classInfo.className}</p>
          )}
        </div>

        {/* Student Info & Status */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-stone-800">{student.name}</h2>
              <p className="text-xs text-stone-400 mt-0.5">Zahlungsstatus</p>
            </div>
            <div>
              {outstanding > 0 ? (
                <Badge variant="warning">{formatCurrency(outstanding)} offen</Badge>
              ) : (
                <Badge variant="income">Alles bezahlt</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-xs text-stone-500">Bezahlt</p>
              <p className="text-lg font-bold text-brand-income">{formatCurrency(payments)}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <p className="text-xs text-stone-500">Offen</p>
              <p className="text-lg font-bold text-brand-warning">{formatCurrency(outstanding)}</p>
            </div>
          </div>
        </Card>

        {/* EPC QR Code for payment */}
        {outstanding > 0 && epcQR && classInfo && (
          <Card>
            <h3 className="text-sm font-semibold text-stone-800 mb-3 text-center">
              Jetzt bezahlen
            </h3>
            <p className="text-xs text-stone-500 text-center mb-4">
              Scannen Sie den QR-Code mit Ihrer Banking-App, um die offene Summe zu ueberweisen.
            </p>
            <div className="flex justify-center">
              <img src={epcQR} alt="EPC QR-Code fuer Ueberweisung" className="w-48 h-48" />
            </div>
            <div className="mt-4 rounded-xl bg-stone-50 p-3 text-xs text-stone-500 space-y-1">
              <p><span className="font-medium text-stone-600">Empfaenger:</span> {classInfo.treasurerName}</p>
              <p><span className="font-medium text-stone-600">IBAN:</span> {classInfo.iban}</p>
              <p><span className="font-medium text-stone-600">Betrag:</span> {formatCurrency(outstanding)}</p>
              <p><span className="font-medium text-stone-600">Verwendungszweck:</span> Klassenkasse {classInfo.className} - {student.name}</p>
            </div>
          </Card>
        )}

        {/* Payment History */}
        {activeTransactions.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-stone-800 mb-3">Zahlungshistorie</h3>
            <div className="flex flex-col divide-y divide-stone-100">
              {activeTransactions
                .filter((t) => t.type === 'income')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((t) => (
                  <div key={t.id} className="flex justify-between py-2 text-sm">
                    <span className="text-stone-500">
                      {formatDate(t.date)}
                    </span>
                    <span className="font-medium text-brand-income">
                      +{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* DSGVO Notice */}
        <InfoBox variant="privacy">
          Diese Seite zeigt ausschliesslich Daten, die Ihr Kind betreffen.
          Es werden keine Cookies gesetzt und keine Daten an Dritte uebermittelt.
          Alle Daten werden lokal im Browser des Kassenwarts gespeichert (Art. 6 Abs. 1 lit. b DSGVO).
        </InfoBox>

        <p className="text-center text-xs text-stone-300 pb-4">
          Klassenkasse App &middot; Eltern-Self-Service
        </p>
      </div>
    </div>
  )
}
