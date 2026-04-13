// Mehrsprachige Übersetzung von Elternbriefen

import { getEngine } from './engine';
import { SYSTEM_PROMPT_TRANSLATOR } from './prompts';

export type TranslationLanguage = 'de' | 'tr' | 'ar' | 'uk' | 'en' | 'pl' | 'ru';

export const LANGUAGES: { code: TranslationLanguage; name: string; nativeName: string }[] = [
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch' },
  { code: 'tr', name: 'Türkisch', nativeName: 'Türkçe' },
  { code: 'ar', name: 'Arabisch', nativeName: 'العربية' },
  { code: 'uk', name: 'Ukrainisch', nativeName: 'Українська' },
  { code: 'en', name: 'Englisch', nativeName: 'English' },
  { code: 'pl', name: 'Polnisch', nativeName: 'Polski' },
  { code: 'ru', name: 'Russisch', nativeName: 'Русский' },
];

export async function translateBrief(
  text: string,
  targetLanguage: TranslationLanguage,
): Promise<{ translation: string; source: 'ai' | 'unavailable' }> {
  if (targetLanguage === 'de') {
    return { translation: text, source: 'ai' };
  }

  const engine = getEngine();
  if (!engine) {
    return {
      translation: `[Übersetzung nicht verfügbar — KI-Modell nicht geladen]\n\n${text}`,
      source: 'unavailable',
    };
  }

  const langName = LANGUAGES.find((l) => l.code === targetLanguage)?.name || targetLanguage;

  try {
    const response = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_TRANSLATOR },
        { role: 'user', content: `Übersetze ins ${langName}:\n\n${text}` },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content || content.length < 20) throw new Error('Zu kurze Übersetzung');

    return { translation: content.trim(), source: 'ai' };
  } catch {
    return {
      translation: `[Übersetzung fehlgeschlagen]\n\n${text}`,
      source: 'unavailable',
    };
  }
}
