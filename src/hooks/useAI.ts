// Hook für KI-Engine Lifecycle + Inference

import { useCallback } from 'react';
import { useAIStore } from '@/stores/useAIStore';
import { initAIEngine, disposeEngine, getEngine, isWebGPUSupported } from '@/ai/engine';

export function useAI() {
  const status = useAIStore((s) => s.status);
  const progress = useAIStore((s) => s.progress);
  const error = useAIStore((s) => s.error);
  const selectedModelId = useAIStore((s) => s.selectedModelId);
  const aiEnabled = useAIStore((s) => s.aiEnabled);
  const setStatus = useAIStore((s) => s.setStatus);
  const setProgress = useAIStore((s) => s.setProgress);
  const setError = useAIStore((s) => s.setError);

  const loadModel = useCallback(async () => {
    if (!isWebGPUSupported()) {
      setStatus('unsupported');
      setError('WebGPU wird von diesem Browser nicht unterstützt. Die KI-Funktionen sind deaktiviert, aber alle anderen Features funktionieren normal.');
      return;
    }

    try {
      setStatus('loading');
      setError(null);
      setProgress(0);
      console.log('[KI] Lade Modell:', selectedModelId);
      await initAIEngine(selectedModelId, (p) => {
        console.log('[KI] Fortschritt:', Math.round(p * 100) + '%');
        setProgress(p);
      });
      console.log('[KI] Modell geladen!');
      setStatus('ready');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      console.error('[KI] Fehler:', msg, err);
      if (msg === 'WEBGPU_NOT_SUPPORTED' || msg.includes('WebGPU')) {
        setStatus('unsupported');
        setError('WebGPU wird von diesem Browser nicht unterstützt. Bitte Chrome 113+ oder Edge 113+ verwenden.');
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
        setStatus('error');
        setError('Netzwerkfehler beim Herunterladen. Bitte Internetverbindung prüfen.');
      } else {
        setStatus('error');
        setError(msg);
      }
    }
  }, [selectedModelId, setStatus, setProgress, setError]);

  const unloadModel = useCallback(async () => {
    await disposeEngine();
    setStatus('idle');
    setProgress(0);
  }, [setStatus, setProgress]);

  const chat = useCallback(
    async (systemPrompt: string, userMessage: string): Promise<string | null> => {
      const engine = getEngine();
      if (!engine) return null;

      try {
        const response = await engine.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.1,
          max_tokens: 500,
        });
        return response.choices[0]?.message?.content || null;
      } catch (err) {
        console.warn('KI-Anfrage fehlgeschlagen:', err);
        return null;
      }
    },
    [],
  );

  return {
    status,
    progress,
    error,
    aiEnabled,
    isReady: status === 'ready',
    loadModel,
    unloadModel,
    chat,
  };
}
