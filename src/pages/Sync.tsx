// WLAN-Sync Seite mit QR-Code-Pairing

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InfoBox } from '@/components/ui/InfoBox';
import { exportEncryptedBackup, importEncryptedBackup } from '@/sync/backup';
import { Input } from '@/components/ui/Input';

type SyncTab = 'sync' | 'backup';

export function Sync() {
  const [activeTab, setActiveTab] = useState<SyncTab>('backup');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleExport() {
    if (password.length < 4) {
      setStatus('Passwort muss mindestens 4 Zeichen haben');
      return;
    }
    try {
      setStatus('Backup wird erstellt...');
      await exportEncryptedBackup(password);
      setStatus('Verschlüsseltes Backup heruntergeladen!');
      setPassword('');
    } catch (err) {
      setStatus(`Fehler: ${err instanceof Error ? err.message : 'Unbekannt'}`);
    }
  }

  async function handleImport(file: File) {
    if (password.length < 4) {
      setStatus('Bitte Passwort eingeben');
      return;
    }
    setImporting(true);
    try {
      const count = await importEncryptedBackup(file, password);
      setStatus(`${count} Datensätze importiert!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannt';
      if (msg.includes('decrypt')) {
        setStatus('Falsches Passwort oder beschädigte Datei');
      } else {
        setStatus(`Import-Fehler: ${msg}`);
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Sync & Backup</h1>

      {/* Tab Toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1">
        <button
          onClick={() => setActiveTab('backup')}
          className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'backup' ? 'bg-white text-brand-primary shadow-sm' : 'text-stone-500'
          }`}
        >
          Backup
        </button>
        <button
          onClick={() => setActiveTab('sync')}
          className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'sync' ? 'bg-white text-brand-primary shadow-sm' : 'text-stone-500'
          }`}
        >
          WLAN-Sync
        </button>
      </div>

      {activeTab === 'backup' && (
        <>
          <InfoBox variant="privacy">
            Backups werden mit AES-256-GCM verschlüsselt. Ohne Passwort kann niemand die Daten lesen.
          </InfoBox>

          <Card>
            <h2 className="text-sm font-semibold mb-3">Verschlüsseltes Backup</h2>
            <Input
              label="Backup-Passwort"
              type="password"
              placeholder="Mindestens 4 Zeichen"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setStatus(null);
              }}
            />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button onClick={handleExport} disabled={password.length < 4}>
                Backup erstellen
              </Button>
              <label className="flex items-center justify-center rounded-xl bg-stone-100 py-2.5 text-sm font-medium text-stone-700 cursor-pointer hover:bg-stone-200 transition-colors min-h-[44px]">
                {importing ? 'Wird importiert...' : 'Backup laden'}
                <input
                  type="file"
                  accept=".enc,.json"
                  className="hidden"
                  disabled={importing || password.length < 4}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImport(file);
                  }}
                />
              </label>
            </div>
            {status && (
              <p className={`mt-2 text-xs ${status.includes('Fehler') || status.includes('Falsch') ? 'text-brand-expense' : 'text-brand-income'}`}>
                {status}
              </p>
            )}
          </Card>
        </>
      )}

      {activeTab === 'sync' && (
        <>
          <InfoBox variant="info">
            WLAN-Sync verbindet zwei Geräte direkt über das lokale Netzwerk. Keine Daten
            gehen ins Internet. Beide Geräte müssen im selben WLAN sein.
          </InfoBox>

          <Card>
            <h2 className="text-sm font-semibold mb-3">Peer-to-Peer Sync</h2>
            <p className="text-sm text-stone-600 mb-4">
              Die WLAN-Sync-Funktion befindet sich in der Entwicklung. Nutzen Sie bis dahin
              das verschlüsselte Backup, um Daten zwischen Geräten zu übertragen.
            </p>

            <div className="rounded-xl bg-violet-50 border border-violet-200 p-4 text-center">
              <span className="text-2xl">🔜</span>
              <p className="text-sm text-violet-700 mt-2 font-medium">Kommt bald</p>
              <p className="text-xs text-violet-500 mt-1">
                QR-Code scannen → Geräte verbinden → automatischer Abgleich
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
