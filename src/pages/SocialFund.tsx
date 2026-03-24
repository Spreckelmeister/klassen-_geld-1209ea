import { useState } from 'react'
import { db } from '@/db/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { InfoBox } from '@/components/ui/InfoBox'
import { formatCurrency, formatDate, toISODate } from '@/utils/format'
import { useClassSocialFund, useClassStudents, useActiveClassId } from '@/hooks/useClassData'

export function SocialFund() {
  const allFundEntries = useClassSocialFund()
  const fundEntries = allFundEntries ? [...allFundEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : undefined
  const students = useClassStudents()
  const activeClassId = useActiveClassId()

  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(toISODate(new Date()))
  const [description, setDescription] = useState('')
  const [studentId, setStudentId] = useState('')

  if (!fundEntries || !students) {
    return <div className="flex h-40 items-center justify-center text-stone-400">Laden...</div>
  }

  const totalDeposits = fundEntries
    .filter((e) => e.type === 'deposit')
    .reduce((s, e) => s + e.amount, 0)
  const totalWithdrawals = fundEntries
    .filter((e) => e.type === 'withdrawal')
    .reduce((s, e) => s + e.amount, 0)
  const fundBalance = totalDeposits - totalWithdrawals

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (!parsedAmount) return

    await db.socialFund.add({
      type,
      amount: parsedAmount,
      date: new Date(date),
      description: description.trim(),
      studentId: studentId ? parseInt(studentId) : undefined,
      classId: activeClassId ?? undefined,
      createdAt: new Date(),
    })
    setAmount('')
    setDescription('')
    setStudentId('')
    setShowForm(false)
  }

  async function deleteEntry(id: number) {
    await db.socialFund.delete(id)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Sozialfonds</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : '+ Buchung'}
        </Button>
      </div>

      <InfoBox variant="privacy">
        Der Sozialfonds ist vertraulich. Er dient dazu, Beiträge für bedürftige
        Familien diskret zu übernehmen (z.B. aus Förderverein-Spenden). Die
        Zuordnung zu einzelnen Kindern ist nur für Sie als Kassenwart sichtbar
        und erscheint in keinem Export.
      </InfoBox>

      {/* Balance */}
      <Card>
        <div className="text-center">
          <p className="text-xs font-medium text-stone-500">Verfügbar im Sozialfonds</p>
          <p className={`currency text-2xl mt-1 ${fundBalance > 0 ? 'text-brand-income' : 'text-stone-400'}`}>
            {formatCurrency(fundBalance)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="text-center">
            <p className="text-xs text-stone-500">Einzahlungen</p>
            <p className="currency text-sm text-brand-income">{formatCurrency(totalDeposits)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-stone-500">Verwendung</p>
            <p className="currency text-sm text-brand-expense">{formatCurrency(totalWithdrawals)}</p>
          </div>
        </div>
      </Card>

      {/* Add Form */}
      {showForm && (
        <Card>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setType('deposit')}
                className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  type === 'deposit' ? 'bg-white text-brand-income shadow-sm' : 'text-stone-500'
                }`}
              >
                Einzahlung
              </button>
              <button
                type="button"
                onClick={() => setType('withdrawal')}
                className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  type === 'withdrawal' ? 'bg-white text-brand-expense shadow-sm' : 'text-stone-500'
                }`}
              >
                Verwendung
              </button>
            </div>

            <Input
              label="Betrag (€)"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label="Datum"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label="Beschreibung"
              placeholder={type === 'deposit' ? 'z.B. Spende Förderverein' : 'z.B. Ausflugsbeitrag übernommen'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {type === 'withdrawal' && (
              <Select
                label="Für Kind (optional, vertraulich)"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                options={[
                  { value: '', label: '– Kein Kind zugeordnet –' },
                  ...students.map((s) => ({
                    value: String(s.id),
                    label: s.name,
                  })),
                ]}
              />
            )}
            <Button type="submit" variant={type === 'deposit' ? 'income' : 'expense'} size="sm" disabled={!amount}>
              Buchen
            </Button>
          </form>
        </Card>
      )}

      {/* Entries */}
      {fundEntries.length === 0 && !showForm ? (
        <Card>
          <p className="text-center text-sm text-stone-400">
            Noch keine Buchungen im Sozialfonds.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {fundEntries.map((entry) => (
            <Card key={entry.id} padding={false}>
              <div className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {entry.description || (entry.type === 'deposit' ? 'Einzahlung' : 'Verwendung')}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {formatDate(entry.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`currency text-sm ${
                      entry.type === 'deposit' ? 'text-brand-income' : 'text-brand-expense'
                    }`}
                  >
                    {entry.type === 'deposit' ? '+' : '−'}
                    {formatCurrency(entry.amount)}
                  </span>
                  <button
                    onClick={() => entry.id && deleteEntry(entry.id)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-300 hover:text-brand-expense"
                    aria-label="Löschen"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
