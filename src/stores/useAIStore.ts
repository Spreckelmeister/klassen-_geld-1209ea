// Zustand Store für KI-Status

import { create } from 'zustand';
import type { AIStatus } from '@/types';
import { DEFAULT_MODEL_ID } from '@/ai/models';

interface AIState {
  status: AIStatus;
  progress: number;
  error: string | null;
  selectedModelId: string;
  aiEnabled: boolean;

  setStatus: (status: AIStatus) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setSelectedModelId: (modelId: string) => void;
  setAIEnabled: (enabled: boolean) => void;
}

export const useAIStore = create<AIState>((set) => ({
  status: 'idle',
  progress: 0,
  error: null,
  selectedModelId: localStorage.getItem('ai-model') || DEFAULT_MODEL_ID,
  aiEnabled: localStorage.getItem('ai-enabled') === 'true',

  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  setSelectedModelId: (modelId) => {
    localStorage.setItem('ai-model', modelId);
    set({ selectedModelId: modelId });
  },
  setAIEnabled: (enabled) => {
    localStorage.setItem('ai-enabled', String(enabled));
    set({ aiEnabled: enabled });
  },
}));
