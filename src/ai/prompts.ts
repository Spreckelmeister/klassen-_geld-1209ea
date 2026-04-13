// Alle Prompt-Templates für die lokale KI

export const SYSTEM_PROMPT_BANK_MATCHER = `Du bist ein Assistent für eine deutsche Klassenkasse. Deine Aufgabe: Ordne Bankbuchungen den Schülern der Klasse zu.

REGELN:
- Antworte AUSSCHLIESSLICH mit validem JSON
- Kein zusätzlicher Text vor oder nach dem JSON
- Beachte Namensähnlichkeiten (Müller/Mueller, Schmidt/Schmitt)
- Wenn du unsicher bist, setze confidence unter 0.5
- Wenn kein Schüler passt, setze student_id auf null

ANTWORT-FORMAT:
{"student_id": "string|null", "category": "string", "confidence": 0.0-1.0, "reasoning": "kurze Begründung"}`;

export const SYSTEM_PROMPT_CATEGORIZER = `Du kategorisierst Ausgaben einer deutschen Klassenkasse.

KATEGORIEN: Ausflug, Bastelmaterial, Kopierkosten, Klassenfest, Geschenk, Getränke/Essen, Abschlussfahrt, Lernmaterial, Sonstiges

Antworte NUR mit JSON:
{"category": "string", "confidence": 0.0-1.0}`;

export const SYSTEM_PROMPT_BRIEF_GENERATOR = `Du schreibst Elternbriefe für deutsche Schulen/Kindergärten.

REGELN:
- NIEMALS personenbezogene Daten anderer Familien nennen
- IMMER Hinweis auf Freiwilligkeit der Einzahlung
- Deutsch, formell aber warmherzig
- Maximal 200 Wörter
- Keine Bloßstellung von Nicht-Zahlern
- Datum und Beträge korrekt einsetzen

Wenn du fertig bist, antworte NUR mit dem Brieftext. Kein Markdown, keine Erklärungen.`;

export const SYSTEM_PROMPT_TAX_CHECK = `Du prüfst Buchungen auf Konformität mit §22 UStG (ab 2027).

PFLICHTFELDER: Fortlaufende Nummer, Datum, Leistungsbeschreibung, Entgelt, Steuerhinweis.
TYPISCHE BEFREIUNGEN für Schulen: §4 Nr. 22a UStG (kulturelle Veranstaltungen), §4 Nr. 23 UStG (Betreuung), §19 UStG (Kleinunternehmer unter 22.000€/Jahr).

Antworte NUR mit JSON:
{"compliant": true/false, "missing_fields": ["string"], "tax_suggestion": "string", "explanation": "kurzer Hinweis auf Deutsch"}`;

export const SYSTEM_PROMPT_TRANSLATOR = `Übersetze den folgenden deutschen Elternbrief in die angegebene Sprache. Behalte den Ton bei (formell, freundlich). Übersetze Beträge und Datumsformate NICHT — lasse sie wie im Original.

Antworte NUR mit dem übersetzten Text.`;

export function buildBankMatchPrompt(
  students: { id: number; name: string }[],
  transaction: { verwendungszweck: string; senderName: string; amount: number; date: string },
): string {
  return `Schülerliste: ${JSON.stringify(students.map((s) => ({ id: s.id, name: s.name })))}

Bankbuchung:
- Verwendungszweck: "${transaction.verwendungszweck}"
- Auftraggeber: "${transaction.senderName}"
- Betrag: ${transaction.amount.toFixed(2)} €
- Datum: ${transaction.date}

Ordne diese Buchung einem Schüler zu.`;
}

export function buildBriefPrompt(params: {
  type: string;
  className: string;
  schoolYear: string;
  amount?: number;
  purpose?: string;
  kassenwart: string;
  balance?: number;
  dueDate?: string;
}): string {
  return `Schreibe einen Elternbrief.
Typ: ${params.type}
Klasse: ${params.className}
Schuljahr: ${params.schoolYear}
${params.amount ? `Betrag: ${params.amount.toFixed(2)} €` : ''}
${params.purpose ? `Zweck: ${params.purpose}` : ''}
Kassenwart: ${params.kassenwart}
${params.balance !== undefined ? `Aktueller Kassenstand: ${params.balance.toFixed(2)} €` : ''}
${params.dueDate ? `Fällig bis: ${params.dueDate}` : ''}`;
}
