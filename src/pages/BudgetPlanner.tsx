import { useState } from 'react'
import { db } from '@/db/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { InfoBox } from '@/components/ui/InfoBox'
import { formatCurrency, formatDate, toISODate } from '@/utils/format'
import { EXPENSE_CATEGORIES } from '@/types'
import { useClassBudgetItems, useClassTransactions, useActiveClassId } from '@/hooks/useClassData'

export function BudgetPlanner() {
  const allBudgetItems = useClassBudgetItems()
  const budgetItems = allBudgetItems ? [...allBudgetItems].sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime()) : undefined
  const transactions = useClassTransactions()
  const activeClassId = useActiveClassId()

  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(toISODate(new Date()))
  const [category, setCategory] = useState('Ausflug')

  if (!budgetItems || !transactions) {
    return <div className="flex h-40 items-center justify-center text-stone-400">Laden...</div>
  }

  const active = transactions.filter((t) => !t.isStorno)
  const totalIncome = active.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = active.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const currentBalance = totalIncome - totalExpense

  const pendingItems = budgetItems.filter((b) => !b.completed)
  const totalPlanned = pendingItems.reduce((s, b) => s + b.estimatedAmount, 0)
  const projectedBalance = currentBalance - totalPlanned
  const needsMore = projectedBalance < 0

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (!label.trim() || !parsedAmount) return
    await db.budgetItems.add({
      label: label.trim(),
      estimatedAmount: parsedAmount,
      plannedDate: new Date(date),
      category,
      completed: false,
      classId: activeClassId ?? undefined,
      createdAt: new Date(),
    })
    setLabel('')
    setAmount('')
    setShowForm(false)
  }

  async function toggleComplete(id: number, completed: boolean) {
    await db.budgetItems.update(id, { completed: !completed })
  }

  async function deleteItem(id: number) {
    await db.budgetItems.delete(id)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Budget-Planer</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : '+ Planung'}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs font-medium text-stone-500">Aktuell verfügbar</p>
          <p className={`currency text-lg ${currentBalance < 0 ? 'text-brand-expense' : 'text-brand-income'}`}>
            {formatCurrency(currentBalance)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-stone-500">Geplante Ausgaben</p>
          <p className="currency text-lg text-brand-expense">{formatCurrency(totalPlanned)}</p>
        </Card>
      </div>

      {/* Projected Balance */}
      <Card className={needsMore ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-600">Prognostizierter Rest</p>
            <p className={`currency text-xl ${needsMore ? 'text-brand-expense' : 'text-brand-income'}`}>
              {formatCurrency(projectedBalance)}
            </p>
          </div>
          <Badge variant={needsMore ? 'expense' : 'income'}>
            {needsMore ? 'Reicht nicht!' : 'Ausreichend'}
          </Badge>
        </div>
        {needsMore && (
          <p className="mt-2 text-xs text-rose-600">
            Es fehlen noch {formatCurrency(Math.abs(projectedBalance))}. Sammeln Sie
            einen Zusatzbeitrag von{' '}
            <strong>
              {formatCurrency(Math.abs(projectedBalance))}
            </strong>{' '}
            ein, oder kürzen Sie geplante Ausgaben.
          </p>
        )}
      </Card>

      {/* Add Form */}
      {showForm && (
        <Card>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <Input
              label="Was ist geplant?"
              placeholder="z.B. Ausflug Zoo, Weihnachtsfeier"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
            <Input
              label="Geschätzte Kosten (€)"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label="Geplantes Datum"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Select
              label="Kategorie"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <Button type="submit" size="sm" disabled={!label.trim() || !amount}>
              Hinzufügen
            </Button>
          </form>
        </Card>
      )}

      {/* Timeline */}
      {pendingItems.length === 0 && !showForm ? (
        <Card>
          <p className="text-center text-sm text-stone-400">
            Keine geplanten Ausgaben. Nutzen Sie "+ Planung" um Ausgaben voraus zu planen.
          </p>
        </Card>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-stone-500 mt-2">Geplante Ausgaben</h2>
          <div className="flex flex-col gap-2">
            {pendingItems.map((item) => {
              const isPast = new Date(item.plannedDate) < new Date()
              return (
                <Card key={item.id} padding={false}>
                  <div className="flex items-center gap-3 p-4">
                    <button
                      onClick={() => item.id && toggleComplete(item.id, item.completed)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-stone-300 hover:border-brand-income transition-colors"
                      aria-label={`${item.label} als erledigt markieren`}
                    >
                      {item.completed && (
                        <svg className="h-4 w-4 text-brand-income" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs ${isPast ? 'text-brand-expense' : 'text-stone-400'}`}>
                          {formatDate(item.plannedDate)}
                        </span>
                        <Badge>{item.category}</Badge>
                      </div>
                    </div>
                    <span className="currency text-sm text-brand-expense whitespace-nowrap">
                      {formatCurrency(item.estimatedAmount)}
                    </span>
                    <button
                      onClick={() => item.id && deleteItem(item.id)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-300 hover:text-brand-expense"
                      aria-label="Löschen"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Completed Items */}
      {budgetItems.filter((b) => b.completed).length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-stone-500 mt-2">Erledigt</h2>
          <div className="flex flex-col gap-2">
            {budgetItems
              .filter((b) => b.completed)
              .map((item) => (
                <Card key={item.id} padding={false} className="bg-stone-50">
                  <div className="flex items-center gap-3 p-4 opacity-60">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-income">
                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium line-through">{item.label}</p>
                      <span className="text-xs text-stone-400">{formatDate(item.plannedDate)}</span>
                    </div>
                    <span className="currency text-sm text-stone-400 line-through">
                      {formatCurrency(item.estimatedAmount)}
                    </span>
                  </div>
                </Card>
              ))}
          </div>
        </>
      )}

      <InfoBox variant="info">
        Der Budget-Planer hilft Ihnen, geplante Ausgaben im Blick zu behalten und
        rechtzeitig Geld einzusammeln, wenn das Budget nicht ausreicht.
      </InfoBox>
    </div>
  )
}
