import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/db/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { InfoBox } from '@/components/ui/InfoBox'
import { hashPin } from '@/utils/privacy'
import { useActiveClassInfo, useAllClasses } from '@/hooks/useClassData'
import { useAppStore } from '@/stores/appStore'
import { clearDemoData } from '@/utils/demoData'

export function Settings() {
  const navigate = useNavigate()
  const classInfo = useActiveClassInfo()
  const allClasses = useAllClasses()
  const setActiveClassId = useAppStore((s) => s.setActiveClassId)

  const [newPin, setNewPin] = useState('')
  const [auditorPin, setAuditorPin] = useState('')
  const [pinMsg, setPinMsg] = useState('')
  const [auditorPinMsg, setAuditorPinMsg] = useState('')
  const [editing, setEditing] = useState(false)
  const [className, setClassName] = useState('')
  const [treasurerName, setTreasurerName] = useState('')
  const [auditorName, setAuditorName] = useState('')
  const [iban, setIban] = useState('')
  const [defaultAmount, setDefaultAmount] = useState('')

  if (!classInfo) {
    return <div className="flex h-40 items-center justify-center text-stone-400">Laden...</div>
  }

  function startEditing() {
    setClassName(classInfo!.className)
    setTreasurerName(classInfo!.treasurerName)
    setAuditorName(classInfo!.auditorName)
    setIban(classInfo!.iban)
    setDefaultAmount(String(classInfo!.defaultAmount))
    setEditing(true)
  }

  async function saveClassInfo() {
    await db.classInfo.update(classInfo!.id!, {
      className,
      treasurerName,
      auditorName,
      iban: iban.replace(/\s/g, ''),
      defaultAmount: parseFloat(defaultAmount) || 0,
    })
    setEditing(false)
  }

  async function handleSetPin() {
    if (newPin.length < 4) {
      setPinMsg('PIN muss mindestens 4 Ziffern haben')
      return
    }
    const hashed = await hashPin(newPin)
    localStorage.setItem('pin', hashed)
    setNewPin('')
    setPinMsg('PIN gespeichert')
  }

  async function handleSetAuditorPin() {
    if (auditorPin.length < 4) {
      setAuditorPinMsg('PIN muss mindestens 4 Ziffern haben')
      return
    }
    const hashed = await hashPin(auditorPin)
    localStorage.setItem('auditorPin', hashed)
    setAuditorPin('')
    setAuditorPinMsg('Prüfer-PIN gespeichert')
  }

  function handleRemovePin() {
    localStorage.removeItem('pin')
    setPinMsg('PIN entfernt')
  }

  function handleRemoveAuditorPin() {
    localStorage.removeItem('auditorPin')
    setAuditorPinMsg('Prüfer-PIN entfernt')
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Einstellungen</h1>

      {/* Class Info */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Klassendaten</h2>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={startEditing}>
              Bearbeiten
            </Button>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-3">
            <Input label="Klasse" value={className} onChange={(e) => setClassName(e.target.value)} />
            <Input label="Kassenwart" value={treasurerName} onChange={(e) => setTreasurerName(e.target.value)} />
            <Input label="Kassenprüfer:in" value={auditorName} onChange={(e) => setAuditorName(e.target.value)} />
            <Input label="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} />
            <Input label="Betrag/Kind (€)" type="number" step="0.01" value={defaultAmount} onChange={(e) => setDefaultAmount(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)} className="flex-1">Abbrechen</Button>
              <Button size="sm" onClick={saveClassInfo} className="flex-1">Speichern</Button>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-stone-500">Klasse</dt>
            <dd>{classInfo.className}</dd>
            <dt className="text-stone-500">Schuljahr</dt>
            <dd>{classInfo.schoolYear}</dd>
            <dt className="text-stone-500">Kassenwart</dt>
            <dd>{classInfo.treasurerName}</dd>
            <dt className="text-stone-500">Kassenprüfer:in</dt>
            <dd>{classInfo.auditorName || '–'}</dd>
            <dt className="text-stone-500">IBAN</dt>
            <dd className="font-mono text-xs">{classInfo.iban || '–'}</dd>
            <dt className="text-stone-500">Betrag/Kind</dt>
            <dd>{classInfo.defaultAmount ? `${classInfo.defaultAmount} €` : '–'}</dd>
          </dl>
        )}
      </Card>

      {/* App PIN */}
      <Card>
        <h2 className="text-sm font-semibold mb-3">App-PIN</h2>
        <p className="text-xs text-stone-500 mb-3">
          {localStorage.getItem('pin') ? 'PIN ist gesetzt.' : 'Kein PIN gesetzt.'}
        </p>
        <div className="flex gap-2">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="Neue PIN (4-6 Ziffern)"
            value={newPin}
            onChange={(e) => {
              setNewPin(e.target.value.replace(/\D/g, ''))
              setPinMsg('')
            }}
            className="flex-1"
          />
          <Button size="sm" onClick={handleSetPin} disabled={!newPin}>Setzen</Button>
        </div>
        {localStorage.getItem('pin') && (
          <Button variant="danger" size="sm" onClick={handleRemovePin} className="mt-2 w-full">
            PIN entfernen
          </Button>
        )}
        {pinMsg && <p className="mt-2 text-xs text-brand-info">{pinMsg}</p>}
      </Card>

      {/* Auditor PIN */}
      <Card>
        <h2 className="text-sm font-semibold mb-3">Kassenprüfer-PIN</h2>
        <InfoBox variant="info">
          Setzen Sie einen separaten PIN für die Kassenprüfer-Ansicht. Prüfer:innen
          sehen das vollständige Kassenbuch im Nur-Lese-Modus.
        </InfoBox>
        <div className="flex gap-2 mt-3">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="Prüfer-PIN (4-6 Ziffern)"
            value={auditorPin}
            onChange={(e) => {
              setAuditorPin(e.target.value.replace(/\D/g, ''))
              setAuditorPinMsg('')
            }}
            className="flex-1"
          />
          <Button size="sm" onClick={handleSetAuditorPin} disabled={!auditorPin}>Setzen</Button>
        </div>
        {localStorage.getItem('auditorPin') && (
          <Button variant="danger" size="sm" onClick={handleRemoveAuditorPin} className="mt-2 w-full">
            Prüfer-PIN entfernen
          </Button>
        )}
        {auditorPinMsg && <p className="mt-2 text-xs text-brand-info">{auditorPinMsg}</p>}
      </Card>

      {/* Class Management */}
      <Card>
        <h2 className="text-sm font-semibold mb-3">Klassen verwalten</h2>
        {allClasses && allClasses.length > 0 ? (
          <div className="flex flex-col gap-2 mb-3">
            {allClasses.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2">
                <div>
                  <span className="text-sm font-medium">{c.className}</span>
                  <span className="ml-2 text-xs text-stone-400">{c.schoolYear}</span>
                </div>
                <div className="flex items-center gap-1">
                  {c.id === classInfo?.id && (
                    <span className="text-xs text-brand-primary font-medium mr-2">Aktiv</span>
                  )}
                  {allClasses.length > 1 && (
                    <button
                      onClick={async () => {
                        if (!c.id) return
                        const confirmed = window.confirm(
                          `Klasse "${c.className}" wirklich loeschen? Alle zugehoerigen Daten (Schueler:innen, Buchungen, etc.) werden unwiderruflich geloescht.`
                        )
                        if (!confirmed) return
                        await Promise.all([
                          db.students.where('classId').equals(c.id).delete(),
                          db.transactions.where('classId').equals(c.id).delete(),
                          db.dueDates.where('classId').equals(c.id).delete(),
                          db.budgetItems.where('classId').equals(c.id).delete(),
                          db.fundraisingActions.where('classId').equals(c.id).delete(),
                          db.socialFund.where('classId').equals(c.id).delete(),
                          db.auditRecords.where('classId').equals(c.id).delete(),
                          db.classInfo.delete(c.id),
                        ])
                        if (c.id === classInfo?.id) {
                          const remaining = await db.classInfo.toCollection().first()
                          setActiveClassId(remaining?.id ?? null)
                        }
                      }}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-stone-300 hover:text-brand-expense"
                      aria-label={`Klasse ${c.className} loeschen`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => navigate('/setup?mode=add-class')}
        >
          + Neue Klasse hinzufuegen
        </Button>
      </Card>

      {/* Demo Reset */}
      {localStorage.getItem('isDemo') === 'true' && (
        <Card>
          <h2 className="text-sm font-semibold mb-2">Demo-Modus</h2>
          <p className="text-xs text-stone-500 mb-3">
            Sie verwenden die App mit Beispieldaten. Setzen Sie die Demo zurück, um mit eigenen Daten neu zu starten.
          </p>
          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              const confirmed = window.confirm(
                'Alle Demo-Daten werden gelöscht und die App wird zurückgesetzt. Fortfahren?'
              )
              if (confirmed) clearDemoData()
            }}
          >
            Demo-Daten löschen & neu starten
          </Button>
        </Card>
      )}

      {/* Version */}
      <div className="text-center text-xs text-stone-400 py-4">
        Klassenkasse v1.0.0 · Open Source (MIT)
        <br />
        Alle Daten lokal auf Ihrem Gerät.
      </div>
    </div>
  )
}
