// Regelbasiertes Matching wenn WebGPU nicht verfügbar

import type { Student, BankTransaction } from '@/types';

export interface MatchResult {
  studentId: number | null;
  category: string;
  confidence: number;
  reasoning: string;
  source: 'ai' | 'fallback';
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + (a[i - 1] !== b[j - 1] ? 1 : 0),
      );
  return dp[m]![n]!;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function fallbackNameMatch(students: Student[], tx: BankTransaction): MatchResult {
  const searchText = normalize(`${tx.verwendungszweck} ${tx.senderName}`);
  let bestMatch: Student | null = null;
  let bestScore = 0;

  for (const student of students) {
    const nameParts = normalize(student.name).split(' ');
    let score = 0;

    for (const part of nameParts) {
      if (part.length < 2) continue;
      if (searchText.includes(part)) {
        score += part.length > 3 ? 2 : 1;
      } else {
        // Fuzzy: Levenshtein-Distanz <= 1
        const words = searchText.split(' ');
        for (const word of words) {
          if (word.length > 2 && levenshtein(part, word) <= 1) {
            score += 1;
            break;
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = student;
    }
  }

  const confidence = bestMatch ? Math.min(1, bestScore / 3) : 0;

  return {
    studentId: confidence > 0.3 ? bestMatch!.id ?? null : null,
    category: 'Einzahlung',
    confidence,
    reasoning: bestMatch
      ? `Name "${bestMatch.name}" im Verwendungszweck gefunden (Score: ${bestScore})`
      : 'Kein passender Name gefunden',
    source: 'fallback',
  };
}

// Regelbasierte Kategorisierung
export function fallbackCategorize(description: string): { category: string; confidence: number } {
  const lower = description.toLowerCase();

  const rules: [string[], string][] = [
    [['ausflug', 'zoo', 'museum', 'theater', 'kino', 'tierpark'], 'Ausflug'],
    [['klassenfahrt', 'abschlussfahrt', 'schulfahrt', 'reise'], 'Klassenfahrt'],
    [['basteln', 'material', 'papier', 'farbe', 'kleber', 'schere'], 'Material'],
    [['kopie', 'druck', 'papier'], 'Kopien'],
    [['geschenk', 'geburtstag', 'abschied'], 'Geschenke'],
    [['fest', 'feier', 'party', 'weihnacht', 'fasching', 'karneval'], 'Veranstaltung'],
    [['essen', 'trinken', 'kuchen', 'getränk', 'pizza', 'eis'], 'Veranstaltung'],
    [['einzahl', 'beitrag', 'kassengeld', 'klassengeld', 'klassenkasse'], 'Einzahlung'],
  ];

  for (const [keywords, category] of rules) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return { category, confidence: 0.7 };
    }
  }

  return { category: 'Sonstiges', confidence: 0.3 };
}
