// PDF-Rechnungsimport: Text aus PDF extrahieren + KI-Parsing

import { getEngine } from '@/ai/engine';
import { fallbackCategorize } from '@/ai/fallback';

export interface ParsedInvoice {
  amount: number | null;
  date: string | null;
  description: string;
  vendor: string | null;
  category: string;
  confidence: number;
  source: 'ai' | 'fallback';
  rawText: string;
}

// PDF-Text extrahieren mit PDF.js (lazy geladen)
export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // Worker auf CDN setzen (Browser-kompatibel)
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(text);
  }

  return pages.join('\n');
}

// Rechnungsdaten aus Text extrahieren (KI oder Fallback)
export async function parseInvoice(rawText: string): Promise<ParsedInvoice> {
  const engine = getEngine();

  if (engine) {
    return parseWithAI(engine, rawText);
  }

  return parseWithRules(rawText);
}

// KI-basiertes Parsing
async function parseWithAI(
  engine: import('@mlc-ai/web-llm').MLCEngine,
  text: string,
): Promise<ParsedInvoice> {
  try {
    const prompt = `Analysiere diese deutsche Rechnung und extrahiere die Daten.

TEXT:
${text.slice(0, 2000)}

Antworte NUR mit validem JSON:
{"amount": Betrag als Zahl (z.B. 47.50), "date": "YYYY-MM-DD", "description": "Kurzbeschreibung", "vendor": "Firmenname", "category": "Kategorie"}

KATEGORIEN: Ausflug, Material, Kopien, Geschenke, Veranstaltung, Getränke/Essen, Lernmaterial, Sonstiges`;

    const response = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: 'Du extrahierst Daten aus deutschen Rechnungen. Antworte NUR mit JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Leere Antwort');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Kein JSON');

    const data = JSON.parse(jsonMatch[0]);
    return {
      amount: typeof data.amount === 'number' ? data.amount : null,
      date: data.date || null,
      description: data.description || 'Rechnung',
      vendor: data.vendor || null,
      category: data.category || 'Sonstiges',
      confidence: 0.8,
      source: 'ai',
      rawText: text.slice(0, 500),
    };
  } catch {
    return parseWithRules(text);
  }
}

// Regelbasiertes Parsing (Fallback)
function parseWithRules(text: string): ParsedInvoice {
  // Betrag finden: "Gesamtbetrag: 47,50 €" oder "Summe 123,45 EUR"
  const amountMatch = text.match(
    /(?:gesamt|summe|total|betrag|brutto|netto|endbetrag|rechnungsbetrag)[:\s]*(\d{1,5}[.,]\d{2})\s*(?:€|EUR)?/i,
  ) || text.match(/(\d{1,5}[.,]\d{2})\s*(?:€|EUR)/);

  let amount: number | null = null;
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(',', '.'));
  }

  // Datum finden: DD.MM.YYYY
  const dateMatch = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  let date: string | null = null;
  if (dateMatch) {
    date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
  }

  // Firmenname: erste Zeile mit Großbuchstaben
  const lines = text.split(/\n|\s{3,}/).filter((l) => l.trim().length > 3);
  const vendor = lines[0]?.trim().slice(0, 60) || null;

  // Kategorie erraten
  const { category, confidence } = fallbackCategorize(text);

  return {
    amount,
    date,
    description: vendor ? `Rechnung ${vendor}` : 'Rechnung (Details im Beleg)',
    vendor,
    category,
    confidence,
    source: 'fallback',
    rawText: text.slice(0, 500),
  };
}
