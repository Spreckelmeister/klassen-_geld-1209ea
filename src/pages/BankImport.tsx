import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/db/database'
import type { Student } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { InfoBox } from '@/components/ui/InfoBox'
import { formatCurrency, formatDate } from '@/utils/format'
import { useClassStudents, useActiveClassInfo, useActiveClassId } from '@/hooks/useClassData'
import {
  parseBankCsv,
  BANK_OPTIONS,
  type BankFormat,
  type ParsedTransaction,
} from '@/utils/bankCsvParser'

type Confidence = 'high' | 'medium' | 'low'

interface MatchedTransaction extends ParsedTransaction {
  studentId: number | null
  confidence: Confidence
  included: boolean
}

function matchStudentToTransaction(
  verwendungszweck: string,
  senderName: string,
  students: Student[],
  className: string,
): { student: Student | null; confidence: Confidence } {
  const searchText = (verwendungszweck + ' ' + senderName).toLowerCase()

  // High confidence: Full last name found in Verwendungszweck + class reference
  for (const student of students) {
    const nameParts = student.name.toLowerCase().split(' ')
    const lastName = nameParts[nameParts.length - 1]!
    if (searchText.includes(lastName) && searchText.includes(className.toLowerCase())) {
      return { student, confidence: 'high' }
    }
  }

  // Medium confidence: Last name found but no class reference
  for (const student of students) {
    const nameParts = student.name.toLowerCase().split(' ')
    const lastName = nameParts[nameParts.length - 1]!
    if (searchText.includes(lastName)) {
      return { student, confidence: 'medium' }
    }
  }

  return { student: null, confidence: 'low' }
}

type Step = 'upload' | 'preview' | 'done'

