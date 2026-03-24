import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PrivacyBanner } from '@/components/PrivacyBanner'
import { formatCurrency, formatDate } from '@/utils/format'
import { useActiveClassInfo, useClassStudents, useClassTransactions } from '@/hooks/useClassData'

export function Dashboard() {
  const navigate = useNavigate()

  const classInfo = useActiveClassInfo()
  const transactions = useClassTransactions()
  const students = useClassStudents()

  if (!transactions || !students || !classInfo) {
    return <div className="flex h-40 items-center justify-center text-stone-400">Laden...</div>
  }

  const activeTransactions = transactions.filter((t) => !t.isStorno)

  const totalIncome = activeTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = activeTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  // Ampelsystem: how many students have paid their default amount?
  const defaultAmount = classInfo.defaultAmount || 0
  const studentPayments = students.map((student) => {
    const paid = activeTransactions
      .filter((t) => t.type === 'income' && t.studentId === student.id)
      .reduce((sum, t) => sum + t.amount, 0)
    return { paid, required: defaultAmount }
  })
  const paidCount = studentPayments.filter((p) => p.paid >= p.required).length
  const totalStudents = students.length
  const openCount = totalStudents - paidCount

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const studentMap = new Map(students.map((s) => [s.id, s.name]))

  return (
    <div className="flex flex-col gap-4">
      <PrivacyBanner />

      {/* Balance Card */}
      <Card className="bg-brand-primary text-white" role="status" aria-live="polite">
        <p className="text-sm font-medium text-stone-300">Kontostand</p>
        <p className={`currency text-3xl ${balance < 0 ? 'text-rose-300' : 'text-white'}`} aria-label={`Kontostand: ${formatCurrency(balance)}`}>
          {formatCurrency(balance)}
        </p>
        <p className="mt-1 text-xs text-stone-400">
          Klasse {classInfo.className} · {classInfo.schoolYear}
        </p>
      </Card>

      {/* Income / Expense Summary */}
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

      {/* Traffic Light System */}
      {defaultAmount > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Zahlungsstatus</p>
              <p className="text-xs text-stone-500">
                {paidCount} von {totalStudents} bezahlt
              </p>
            </div>
            <Badge
              variant={
                openCount === 0 ? 'income' : openCount <= 3 ? 'warning' : 'expense'
              }
            >
              {openCount === 0
                ? 'Alle bezahlt'
                : `${openCount} offen`}
            </Badge>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 rounded-full bg-stone-100">
            <div
              className="h-2 rounded-full bg-brand-income transition-all"
              style={{ width: `${totalStudents > 0 ? (paidCount / totalStudents) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-stone-400">
            Der individuelle Zahlungsstatus ist ausschließlich für den Kassenwart sichtbar.
          </p>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="income" onClick={() => navigate('/add-transaction?type=income')} className="w-full">
          + Einnahme
        </Button>
        <Button variant="expense" onClick={() => navigate('/add-transaction?type=expense')} className="w-full">
          − Ausgabe
        </Button>
      </div>

      {/* Recent Transactions */}
      <Card padding={false}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold">Letzte Buchungen</h2>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-medium text-brand-info hover:underline min-h-[44px] flex items-center"
          >
            Alle anzeigen
          </button>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-stone-400">Noch keine Buchungen vorhanden.</p>
        ) : (
          <ul className="divide-y divide-stone-50">
            {recentTransactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {t.description || t.category}
                    {t.isStorno && (
                      <span className="ml-2 text-xs text-stone-400">(storniert)</span>
                    )}
                  </p>
                  <p className="text-xs text-stone-400">
                    {formatDate(t.date)}
                    {t.studentId ? ` · ${studentMap.get(t.studentId) ?? ''}` : ''}
                  </p>
                </div>
                <span
                  className={`currency text-sm ${
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
        )}
      </Card>
    </div>
  )
}
