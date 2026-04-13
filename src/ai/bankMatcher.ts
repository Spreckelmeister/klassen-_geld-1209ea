// KI-gestütztes Bank-Matching mit Fallback

import { getEngine } from './engine';
import { SYSTEM_PROMPT_BANK_MATCHER, buildBankMatchPrompt } from './prompts';
import { fallbackNameMatch, type MatchResult } from './fallback';
import type { Student, BankTransaction } from '@/types';

export async function matchBankTransaction(
  students: Student[],
  tx: BankTransaction,
): Promise<MatchResult> {
  const engine = getEngine();

  // Fallback wenn KI nicht verfügbar
  if (!engine) {
    return fallbackNameMatch(students, tx);
  }

  try {
    const dateStr = tx.date instanceof Date ? tx.date.toISOString().split('T')[0] ?? '' : String(tx.date);
    const response = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_BANK_MATCHER },
        {
          role: 'user',
          content: buildBankMatchPrompt(
            students.map((s) => ({ id: s.id!, name: s.name })),
            {
              verwendungszweck: tx.verwendungszweck,
              senderName: tx.senderName,
              amount: tx.amount,
              date: dateStr,
            },
          ),
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Leere KI-Antwort');

    // JSON aus Antwort extrahieren
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Kein JSON in KI-Antwort');

    const result = JSON.parse(jsonMatch[0]);
    return {
      studentId: result.student_id ? Number(result.student_id) : null,
      category: result.category || 'Einzahlung',
      confidence: Math.min(1, Math.max(0, result.confidence || 0)),
      reasoning: result.reasoning || '',
      source: 'ai',
    };
  } catch (error) {
    console.warn('KI-Matching fehlgeschlagen, verwende Fallback:', error);
    return fallbackNameMatch(students, tx);
  }
}
