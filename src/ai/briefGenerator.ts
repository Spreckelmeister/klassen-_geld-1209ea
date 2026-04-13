// KI-gestützte Elternbrief-Generierung

import { getEngine } from './engine';
import { SYSTEM_PROMPT_BRIEF_GENERATOR, buildBriefPrompt } from './prompts';

export interface BriefParams {
  type: string;
  className: string;
  schoolYear: string;
  amount?: number;
  purpose?: string;
  kassenwart: string;
  balance?: number;
  dueDate?: string;
}

export async function generateBrief(params: BriefParams): Promise<{
  text: string;
  source: 'ai' | 'template';
}> {
  const engine = getEngine();

  if (!engine) {
    return { text: generateTemplateBrief(params), source: 'template' };
  }

  try {
    const response = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_BRIEF_GENERATOR },
        { role: 'user', content: buildBriefPrompt(params) },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content || content.length < 50) throw new Error('Zu kurze Antwort');

    return { text: content.trim(), source: 'ai' };
  } catch {
    return { text: generateTemplateBrief(params), source: 'template' };
  }
}

// Fallback: Vorlagen-basierte Briefe
function generateTemplateBrief(params: BriefParams): string {
  const amountStr = params.amount ? `${params.amount.toFixed(2)} €` : '';
  const date = params.dueDate || '';

  switch (params.type) {
    case 'ersteinzahlung':
      return `Liebe Eltern der ${params.className},

zu Beginn des Schuljahres ${params.schoolYear} möchten wir Sie bitten, einen Betrag von ${amountStr} in die Klassenkasse einzuzahlen. Dieser Betrag wird für gemeinsame Aktivitäten wie Ausflüge, Bastelmaterial und Klassenfeste verwendet.

${date ? `Bitte überweisen Sie den Betrag bis zum ${date}.` : ''}

Die Einzahlung ist freiwillig. Sollte eine Zahlung für Sie schwierig sein, sprechen Sie uns bitte vertraulich an.

Mit freundlichen Grüßen
${params.kassenwart}
Kassenwart der ${params.className}`;

    case 'nachzahlung':
      return `Liebe Eltern der ${params.className},

für ${params.purpose || 'anstehende Aktivitäten'} bitten wir um eine zusätzliche Einzahlung von ${amountStr} in die Klassenkasse.

${params.balance !== undefined ? `Der aktuelle Kassenstand beträgt ${params.balance.toFixed(2)} €.` : ''}

Die Einzahlung ist freiwillig.

Mit freundlichen Grüßen
${params.kassenwart}`;

    case 'ausflug':
      return `Liebe Eltern der ${params.className},

wir planen ${params.purpose || 'einen Klassenausflug'} und bitten um einen Beitrag von ${amountStr}.

${date ? `Bitte überweisen Sie bis zum ${date}.` : ''}

Die Teilnahme und der Beitrag sind freiwillig.

Mit freundlichen Grüßen
${params.kassenwart}`;

    default:
      return `Liebe Eltern der ${params.className},

${params.purpose || 'wir möchten Sie über aktuelle Angelegenheiten der Klassenkasse informieren.'}

${amountStr ? `Betrag: ${amountStr}` : ''}

Mit freundlichen Grüßen
${params.kassenwart}`;
  }
}
