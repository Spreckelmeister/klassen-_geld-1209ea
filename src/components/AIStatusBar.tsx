// KI-Status-Anzeige im Header

import { useAIStore } from '@/stores/useAIStore';
import { getModelInfo } from '@/ai/models';

export function AIStatusBar() {
  const status = useAIStore((s) => s.status);
  const progress = useAIStore((s) => s.progress);
  const selectedModelId = useAIStore((s) => s.selectedModelId);
  const aiEnabled = useAIStore((s) => s.aiEnabled);

  if (!aiEnabled) return null;

  const model = getModelInfo(selectedModelId);
  const modelName = model?.name || 'KI';

  return (
    <div className="flex items-center gap-2 text-xs">
      {status === 'loading' && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 rounded-full bg-stone-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="text-violet-600">{Math.round(progress * 100)}%</span>
        </div>
      )}
      {status === 'ready' && (
        <span className="inline-flex items-center gap-1 text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          {modelName}
        </span>
      )}
      {status === 'unsupported' && (
        <span className="text-stone-400" title="WebGPU nicht unterstützt">
          KI nicht verfügbar
        </span>
      )}
      {status === 'error' && (
        <span className="text-rose-500">KI-Fehler</span>
      )}
    </div>
  );
}
