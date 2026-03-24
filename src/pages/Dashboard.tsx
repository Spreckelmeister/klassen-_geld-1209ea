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
    return <div className="flex h-40 items-center justify-center text-slate-400">Laden...</div>
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

  const isDemo = localStorage.getItem('isDemo') === 'true'

  const progressPercent = totalStudents > 0 ? (paidCount / totalStudents) * 100 : 0

  return (
    <div className="flex flex-col gap-4">
      <PrivacyBanner />

      {isDemo && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-center text-xs font-medium text-amber-700">
          Demo-Modus — Daten können in den Einstellungen zurückgesetzt werden
        </div>
      )}

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white shadow-balance relative overflow-hidden" role="status" aria-live="polite">
        {/* Subtle decorative pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px'}} />
        <div className="relative">
          <p className="text-sm font-medium text-slate-300">Kontostand</p>
          <p className={`currency text-4xl mt-1 ${balance < 0 ? 'text-rose-300' : 'text-white'}`} aria-label={`Kontostand: ${formatCurrency(balance)}`}>
            {formatCurrency(balance)}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Klasse {classInfo.className} &middot; {classInfo.schoolYear}
          </p>
        </div>
      </Card>

      {/* Income / Expense Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-l-4 border-l-brand-income bg-brand-income-light/30">
          <p className="text-xs font-medium text-slate-500">Einnahmen</p>
          <p className="currency text-xl text-brand-income mt-1">{formatCurrency(totalIncome)}</p>
        </Card>
        <Card className="border-l-4 border-l-brand-expense bg-brand-expense-light/30">
          <p className="text-xs font-medium text-slate-500">Ausgaben</p>
          <p className="currency text-xl text-brand-expense mt-1">{formatCurrency(totalExpense)}</p>
        </Card>
      </div>

      {/* Traffic Light System */}
      {defaultAmount > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">Zahlungsstatus</p>
              <p className="text-xs text-slate-500 mt-0.5">
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
          <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Der individuelle Zahlungsstatus ist ausschließlich für den Kassenwart sichtbar.
          </p>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="income" size="lg" onClick={() => navigate('/add-transaction?type=income')} className="w-full">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Einnahme
        </Button>
        <Button variant="expense" size="lg" onClick={() => navigate('/add-transaction?type=expense')} className="w-full">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
          Ausgabe
        </Button>
      </div>

      {/* Recent Transactions */}
      <Card padding={false}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-sm font-bold text-slate-800">Letzte Buchungen</h2>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-semibold text-brand-info hover:text-blue-700 transition-colors min-h-[44px] flex items-center"
          >
            Alle anzeigen
          </button>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-400">Noch keine Buchungen vorhanden.</p>
        ) : (
          <ul className="divide-y divide-slate-100/80">
            {recentTransactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    t.isStorno
                      ? 'bg-slate-100 text-slate-400'
                      : t.type === 'income'
                        ? 'bg-brand-income-light text-brand-income'
                        : 'bg-brand-expense-light text-brand-expense'
                  }`}>
                    {t.type === 'income' ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" /></svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {t.description || t.category}
                      {t.isStorno && (
                        <span className="ml-2 text-xs text-slate-400">(storniert)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(t.date)}
                      {t.studentId ? ` · ${studentMap.get(t.studentId) ?? ''}` : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`currency text-sm ml-3 ${
                    t.isStorno
                      ? 'text-slate-400 line-through'
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
