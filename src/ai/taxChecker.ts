// §22 UStG Compliance-Check per KI

import { getEngine } from './engine';
import { SYSTEM_PROMPT_TAX_CHECK } from './prompts';
import type { Transaction } from '@/types';

export interface TaxCheckResult {
  compliant: boolean;
  missingFields: string[];
  taxSuggestion: string;
  explanation: string;
  source: 'ai' | 'fallback';
}

export async function checkTaxCompliance(tx: Transaction): Promise<TaxCheckResult> {
  // Regelbasierte Prüfung (immer verfügbar)
  const missingFields: string[] = [];
  if (!tx.sequenceNo) missingFields.push('Fortlaufende Nummer');
  if (!tx.date) missingFields.push('Datum');
  if (!tx.description) missingFields.push('Leistungsbeschreibung');
  if (tx.amount === undefined) missingFields.push('Entgelt');
  if (!tx.taxNote) missingFields.push('Steuerhinweis');

  const engine = getEngine();
  if (!engine) {
    return {
      compliant: missingFields.length === 0,
      missingFields,
      taxSuggestion: suggestTaxNote(tx),
      explanation: missingFields.length === 0
        ? 'Alle Pflichtfelder vorhanden.'
        : `Fehlende Felder: ${missingFields.join(', ')}`,
      source: 'fallback',
    };
  }

  try {
    const prompt = `Prüfe diese Buchung:
- Nr: ${tx.sequenceNo ?? 'fehlt'}
- Datum: ${tx.date ? new Date(tx.date).toISOString().split('T')[0] : 'fehlt'}
- Beschreibung: "${tx.description || 'fehlt'}"
- Betrag: ${tx.amount} €
- Typ: ${tx.type}
- Steuerhinweis: "${tx.taxNote || 'fehlt'}"`;

    const response = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_TAX_CHECK },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Leere Antwort');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Kein JSON');

    const result = JSON.parse(jsonMatch[0]);
    return {
      compliant: result.compliant ?? false,
      missingFields: result.missing_fields ?? missingFields,
      taxSuggestion: result.tax_suggestion ?? suggestTaxNote(tx),
      explanation: result.explanation ?? '',
      source: 'ai',
    };
  } catch {
    return {
      compliant: missingFields.length === 0,
      missingFields,
      taxSuggestion: suggestTaxNote(tx),
      explanation: missingFields.length === 0
        ? 'Alle Pflichtfelder vorhanden.'
        : `Fehlende Felder: ${missingFields.join(', ')}`,
      source: 'fallback',
    };
  }
}

function suggestTaxNote(tx: Transaction): string {
  if (tx.type === 'income' && tx.category === 'Einzahlung') {
    return 'Elternbeitrag Klassenkasse — kein steuerbarer Umsatz';
  }
  if (tx.category === 'Veranstaltung' || tx.category === 'Ausflug') {
    return 'Befreit nach §4 Nr. 22a UStG (kulturelle Veranstaltung)';
  }
  return 'Befreit nach §19 UStG (Kleinunternehmerregelung)';
}
