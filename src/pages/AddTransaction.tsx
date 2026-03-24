import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db } from '@/db/database'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { toISODate } from '@/utils/format'
import { useClassStudents, useActiveClassId } from '@/hooks/useClassData'

export function AddTransaction() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get('type')
  const activeClassId = useActiveClassId()

  const students = useClassStudents()

  const [type, setType] = useState<'income' | 'expense'>(
    typeParam === 'expense' ? 'expense' : 'income',
  )
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(toISODate(new Date()))
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [studentId, setStudentId] = useState('')
  const [isBulk, setIsBulk] = useState(false)
  const [receiptPhoto, setReceiptPhoto] = useState<Blob | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (!parsedAmount || parsedAmount <= 0) return

    setSaving(true)
    try {
      if (isBulk && type === 'income' && students) {
        for (const student of students) {
          await db.transactions.add({
            type,
            amount: parsedAmount,
            date: new Date(date),
            category: category || categories[0]!,
            description: description || `Sammeleinzahlung – ${student.name}`,
            studentId: student.id,
            receiptPhoto: receiptPhoto ?? undefined,
            isStorno: false,
            classId: activeClassId ?? undefined,
            createdAt: new Date(),
          })
        }
      } else {
        await db.transactions.add({
          type,
          amount: parsedAmount,
          date: new Date(date),
          category: category || categories[0]!,
          description,
          studentId: studentId ? parseInt(studentId) : undefined,
          receiptPhoto: receiptPhoto ?? undefined,
          isStorno: false,
          classId: activeClassId ?? undefined,
          createdAt: new Date(),
        })
      }
      navigate(-1)
    } catch (err) {
      console.error('Buchungsfehler:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">
        {type === 'income' ? 'Einnahme erfassen' : 'Ausgabe erfassen'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
              type === 'income'
                ? 'bg-white text-brand-income shadow-sm'
                : 'text-stone-500'
            }`}
          >
            Einnahme
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
              type === 'expense'
                ? 'bg-white text-brand-expense shadow-sm'
                : 'text-stone-500'
            }`}
          >
            Ausgabe
          </button>
        </div>

        <Card>
          <div className="flex flex-col gap-4">
            <Input
              label="Betrag (€)"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <Input
              label="Datum"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <Select
              label="Kategorie"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categories.map((c) => ({ value: c, label: c }))}
            />

            <Input
              label="Beschreibung"
              placeholder="Verwendungszweck"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {type === 'income' && students && students.length > 0 && (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isBulk}
                    onChange={(e) => {
                      setIsBulk(e.target.checked)
                      if (e.target.checked) setStudentId('')
                    }}
                    className="h-4 w-4 rounded"
                  />
                  Sammeleinzahlung (gleicher Betrag für alle)
                </label>

                {!isBulk && (
                  <Select
                    label="Schüler:in"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    options={[
                      { value: '', label: '– Kein:e Schüler:in –' },
                      ...students.map((s) => ({
                        value: String(s.id),
                        label: s.name,
                      })),
                    ]}
                  />
                )}
              </>
            )}
            {/* Receipt Photo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">Belegfoto (optional)</label>
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 py-3 cursor-pointer hover:bg-stone-100 transition-colors min-h-[44px]">
                  <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                  </svg>
                  <span className="text-sm text-stone-500">
                    {photoPreview ? 'Foto ändern' : 'Foto aufnehmen'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </label>
                {!photoPreview && (
                  <label className="flex items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 cursor-pointer hover:bg-stone-100 transition-colors min-h-[44px]">
                    <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoCapture}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {photoPreview && (
                <div className="relative mt-1">
                  <img
                    src={photoPreview}
                    alt="Belegvorschau"
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptPhoto(null)
                      setPhotoPreview(null)
                    }}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white text-xs"
                    aria-label="Foto entfernen"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
            Abbrechen
          </Button>
          <Button
            variant={type === 'income' ? 'income' : 'expense'}
            type="submit"
            disabled={saving || !amount}
          >
            {saving ? 'Speichern...' : 'Buchen'}
          </Button>
        </div>
      </form>
    </div>
  )
}