export function BankImport() {
  const navigate = useNavigate()
  const students = useClassStudents()
  const classInfo = useActiveClassInfo()
  const activeClassId = useActiveClassId()

  const [step, setStep] = useState<Step>('upload')
  const [bankFormat, setBankFormat] = useState<BankFormat>('sparkasse')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<MatchedTransaction[]>([])
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)

  const defaultAmount = classInfo?.defaultAmount ?? 0
  const className = classInfo?.className ?? ''

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setError(null)
    }
  }, [])

  const handleParse = useCallback(async () => {
    if (!file || !students) return
    setError(null)

    try {
      const text = await file.text()
      const parsed = parseBankCsv(text, bankFormat)

      if (parsed.length === 0) {
        setError('Keine eingehenden Zahlungen in der CSV gefunden.')
        return
      }

      // Filter by amount range if defaultAmount is set (+-20% tolerance)
      let filtered = parsed
      if (defaultAmount > 0) {
        const minAmount = defaultAmount * 0.8
        const maxAmount = defaultAmount * 1.2
        filtered = parsed.filter((t) => t.amount >= minAmount && t.amount <= maxAmount)

        // If filtering removes everything, fall back to all parsed transactions
        if (filtered.length === 0) {
          filtered = parsed
        }
      }

      // Match each transaction to a student
      const matched: MatchedTransaction[] = filtered.map((t) => {
        const match = matchStudentToTransaction(t.reference, t.senderName, students, className)
        return {
          ...t,
          studentId: match.student?.id ?? null,
          confidence: match.confidence,
          included: match.confidence !== 'low', // Pre-select matched ones
        }
      })

      setTransactions(matched)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Lesen der CSV-Datei.')
    }
  }, [file, students, bankFormat, defaultAmount, className])

  const handleToggle = useCallback((index: number) => {
    setTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, included: !t.included } : t)),
    )
  }, [])

  const handleStudentChange = useCallback(
    (index: number, studentId: string) => {
      setTransactions((prev) =>
        prev.map((t, i) => {
          if (i !== index) return t
          const newStudentId = studentId ? parseInt(studentId) : null
          const newConfidence: Confidence = newStudentId ? 'high' : 'low'
          return { ...t, studentId: newStudentId, confidence: newConfidence, included: !!newStudentId }
        }),
      )
    },
    [],
  )

  const handleImport = useCallback(async () => {
    const toImport = transactions.filter((t) => t.included && t.studentId)
    if (toImport.length === 0) return

    setImporting(true)
    try {
      for (const t of toImport) {
        await db.transactions.add({
          type: 'income',
          amount: t.amount,
          date: t.date,
          category: 'Einzahlung',
          description: `Bank-Import: ${t.reference || t.senderName}`.slice(0, 200),
          studentId: t.studentId!,
          isStorno: false,
          classId: activeClassId ?? undefined,
          createdAt: new Date(),
        })
      }
      setImportedCount(toImport.length)
      setStep('done')
    } catch (err) {
      setError('Fehler beim Importieren. Bitte erneut versuchen.')
      console.error('Import error:', err)
    } finally {
      setImporting(false)
    }
  }, [transactions])

  const includedCount = transactions.filter((t) => t.included && t.studentId).length
  const totalCount = transactions.length

  // ──────────────── Step: Upload ────────────────
  if (step === 'upload') {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-stone-500 hover:text-brand-primary transition-colors self-start min-h-[44px]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Zurueck
        </button>

        <h1 className="text-xl font-bold">Bank-Import</h1>

        <InfoBox variant="info">
          Laden Sie einen CSV-Kontoauszug Ihrer Bank hoch. Die App erkennt Zahlungen und ordnet sie
          automatisch Ihren Schueler:innen zu.
        </InfoBox>

        <Card>
          <div className="flex flex-col gap-4">
            <Select
              label="Bank"
              value={bankFormat}
              onChange={(e) => setBankFormat(e.target.value as BankFormat)}
              options={BANK_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">CSV-Datei</label>
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 py-8 cursor-pointer hover:bg-stone-100 hover:border-stone-400 transition-colors">
                <svg
                  className="h-8 w-8 text-stone-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span className="text-sm text-stone-500">
                  {file ? file.name : 'CSV-Datei auswaehlen'}
                </span>
                {file && (
                  <span className="text-xs text-stone-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                )}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {error && (
              <p className="text-sm text-brand-expense" role="alert">
                {error}
              </p>
            )}
          </div>
        </Card>

        <Button variant="primary" onClick={handleParse} disabled={!file}>
          CSV hochladen
        </Button>
      </div>
    )
  }

  // ──────────────── Step: Preview & Match ────────────────
  if (step === 'preview') {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => {
            setStep('upload')
            setTransactions([])
            setError(null)
          }}
          className="flex items-center gap-1 text-sm text-stone-500 hover:text-brand-primary transition-colors self-start min-h-[44px]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Zurueck zur Dateiauswahl
        </button>

        <h1 className="text-xl font-bold">Zahlungen zuordnen</h1>

        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500">
            {totalCount} Zahlung{totalCount !== 1 ? 'en' : ''} gefunden
          </p>
          <Badge variant={includedCount > 0 ? 'income' : 'warning'}>
            {includedCount} von {totalCount} zugeordnet
          </Badge>
        </div>

        {error && (
          <p className="text-sm text-brand-expense" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {transactions.map((t, index) => (
            <Card key={index} padding={false}>
              <div className="p-4">
                {/* Header: checkbox, confidence, amount */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={t.included}
                    onChange={() => handleToggle(index)}
                    className="mt-1 h-4 w-4 rounded border-stone-300"
                    aria-label={`Zahlung ${index + 1} einschliessen`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-stone-400">{formatDate(t.date)}</span>
                      <span className="text-sm font-semibold text-brand-income">
                        +{formatCurrency(t.amount)}
                      </span>
                    </div>

                    {/* Sender */}
                    {t.senderName && (
                      <p className="text-sm font-medium text-stone-700 mt-1 truncate">
                        {t.senderName}
                      </p>
                    )}

                    {/* Verwendungszweck */}
                    {t.reference && (
                      <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{t.reference}</p>
                    )}

                    {/* Confidence indicator */}
                    <div className="mt-2 flex items-center gap-2">
                      <ConfidenceDot confidence={t.confidence} />
                      <span className="text-xs text-stone-500">
                        {t.confidence === 'high'
                          ? 'Exakte Zuordnung'
                          : t.confidence === 'medium'
                            ? 'Teilweise Zuordnung'
                            : 'Keine Zuordnung'}
                      </span>
                    </div>

                    {/* Student selector */}
                    <div className="mt-2">
                      <select
                        value={t.studentId?.toString() ?? ''}
                        onChange={(e) => handleStudentChange(index, e.target.value)}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-brand-info focus:outline-none focus:ring-2 focus:ring-brand-info/20 min-h-[40px]"
                      >
                        <option value="">-- Schueler:in waehlen --</option>
                        {students?.map((s) => (
                          <option key={s.id} value={String(s.id)}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="bg-stone-50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {includedCount} von {totalCount} Zahlungen zugeordnet
            </p>
            <p className="text-sm font-semibold text-brand-income">
              {formatCurrency(
                transactions
                  .filter((t) => t.included && t.studentId)
                  .reduce((sum, t) => sum + t.amount, 0),
              )}
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setStep('upload')
              setTransactions([])
            }}
          >
            Abbrechen
          </Button>
          <Button
            variant="income"
            onClick={handleImport}
            disabled={importing || includedCount === 0}
          >
            {importing ? 'Importiere...' : 'Importieren'}
          </Button>
        </div>
      </div>
    )
  }

  // ──────────────── Step: Done ────────────────
  return (
    <div className="flex flex-col gap-4 items-center pt-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <svg
          className="h-8 w-8 text-brand-income"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="text-xl font-bold">Import abgeschlossen</h1>

      <p className="text-sm text-stone-500 text-center">
        {importedCount} Zahlung{importedCount !== 1 ? 'en' : ''} wurden erfolgreich importiert und
        den Schueler:innen zugeordnet.
      </p>

      <div className="grid grid-cols-2 gap-3 w-full mt-4">
        <Button variant="secondary" onClick={() => navigate('/more')}>
          Zurueck
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            setStep('upload')
            setFile(null)
            setTransactions([])
            setError(null)
          }}
        >
          Weitere CSV
        </Button>
      </div>
    </div>
  )
}

function ConfidenceDot({ confidence }: { confidence: Confidence }) {
  const color =
    confidence === 'high'
      ? 'bg-brand-income'
      : confidence === 'medium'
        ? 'bg-brand-warning'
        : 'bg-brand-expense'

  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} aria-hidden="true" />
}
