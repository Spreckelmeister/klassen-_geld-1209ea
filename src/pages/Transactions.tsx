import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/db/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDate } from '@/utils/format'
import { useClassTransactions, useClassStudents } from '@/hooks/useClassData'

export function Transactions() {
  const navigate = useNavigate()
  const allTransactions = useClassTransactions()
  const transactions = allTransactions ? [...allTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : undefined
  const students = useClassStudents()

  const [filterType, setFilterType] = useState<string>('all')
  const [search, setSearch] = useState('')

  if (!transactions || !students) {
    return <div className="flex h-40 items-center justify-center text-stone-400">Laden...</div>
  }

  const studentMap = new Map(students.map((s) => [s.id, s.name]))

  const filtered = transactions.filter((t) => {
    if (filterType === 'income' && t.type !== 'income') return false
    if (filterType === 'expense' && t.type !== 'expense') return false
    if (filterType === 'storno' && !t.isStorno) return false
    if (search) {
      const q = search.toLowerCase()
      const matchDesc = t.description.toLowerCase().includes(q)
      const matchCat = t.category.toLowerCase().includes(q)
      const matchStudent = t.studentId
        ? (studentMap.get(t.studentId) ?? '').toLowerCase().includes(q)
        : false
      return matchDesc || matchCat || matchStudent
    }
    return true
  })

  async function handleStorno(transactionId: number) {
    const t = await db.transactions.get(transactionId)
    if (!t || t.isStorno) return

    await db.transactions.update(transactionId, { isStorno: true })
    await db.transactions.add({
      type: t.type === 'income' ? 'expense' : 'income',
      amount: t.amount,
      date: new Date(),
      category: t.category,
      description: `Storno: ${t.description || t.category}`,
      studentId: t.studentId,
      classId: t.classId,
      isStorno: true,
      stornoRef: transactionId,
      createdAt: new Date(),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Kassenbuch</h1>
        <Button size="sm" onClick={() => navigate('/add-transaction')}>
          + Buchung
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'income', label: 'Einnahmen' },
            { value: 'expense', label: 'Ausgaben' },
            { value: 'storno', label: 'Stornos' },
          ]}
        />
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-stone-400">Keine Buchungen gefunden.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((t) => (
            <Card key={t.id} padding={false}>
              <div className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {t.description || t.category}
                    </p>
                    {t.isStorno && <Badge variant="expense">Storno</Badge>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-400">
                    <span>{formatDate(t.date)}</span>
                    <Badge>{t.category}</Badge>
                    {t.studentId && <span>{studentMap.get(t.studentId)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  {!t.isStorno && (
                    <button
                      onClick={() => t.id && handleStorno(t.id)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-300 hover:text-brand-expense"
                      title="Stornieren"
                      aria-label="Buchung stornieren"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
