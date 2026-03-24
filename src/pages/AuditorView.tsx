import { useState } from 'react'
import { db } from '@/db/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { InfoBox } from '@/components/ui/InfoBox'
import { Input } from '@/components/ui/Input'
import { formatCurrency, formatDate } from '@/utils/format'
import { verifyPin } from '@/utils/privacy'
import { generateAnnualReportPDF } from '@/utils/pdf'
import type { Transaction } from '@/types'
import { useActiveClassInfo, useClassTransactions, useClassStudents, useClassAuditRecords, useActiveClassId } from '@/hooks/useClassData'

async function hashTransactions(transactions: Transaction[]): Promise<string> {
  const sorted = [...transactions].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  const data = sorted
    .map((t) => `${t.id}|${new Date(t.date).toISOString()}|${t.amount}|${t.type}|${t.category}`)
    .join('\n')
  const encoder = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function AuditorView() {
  const [authenticated, setAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [showAuditDialog, setShowAuditDialog] = useState(false)
  const [auditConfirmed, setAuditConfirmed] = useState(false)
  const [auditorNameInput, setAuditorNameInput] = useState('')
  const [saving, setSaving] = useState(false)

  const classInfo = useActiveClassInfo()
  const transactions = useClassTransactions()
  const students = useClassStudents()
  const allAuditRecords = useClassAuditRecords()
  const auditRecords = allAuditRecords ? [...allAuditRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : undefined
  const activeClassId = useActiveClassId()

  if (!classInfo || !transactions || !students) {
    return <div className="flex h-40 items-center justify-center text-stone-400">Laden...</div>
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const auditorPin = localStorage.getItem('auditorPin')
    if (!auditorPin) {
      setAuthenticated(true)
      return
    }
    const valid = await verifyPin(pin, auditorPin)
    if (valid) {
      setAuthenticated(true)
    } else {
      setError(true)
      setPin('')
    }
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">Kassenprüfung</h1>
        <InfoBox variant="info">
          Die Kassenprüfer-Ansicht bietet einen vollständigen Nur-Lese-Zugriff auf alle
          Buchungen und Belege.
        </InfoBox>
        <Card>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="Prüfer-PIN"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="PIN eingeben"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''))
                setError(false)
              }}
              error={error ? 'Falsche PIN' : undefined}
              autoFocus
            />
            <Button type="submit" disabled={!pin}>Anmelden</Button>
          </form>
          {!localStorage.getItem('auditorPin') && (
            <p className="mt-3 text-xs text-stone-400">
              Kein Prüfer-PIN gesetzt. Zugang ohne PIN möglich.
            </p>
          )}
        </Card>
      </div>
    )
  }

  const active = transactions.filter((t) => !t.isStorno)
  const totalIncome = active.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = active.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense
  const studentMap = new Map(students.map((s) => [s.id, s.name]))

  const categoryTotals = new Map<string, number>()
  for (const t of active.filter((t) => t.type === 'expense')) {
    categoryTotals.set(t.category, (categoryTotals.get(t.category) ?? 0) + t.amount)
  }

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  async function handleReport() {
    const latestAudit = auditRecords && auditRecords.length > 0 ? auditRecords[0] : undefined
    const doc = generateAnnualReportPDF(classInfo!, transactions!, students!, latestAudit)
    doc.save(`Kassenbericht_${classInfo!.className}_${classInfo!.schoolYear.replace('/', '-')}.pdf`)
  }

  async function handleAuditConfirm() {
    if (!auditorNameInput.trim() || !auditConfirmed) return
    setSaving(true)
    try {
      const transactionHash = await hashTransactions(active)
      await db.auditRecords.add({
        auditorName: auditorNameInput.trim(),
        date: new Date(),
        transactionCount: active.length,
        balance,
        transactionHash,
        confirmed: true,
        classId: activeClassId ?? undefined,
        createdAt: new Date(),
      })
      setShowAuditDialog(false)
      setAuditConfirmed(false)
      setAuditorNameInput('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Kassenprüfung</h1>
        <Badge variant="info">Nur Lesen</Badge>
      </div>

      <InfoBox variant="info">
        Sie sehen das Kassenbuch im Nur-Lese-Modus. Änderungen sind nicht möglich.
      </InfoBox>

      {/* Summary */}
      <Card className="bg-brand-primary text-white">
        <p className="text-sm text-stone-300">Kontostand</p>
        <p className={`currency text-3xl ${balance < 0 ? 'text-rose-300' : 'text-white'}`}>
          {formatCurrency(balance)}
        </p>
        <p className="mt-1 text-xs text-stone-400">
          Klasse {classInfo.className} · {classInfo.schoolYear}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs font-medium text-stone-500">Einnahmen</p>
          <p className="currency text-xl text-brand-income">{formatCurrency(totalIncome)}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-stone-500">Ausgaben</p>
          <p className="currency text-xl text-brand-expense">{formatCurrency(totalExpense)}</p>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <h2 className="text-sm font-semibold mb-3">Ausgaben nach Kategorie</h2>
        {categoryTotals.size === 0 ? (
          <p className="text-xs text-stone-400">Keine Ausgaben vorhanden.</p>
        ) : (
          <div className="space-y-2">
            {[...categoryTotals.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([cat, total]) => (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge>{cat}</Badge>
                  </div>
                  <span className="currency text-sm text-brand-expense">
                    {formatCurrency(total)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Transaction List */}
      <Card padding={false}>
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold">Alle Buchungen ({transactions.length})</h2>
        </div>
        <ul className="divide-y divide-stone-50 max-h-[400px] overflow-y-auto">
          {sorted.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {t.description || t.category}
                  {t.isStorno && <span className="ml-2 text-xs text-stone-400">(storniert)</span>}
                </p>
                <p className="text-xs text-stone-400">
                  {formatDate(t.date)} · {t.category}
                  {t.studentId ? ` · ${studentMap.get(t.studentId) ?? ''}` : ''}
                </p>
                {t.receiptPhoto && (
                  <span className="text-xs text-brand-info">Beleg vorhanden</span>
                )}
              </div>
              <span
                className={`currency text-sm whitespace-nowrap ${
                  t.isStorno
                    ? 'text-stone-400 line-through'
                    : t.type === 'income'
                      ? 'text-brand-income'
                      : 'text-brand-expense'
                }`}
              >
                {t.type === 'income' ? '+' : '−'}
                {formatCurrency(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Actions */}
      <Button onClick={handleReport} className="w-full">
        PDF-Bericht herunterladen
      </Button>

      <Button
        onClick={() => {
          setAuditorNameInput(classInfo.auditorName || '')
          setShowAuditDialog(true)
        }}
        className="w-full"
      >
        Kassenprüfung bestätigen
      </Button>

      {/* Previous Audit Records */}
      {auditRecords && auditRecords.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">Bisherige Kassenprüfungen</h2>
          <div className="space-y-3">
            {auditRecords.map((record) => (
              <div key={record.id} className="flex items-start gap-3 text-sm">
                <svg className="h-5 w-5 text-brand-income flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{formatDate(record.date)}</p>
                  <p className="text-xs text-stone-500">
                    Prüfer:in: {record.auditorName}
                  </p>
                  <p className="text-xs text-stone-500">
                    Kontostand: {formatCurrency(record.balance)} · {record.transactionCount} Buchungen
                  </p>
                  <p className="text-xs text-stone-400 font-mono truncate">
                    Hash: {record.transactionHash.slice(0, 16)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Button
        variant="secondary"
        onClick={() => setAuthenticated(false)}
        className="w-full"
      >
        Prüfermodus beenden
      </Button>

      {/* Audit Confirmation Dialog */}
      {showAuditDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md max-h-[80dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Kassenprüfung bestätigen</h2>
              <button
                onClick={() => {
                  setShowAuditDialog(false)
                  setAuditConfirmed(false)
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-stone-600"
                aria-label="Schließen"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-stone-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Datum</span>
                  <span className="font-medium">{formatDate(new Date())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Buchungen</span>
                  <span className="font-medium">{active.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Kontostand</span>
                  <span className={`font-medium ${balance < 0 ? 'text-brand-expense' : 'text-brand-income'}`}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>

              <Input
                label="Name der Prüfer:in"
                placeholder="Vor- und Nachname"
                value={auditorNameInput}
                onChange={(e) => setAuditorNameInput(e.target.value)}
              />

              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={auditConfirmed}
                  onChange={(e) => setAuditConfirmed(e.target.checked)}
                  className="h-5 w-5 rounded mt-0.5 flex-shrink-0"
                />
                <span className="text-stone-600">
                  Ich bestätige, dass ich das Kassenbuch geprüft habe und die Aufzeichnungen
                  ordnungsgemäß sind.
                </span>
              </label>

              <Button
                className="w-full"
                disabled={!auditConfirmed || !auditorNameInput.trim() || saving}
                onClick={handleAuditConfirm}
              >
                {saving ? 'Wird gespeichert...' : 'Bestätigen'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
