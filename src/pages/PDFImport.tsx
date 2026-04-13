// PDF-Rechnungsimport Seite

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { InfoBox } from '@/components/ui/InfoBox';
import { AIBadge } from '@/components/ui/AIBadge';
import { EXPENSE_CATEGORIES } from '@/types';
import { formatCurrency } from '@/utils/format';
import { createTransaction } from '@/db/transactionService';
import { useActiveClassId } from '@/hooks/useClassData';
import { extractTextFromPDF, parseInvoice, type ParsedInvoice } from '@/import/pdfInvoice';

export function PDFImport() {
  const navigate = useNavigate();
  const activeClassId = useActiveClassId();
  const [status, setStatus] = useState<'idle' | 'extracting' | 'parsed' | 'saving' | 'done' | 'error'>('idle');
  const [invoice, setInvoice] = useState<ParsedInvoice | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Editierbare Felder
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Bitte eine PDF-Datei auswählen.');
      setStatus('error');
      return;
    }

    setStatus('extracting');
    setErrorMsg('');

    try {
      // 1. Text aus PDF extrahieren
      const text = await extractTextFromPDF(file);
      if (text.trim().length < 10) {
        setErrorMsg('Kein lesbarer Text im PDF gefunden. Ist es ein gescanntes Bild?');
        setStatus('error');
        return;
      }

      // 2. KI oder Fallback parst die Rechnung
      const result = await parseInvoice(text);
      setInvoice(result);

      // Felder vorbelegen
      setAmount(result.amount ? result.amount.toFixed(2) : '');
      setDate(result.date || new Date().toISOString().split('T')[0]);
      setDescription(result.description || '');
      setCategory(result.category || 'Sonstiges');
      setStatus('parsed');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Fehler beim Lesen der PDF');
      setStatus('error');
    }
  }

  async function handleSave() {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) return;

    setStatus('saving');
    try {
      await createTransaction({
        type: 'expense',
        amount: parsedAmount,
        date: new Date(date),
        category: category || 'Sonstiges',
        description,
        isStorno: false,
        aiSuggested: invoice?.source === 'ai',
        aiConfidence: invoice?.confidence,
        classId: activeClassId ?? undefined,
      });
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Speicherfehler');
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">PDF-Rechnung importieren</h1>

      <InfoBox variant="info">
        Laden Sie eine Rechnung als PDF hoch. Die KI liest Betrag, Datum und Beschreibung
        automatisch aus. Sie können alle Werte vor dem Speichern noch bearbeiten.
      </InfoBox>

      {/* Upload */}
      {(status === 'idle' || status === 'error') && (
        <Card>
          <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-8 cursor-pointer hover:bg-stone-100 transition-colors min-h-[120px]">
            <svg className="h-10 w-10 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span className="text-sm text-stone-600 font-medium">PDF-Rechnung auswählen</span>
            <span className="text-xs text-stone-400">Klicken oder Datei hierher ziehen</span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
          {status === 'error' && (
            <p className="mt-3 text-sm text-brand-expense">{errorMsg}</p>
          )}
        </Card>
      )}

      {/* Loading */}
      {status === 'extracting' && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-violet-500" />
            <p className="text-sm text-stone-600">PDF wird analysiert...</p>
            <p className="text-xs text-stone-400">Text wird extrahiert und von der KI ausgewertet</p>
          </div>
        </Card>
      )}

      {/* Ergebnis bearbeiten */}
      {status === 'parsed' && invoice && (
        <>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Erkannte Daten</h2>
              {invoice.source === 'ai' && <AIBadge confidence={invoice.confidence} />}
              {invoice.source === 'fallback' && (
                <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                  Regelbasiert
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
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

              <Input
                label="Beschreibung"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Verwendungszweck"
              />

              {invoice.vendor && (
                <div className="text-xs text-stone-500">
                  Lieferant: <span className="font-medium">{invoice.vendor}</span>
                </div>
              )}

              <Select
                label="Kategorie"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
          </Card>

          {/* Vorschau des extrahierten Texts */}
          <Card>
            <details className="text-xs">
              <summary className="text-stone-500 cursor-pointer">
                Extrahierter PDF-Text anzeigen
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-stone-400 max-h-32 overflow-y-auto">
                {invoice.rawText}
              </pre>
            </details>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => { setStatus('idle'); setInvoice(null); }}>
              Abbrechen
            </Button>
            <Button
              variant="expense"
              onClick={handleSave}
              disabled={!amount || !date}
            >
              Als Ausgabe buchen
            </Button>
          </div>
        </>
      )}

      {/* Erfolg */}
      {status === 'done' && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-6">
            <svg className="h-12 w-12 text-brand-income" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-sm font-medium">Rechnung erfolgreich gebucht!</p>
            <p className="text-xs text-stone-500">
              {description} — {formatCurrency(parseFloat(amount.replace(',', '.')))}
            </p>
            <div className="flex gap-2 mt-2">
              <Button variant="secondary" size="sm" onClick={() => { setStatus('idle'); setInvoice(null); }}>
                Weitere Rechnung
              </Button>
              <Button size="sm" onClick={() => navigate('/transactions')}>
                Zum Kassenbuch
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
