import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db } from '@/db/database'
import { useAppStore } from '@/stores/appStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { InfoBox } from '@/components/ui/InfoBox'
import { hashPin } from '@/utils/privacy'
import { parseStudentCsv } from '@/utils/studentCsvParser'
import { seedDemoData } from '@/utils/demoData'

interface StudentInput {
  name: string
  butStatus: boolean
}

export function SetupWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isAddClassMode = searchParams.get('mode') === 'add-class'
  const setSetupComplete = useAppStore((s) => s.setSetupComplete)
  const setActiveClassId = useAppStore((s) => s.setActiveClassId)

  const [step, setStep] = useState(0)
  const [className, setClassName] = useState('')
  const [schoolYear, setSchoolYear] = useState('2025/2026')
  const [treasurerName, setTreasurerName] = useState('')
  const [auditorName, setAuditorName] = useState('')
  const [iban, setIban] = useState('')
  const [defaultAmount, setDefaultAmount] = useState('')
  const [pin, setPin] = useState('')
  const [students, setStudents] = useState<StudentInput[]>([{ name: '', butStatus: false }])
  const [saving, setSaving] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleStartDemo() {
    setLoadingDemo(true)
    try {
      await seedDemoData()
      navigate('/')
    } catch (err) {
      console.error('Demo-Fehler:', err)
    } finally {
      setLoadingDemo(false)
    }
  }

  function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const parsed = parseStudentCsv(text)
      if (parsed.length === 0) return
      // Keep existing non-empty students, replace empty ones
      const existing = students.filter((s) => s.name.trim())
      setStudents([...existing, ...parsed])
    }
    reader.readAsText(file, 'utf-8')
    // Reset so the same file can be re-imported
    e.target.value = ''
  }

  function addStudent() {
    setStudents([...students, { name: '', butStatus: false }])
  }

  function updateStudent(index: number, field: keyof StudentInput, value: string | boolean) {
    setStudents(students.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  function removeStudent(index: number) {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index))
    }
  }

  async function handleFinish() {
    setSaving(true)
    try {
      if (!isAddClassMode && pin) {
        const hashed = await hashPin(pin)
        localStorage.setItem('pin', hashed)
      }

      const classId = await db.classInfo.add({
        className,
        schoolYear,
        treasurerName,
        auditorName,
        iban: iban.replace(/\s/g, ''),
        defaultAmount: parseFloat(defaultAmount) || 0,
        createdAt: new Date(),
      })

      const validStudents = students.filter((s) => s.name.trim())
      for (const s of validStudents) {
        await db.students.add({
          name: s.name.trim(),
          butStatus: s.butStatus,
          notes: '',
          classId: classId as number,
          createdAt: new Date(),
        })
      }

      if (isAddClassMode) {
        setActiveClassId(classId as number)
        navigate('/')
      } else {
        // First setup: set activeClassId and mark setup complete
        setActiveClassId(classId as number)
        setSetupComplete(true)
        navigate('/')
      }
    } catch (err) {
      console.error('Setup-Fehler:', err)
    } finally {
      setSaving(false)
    }
  }

  // In add-class mode, only show class data and students steps
  const addClassSteps = [
    {
      title: 'Klassendaten',
      content: (
        <div className="flex flex-col gap-4">
          <Input
            label="Klasse"
            placeholder="z.B. 3a, 7b"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
          <Input
            label="Schuljahr"
            placeholder="2025/2026"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
          />
          <Input
            label="Kassenwart (Ihr Name)"
            placeholder="Vor- und Nachname"
            value={treasurerName}
            onChange={(e) => setTreasurerName(e.target.value)}
          />
          <Input
            label="Kassenpruefer:in"
            placeholder="Vor- und Nachname"
            value={auditorName}
            onChange={(e) => setAuditorName(e.target.value)}
            hint="Z.B. Klassenlehrer:in oder gewaehlte:r Pruefer:in"
          />
          <Input
            label="IBAN des Treuhandkontos"
            placeholder="DE89 3704 0044 0532 0130 00"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            hint="Die IBAN erscheint auf Elternbriefen und QR-Codes"
          />
          <Input
            label="Einzahlungsbetrag pro Kind (EUR)"
            type="number"
            step="0.01"
            min="0"
            placeholder="25,00"
            value={defaultAmount}
            onChange={(e) => setDefaultAmount(e.target.value)}
          />
        </div>
      ),
      valid: className.trim() && treasurerName.trim(),
    },
    {
      title: 'Schueler:innen',
      content: (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleCsvImport}
              />
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                CSV importieren
              </Button>
            </label>
            <p className="text-xs text-stone-400">
              Unterstützt: IServ, WebUntis, Excel-Export oder eine einfache Namensliste
            </p>
          </div>
          <InfoBox variant="privacy">
            Die BuT-Berechtigung ist eine besonders schuetzenswerte Information. Sie wird
            verschluesselt gespeichert und erscheint in keinem Export oder Elternbrief.
          </InfoBox>
          {students.map((s, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={i === 0 ? 'Name' : undefined}
                  placeholder={`Kind ${i + 1}`}
                  value={s.name}
                  onChange={(e) => updateStudent(i, 'name', e.target.value)}
                />
              </div>
              <label className="flex min-h-[44px] items-center gap-1.5 text-xs text-stone-500">
                <input
                  type="checkbox"
                  checked={s.butStatus}
                  onChange={(e) => updateStudent(i, 'butStatus', e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                BuT
              </label>
              {students.length > 1 && (
                <button
                  onClick={() => removeStudent(i)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-brand-expense"
                  aria-label={`${s.name || 'Kind'} entfernen`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <Button variant="secondary" onClick={addStudent} size="sm">
            + Kind hinzufuegen
          </Button>
        </div>
      ),
      valid: students.some((s) => s.name.trim()),
    },
    {
      title: 'Zusammenfassung',
      content: (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-stone-50 p-4 text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="font-medium text-stone-500">Klasse</dt>
              <dd>{className || '–'}</dd>
              <dt className="font-medium text-stone-500">Schuljahr</dt>
              <dd>{schoolYear || '–'}</dd>
              <dt className="font-medium text-stone-500">Kassenwart</dt>
              <dd>{treasurerName || '–'}</dd>
              <dt className="font-medium text-stone-500">Kassenpruefer:in</dt>
              <dd>{auditorName || '–'}</dd>
              <dt className="font-medium text-stone-500">IBAN</dt>
              <dd className="font-mono text-xs">{iban || '–'}</dd>
              <dt className="font-medium text-stone-500">Betrag/Kind</dt>
              <dd>{defaultAmount ? `${defaultAmount} EUR` : '–'}</dd>
              <dt className="font-medium text-stone-500">Schueler:innen</dt>
              <dd>{students.filter((s) => s.name.trim()).length}</dd>
            </dl>
          </div>
        </div>
      ),
      valid: true,
    },
  ]

  const fullSetupSteps = [
    {
      title: 'Klassendaten',
      content: (
        <div className="flex flex-col gap-4">
          <Input
            label="Klasse"
            placeholder="z.B. 3a, 7b"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
          <Input
            label="Schuljahr"
            placeholder="2025/2026"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
          />
          <Input
            label="Kassenwart (Ihr Name)"
            placeholder="Vor- und Nachname"
            value={treasurerName}
            onChange={(e) => setTreasurerName(e.target.value)}
          />
          <Input
            label="Kassenprüfer:in"
            placeholder="Vor- und Nachname"
            value={auditorName}
            onChange={(e) => setAuditorName(e.target.value)}
            hint="Z.B. Klassenlehrer:in oder gewählte:r Prüfer:in"
          />
        </div>
      ),
      valid: className.trim() && treasurerName.trim(),
    },
    {
      title: 'Schüler:innen',
      content: (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleCsvImport}
              />
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                CSV importieren
              </Button>
            </label>
            <p className="text-xs text-stone-400">
              Unterstützt: IServ, WebUntis, Excel-Export oder eine einfache Namensliste
            </p>
          </div>
          <InfoBox variant="privacy">
            Die BuT-Berechtigung ist eine besonders schützenswerte Information. Sie wird
            verschlüsselt gespeichert und erscheint in keinem Export oder Elternbrief.
          </InfoBox>
          {students.map((s, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={i === 0 ? 'Name' : undefined}
                  placeholder={`Kind ${i + 1}`}
                  value={s.name}
                  onChange={(e) => updateStudent(i, 'name', e.target.value)}
                />
              </div>
              <label className="flex min-h-[44px] items-center gap-1.5 text-xs text-stone-500">
                <input
                  type="checkbox"
                  checked={s.butStatus}
                  onChange={(e) => updateStudent(i, 'butStatus', e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                BuT
              </label>
              {students.length > 1 && (
                <button
                  onClick={() => removeStudent(i)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-brand-expense"
                  aria-label={`${s.name || 'Kind'} entfernen`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <Button variant="secondary" onClick={addStudent} size="sm">
            + Kind hinzufügen
          </Button>
        </div>
      ),
      valid: students.some((s) => s.name.trim()),
    },
    {
      title: 'Kontodaten & Betrag',
      content: (
        <div className="flex flex-col gap-4">
          <Input
            label="IBAN des Treuhandkontos"
            placeholder="DE89 3704 0044 0532 0130 00"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            hint="Die IBAN erscheint auf Elternbriefen und QR-Codes"
          />
          <Input
            label="Einzahlungsbetrag pro Kind (€)"
            type="number"
            step="0.01"
            min="0"
            placeholder="25,00"
            value={defaultAmount}
            onChange={(e) => setDefaultAmount(e.target.value)}
          />
          <Input
            label="App-PIN (optional)"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="4-6 Ziffern"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            hint="Schützt die App vor unbefugtem Zugriff"
          />
        </div>
      ),
      valid: true,
    },
    {
      title: 'Zusammenfassung',
      content: (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-stone-50 p-4 text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="font-medium text-stone-500">Klasse</dt>
              <dd>{className || '–'}</dd>
              <dt className="font-medium text-stone-500">Schuljahr</dt>
              <dd>{schoolYear || '–'}</dd>
              <dt className="font-medium text-stone-500">Kassenwart</dt>
              <dd>{treasurerName || '–'}</dd>
              <dt className="font-medium text-stone-500">Kassenprüfer:in</dt>
              <dd>{auditorName || '–'}</dd>
              <dt className="font-medium text-stone-500">IBAN</dt>
              <dd className="font-mono text-xs">{iban || '–'}</dd>
              <dt className="font-medium text-stone-500">Betrag/Kind</dt>
              <dd>{defaultAmount ? `${defaultAmount} €` : '–'}</dd>
              <dt className="font-medium text-stone-500">Schüler:innen</dt>
              <dd>{students.filter((s) => s.name.trim()).length}</dd>
              <dt className="font-medium text-stone-500">PIN</dt>
              <dd>{pin ? '****' : 'Nicht gesetzt'}</dd>
            </dl>
          </div>
          <InfoBox variant="info">
            Die Einzahlung in die Klassenkasse ist freiwillig. Kein Kind wird bei
            Nichtzahlung von Aktivitäten ausgeschlossen. Familien mit BuT-Berechtigung
            können Kosten für Ausflüge und Klassenfahrten über das Bildungs- und
            Teilhabepaket erstatten lassen.
          </InfoBox>
        </div>
      ),
      valid: true,
    },
  ]

  const steps = isAddClassMode ? addClassSteps : fullSetupSteps
  const currentStep = steps[step]!

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-brand-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-brand-primary">
            {isAddClassMode ? 'Neue Klasse hinzufügen' : 'Klassenkasse einrichten'}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Schritt {step + 1} von {steps.length}
          </p>
        </div>

        <div className="mb-4 flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-brand-primary' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">{currentStep.title}</h2>
          {currentStep.content}
        </Card>

        <div className="mt-4 flex gap-3">
          {step > 0 ? (
            <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">
              Zurück
            </Button>
          ) : isAddClassMode ? (
            <Button variant="secondary" onClick={() => navigate(-1)} className="flex-1">
              Abbrechen
            </Button>
          ) : null}
          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!currentStep.valid}
              className="flex-1"
            >
              Weiter
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving} className="flex-1">
              {saving ? 'Wird gespeichert...' : isAddClassMode ? 'Klasse anlegen' : 'Fertig'}
            </Button>
          )}
        </div>

        {step === 0 && !isAddClassMode && (
          <div className="mt-6 text-center">
            <button
              onClick={handleStartDemo}
              disabled={loadingDemo}
              className="text-sm text-stone-500 underline decoration-stone-300 underline-offset-2 hover:text-brand-primary disabled:opacity-50"
            >
              {loadingDemo ? 'Demo wird geladen...' : 'Oder: Demo mit Beispieldaten starten'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
