// KI-gestützte Ausgaben-Kategorisierung

import { getEngine } from './engine';
import { SYSTEM_PROMPT_CATEGORIZER } from './prompts';
import { fallbackCategorize } from './fallback';

export interface CategorizeResult {
  category: string;
  confidence: number;
  source: 'ai' | 'fallback';
}

export async function categorizeTransaction(description: string): Promise<CategorizeResult> {
  const engine = getEngine();

  if (!engine) {
    const result = fallbackCategorize(description);
    return { ...result, source: 'fallback' };
  }

  try {
    const response = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_CATEGORIZER },
        { role: 'user', content: `Kategorisiere: "${description}"` },
      ],
      temperature: 0.1,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Leere KI-Antwort');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Kein JSON');

    const result = JSON.parse(jsonMatch[0]);
    return {
      category: result.category || 'Sonstiges',
      confidence: Math.min(1, Math.max(0, result.confidence || 0)),
      source: 'ai',
    };
  } catch {
    const result = fallbackCategorize(description);
    return { ...result, source: 'fallback' };
  }
}
