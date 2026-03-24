import { useState } from 'react'
import { db } from '@/db/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, toISODate } from '@/utils/format'
import { useClassFundraisingActions, useActiveClassId } from '@/hooks/useClassData'

export function FundraisingTracker() {
  const allActions = useClassFundraisingActions()
  const actions = allActions ? [...allActions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : undefined
  const activeClassId = useActiveClassId()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState(toISODate(new Date()))
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editIncome, setEditIncome] = useState('')
  const [editCosts, setEditCosts] = useState('')

  if (!actions) {
    return <div className="flex h-40 items-center justify-center text-stone-400">Laden...</div>
  }

  const totalNet = actions.reduce((s, a) => s + (a.grossIncome - a.costs), 0)
  const totalGross = actions.reduce((s, a) => s + a.grossIncome, 0)
  const totalCosts = actions.reduce((s, a) => s + a.costs, 0)

  const ranking = [...actions]
    .filter((a) => a.grossIncome > 0)
    .sort((a, b) => (b.grossIncome - b.costs) - (a.grossIncome - a.costs))

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await db.fundraisingActions.add({
      name: name.trim(),
      date: new Date(date),
      description: description.trim(),
      grossIncome: 0,
      costs: 0,
      completed: false,
      classId: activeClassId ?? undefined,
      createdAt: new Date(),
    })
    setName('')
    setDescription('')
    setShowForm(false)
  }

  function startEdit(action: NonNullable<typeof actions>[0]) {
    if (!action) return
    setEditingId(action.id ?? null)
    setEditIncome(String(action.grossIncome || ''))
    setEditCosts(String(action.costs || ''))
  }

  async function saveEdit() {
    if (editingId === null) return
    await db.fundraisingActions.update(editingId, {
      grossIncome: parseFloat(editIncome.replace(',', '.')) || 0,
      costs: parseFloat(editCosts.replace(',', '.')) || 0,
    })
    setEditingId(null)
  }

  async function toggleComplete(id: number, completed: boolean) {
    await db.fundraisingActions.update(id, { completed: !completed })
  }

  async function deleteAction(id: number) {
    await db.fundraisingActions.delete(id)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Fundraising</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : '+ Aktion'}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <p className="text-xs font-medium text-stone-500">Einnahmen</p>
          <p className="currency text-sm text-brand-income">{formatCurrency(totalGross)}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-stone-500">Kosten</p>
          <p className="currency text-sm text-brand-expense">{formatCurrency(totalCosts)}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-stone-500">Gewinn</p>
          <p className={`currency text-sm ${totalNet >= 0 ? 'text-brand-income' : 'text-brand-expense'}`}>
            {formatCurrency(totalNet)}
          </p>
        </Card>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <Input
              label="Aktionsname"
              placeholder="z.B. Kuchenverkauf, Flohmarkt, Spendenlauf"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Input
              label="Datum"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label="Beschreibung (optional)"
              placeholder="Details zur Aktion"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={!name.trim()}>
              Aktion anlegen
            </Button>
          </form>
        </Card>
      )}

      {/* Actions List */}
      {actions.length === 0 && !showForm ? (
        <Card>
          <p className="text-center text-sm text-stone-400">
            Noch keine Fundraising-Aktionen. Legen Sie Kuchenverkäufe, Flohmärkte oder
            Spendenläufe an!
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {actions.map((action) => {
            const net = action.grossIncome - action.costs
            const isEditing = editingId === action.id
            return (
              <Card key={action.id} padding={false}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{action.name}</p>
                      {action.completed && <Badge variant="income">Abgeschlossen</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => action.id && toggleComplete(action.id, action.completed)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-300 hover:text-brand-income"
                        title={action.completed ? 'Wieder öffnen' : 'Abschließen'}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => action.id && deleteAction(action.id)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-300 hover:text-brand-expense"
                        aria-label="Löschen"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {formatDate(action.date)}
                    {action.description ? ` · ${action.description}` : ''}
                  </p>

                  {isEditing ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <Input
                        label="Einnahmen (€)"
                        type="number"
                        step="0.01"
                        value={editIncome}
                        onChange={(e) => setEditIncome(e.target.value)}
                      />
                      <Input
                        label="Kosten (€)"
                        type="number"
                        step="0.01"
                        value={editCosts}
                        onChange={(e) => setEditCosts(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setEditingId(null)} className="flex-1">
                          Abbrechen
                        </Button>
                        <Button size="sm" onClick={saveEdit} className="flex-1">
                          Speichern
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-4 text-xs">
                        <span className="text-stone-500">
                          Einnahmen: <span className="currency text-brand-income">{formatCurrency(action.grossIncome)}</span>
                        </span>
                        <span className="text-stone-500">
                          Kosten: <span className="currency text-brand-expense">{formatCurrency(action.costs)}</span>
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(action)}>
                        Bearbeiten
                      </Button>
                    </div>
                  )}

                  {!isEditing && action.grossIncome > 0 && (
                    <div className="mt-2 rounded-lg bg-stone-50 px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-stone-500">Netto-Gewinn</span>
                      <span className={`currency text-sm ${net >= 0 ? 'text-brand-income' : 'text-brand-expense'}`}>
                        {formatCurrency(net)}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Ranking */}
      {ranking.length >= 2 && (
        <>
          <h2 className="text-sm font-semibold text-stone-500 mt-2">Top-Aktionen</h2>
          <Card>
            <div className="space-y-2">
              {ranking.slice(0, 5).map((a, i) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="font-medium">{a.name}</span>
                  </div>
                  <span className="currency text-brand-income">
                    {formatCurrency(a.grossIncome - a.costs)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
