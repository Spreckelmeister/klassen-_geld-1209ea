// Verfügbare KI-Modelle für WebLLM

import type { AIModelInfo } from '@/types';

export const AI_MODELS: AIModelInfo[] = [
  {
    id: 'Qwen3-0.6B-q4f16_1-MLC',
    name: 'Qwen 3 0.6B',
    size: '~400 MB',
    vramMB: 512,
    description: 'Neueste Generation, schnell, gutes Deutsch',
  },
  {
    id: 'Qwen3-1.7B-q4f16_1-MLC',
    name: 'Qwen 3 1.7B (Empfohlen)',
    size: '~1.1 GB',
    vramMB: 1500,
    description: 'Beste Wahl — sehr gutes Deutsch-Verständnis',
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 0.5B',
    size: '~350 MB',
    vramMB: 512,
    description: 'Bewährt, läuft auf fast jedem Gerät',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B',
    size: '~1 GB',
    vramMB: 1500,
    description: 'Gute Balance aus Qualität und Geschwindigkeit',
  },
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 360M',
    size: '~250 MB',
    vramMB: 400,
    description: 'Kleinstes Modell, ideal für schwache Geräte',
  },
];

export const DEFAULT_MODEL_ID = 'Qwen3-1.7B-q4f16_1-MLC';

export function getModelInfo(modelId: string): AIModelInfo | undefined {
  return AI_MODELS.find((m) => m.id === modelId);
}
