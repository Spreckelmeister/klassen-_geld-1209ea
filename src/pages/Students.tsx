import { useState } from 'react'
import QRCode from 'qrcode'
import { db } from '@/db/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { InfoBox } from '@/components/ui/InfoBox'
import { formatCurrency } from '@/utils/format'
import { generateReminderText } from '@/utils/privacy'
import { useClassStudents, useClassTransactions, useActiveClassInfo, useActiveClassId } from '@/hooks/useClassData'

export function Students() {
  const students = useClassStudents()
  const transactions = useClassTransactions()
  const classInfo = useActiveClassInfo()
  const activeClassId = useActiveClassId()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBut, setNewBut] = useState(false)
  const [reminderFor, setReminderFor] = useState<number | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [linkCopied, setLinkCopied] = useState<number | null>(null)
  const [showQR, setShowQR] = useState<number | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  if (!students || !transactions || !classInfo) {
    return <div className="flex h-40 items-center justify-center text-stone-400">Laden...</div>
  }

  const defaultAmount = classInfo.defaultAmount || 0
  const activeTransactions = transactions.filter((t) => !t.isStorno)

  const studentData = students.map((student) => {
    const payments = activeTransactions
      .filter((t) => t.type === 'income' && t.studentId === student.id)
      .reduce((sum, t) => sum + t.amount, 0)
    const outstanding = Math.max(0, defaultAmount - payments)
    return { ...student, payments, outstanding }
  })

  async function addStudent(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    await db.students.add({
      name: newName.trim(),
      butStatus: newBut,
      notes: '',
      classId: activeClassId ?? undefined,
      createdAt: new Date(),
    })
    setNewName('')
    setNewBut(false)
    setShowAddForm(false)
  }

  const reminderStudent = studentData.find((s) => s.id === reminderFor)
  const detailStudent = studentData.find((s) => s.id === selectedStudent)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Schüler:innen</h1>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Abbrechen' : '+ Kind'}
        </Button>
      </div>

      <InfoBox variant="privacy">
        Der individuelle Zahlungsstatus ist ausschließlich für den Kassenwart sichtbar.
        Erstellen Sie keine offenen Listen für Elternabende oder Gruppenchats.
      </InfoBox>

      {showAddForm && (
        <Card>
          <form onSubmit={addStudent} className="flex flex-col gap-3">
            <Input
              label="Name"
              placeholder="Vor- und Nachname"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newBut}
                onChange={(e) => setNewBut(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              BuT-Berechtigung
            </label>
            <Button type="submit" size="sm">Hinzufügen</Button>
          </form>
        </Card>
      )}

      {/* Student List */}
      {studentData.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-stone-400">Noch keine Schüler:innen angelegt.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {studentData.map((s) => (
            <Card key={s.id} padding={false}>
              <button
                onClick={() => setSelectedStudent(selectedStudent === s.id ? null : (s.id ?? null))}
                className="w-full text-left p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{s.name}</p>
                      {s.butStatus && <Badge variant="info">BuT</Badge>}
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Bezahlt: {formatCurrency(s.payments)}
                    </p>
                  </div>
                  <div className="text-right">
                    {s.outstanding > 0 ? (
                      <Badge variant="warning">
                        {formatCurrency(s.outstanding)} offen
                      </Badge>
                    ) : (
                      <Badge variant="income">Bezahlt</Badge>
                    )}
                  </div>
                </div>
              </button>

              {/* Detail View */}
              {selectedStudent === s.id && detailStudent && (
                <div className="border-t border-stone-50 px-4 pb-4 pt-3">
                  <h3 className="text-xs font-medium text-stone-500 mb-2">Zahlungshistorie</h3>
                  {activeTransactions
                    .filter((t) => t.studentId === s.id)
                    .map((t) => (
                      <div key={t.id} className="flex justify-between text-xs py-1">
                        <span className="text-stone-500">
                          {new Date(t.date).toLocaleDateString('de-DE')} – {t.description || t.category}
                        </span>
                        <span className={t.type === 'income' ? 'text-brand-income' : 'text-brand-expense'}>
                          {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                        </span>
                      </div>
                    ))}

                  {s.outstanding > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        setReminderFor(s.id ?? null)
                      }}
                    >
                      Erinnerung erstellen
                    </Button>
                  )}

                  {/* Eltern-Link Section */}
                  <div className="mt-3 border-t border-stone-100 pt-3">
                    <h3 className="text-xs font-medium text-stone-500 mb-2">Eltern-Self-Service</h3>
                    {!s.selfServiceToken ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={async (e) => {
                          e.stopPropagation()
                          const token = crypto.randomUUID()
                          await db.students.update(s.id!, { selfServiceToken: token })
                        }}
                      >
                        Eltern-Link erstellen
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={async (e) => {
                            e.stopPropagation()
                            const link = `${window.location.origin}${window.location.pathname}#/family/${s.selfServiceToken}`
                            await navigator.clipboard.writeText(link)
                            setLinkCopied(s.id ?? null)
                            setTimeout(() => setLinkCopied(null), 2000)
                          }}
                        >
                          {linkCopied === s.id ? 'Kopiert!' : 'Link kopieren'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (showQR === s.id) {
                              setShowQR(null)
                              setQrDataUrl(null)
                            } else {
                              const link = `${window.location.origin}${window.location.pathname}#/family/${s.selfServiceToken}`
                              const dataUrl = await QRCode.toDataURL(link, {
                                width: 200,
                                margin: 2,
                                color: { dark: '#292524', light: '#ffffff' },
                              })
                              setQrDataUrl(dataUrl)
                              setShowQR(s.id ?? null)
                            }
                          }}
                        >
                          {showQR === s.id ? 'QR-Code ausblenden' : 'QR-Code anzeigen'}
                        </Button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Eltern-Link für die Klassenkasse (${classInfo.className}): ${window.location.origin}${window.location.pathname}#/family/${s.selfServiceToken}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 min-h-[44px] text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Per WhatsApp teilen
                        </a>
                        {showQR === s.id && qrDataUrl && (
                          <div className="flex justify-center mt-1">
                            <img src={qrDataUrl} alt="Eltern-Link QR-Code" className="w-40 h-40" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Reminder Modal */}
      {reminderFor && reminderStudent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md max-h-[80dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Zahlungserinnerung</h2>
              <button
                onClick={() => setReminderFor(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-stone-600"
                aria-label="Schließen"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <InfoBox variant="warning">
              Zahlungserinnerungen dürfen nur als persönliche Einzelnachricht versendet werden –
              nie in Gruppenchats oder offenen E-Mail-Verteilern.
            </InfoBox>
            <textarea
              readOnly
              className="mt-3 w-full rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed min-h-[200px]"
              value={generateReminderText(
                reminderStudent.name,
                classInfo.className,
                reminderStudent.outstanding,
                classInfo.iban,
              )}
            />
            <Button
              variant="secondary"
              className="mt-3 w-full"
              onClick={() => {
                const text = generateReminderText(
                  reminderStudent.name,
                  classInfo.className,
                  reminderStudent.outstanding,
                  classInfo.iban,
                )
                navigator.clipboard.writeText(text)
              }}
            >
              Text kopieren
            </Button>
            {(() => {
              const reminderText = generateReminderText(
                reminderStudent.name,
                classInfo.className,
                reminderStudent.outstanding,
                classInfo.iban,
              )
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(reminderText)}`
              const signalUrl = `https://signal.me/#p/?text=${encodeURIComponent(reminderText)}`
              const emailUrl = `mailto:?subject=${encodeURIComponent('Klassenkasse ' + classInfo.className)}&body=${encodeURIComponent(reminderText)}`
              return (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 min-h-[44px] text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                  <a
                    href={signalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 min-h-[44px] text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    Signal
                  </a>
                  <a
                    href={emailUrl}
                    className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 min-h-[44px] text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    E-Mail
                  </a>
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button
                      onClick={() => navigator.share({ text: reminderText })}
                      className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 min-h-[44px] text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                      </svg>
                      Teilen...
                    </button>
                  )}
                </div>
              )
            })()}
          </Card>
        </div>
      )}
    </div>
  )
}
