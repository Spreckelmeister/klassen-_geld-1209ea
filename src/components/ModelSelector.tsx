// Modell-Auswahl Komponente für die Einstellungen

import { AI_MODELS } from '@/ai/models';
import { useAIStore } from '@/stores/useAIStore';

export function ModelSelector() {
  const selectedModelId = useAIStore((s) => s.selectedModelId);
  const setSelectedModelId = useAIStore((s) => s.setSelectedModelId);
  const status = useAIStore((s) => s.status);

  return (
    <div className="flex flex-col gap-2">
      {AI_MODELS.map((model) => {
        const isSelected = model.id === selectedModelId;
        const isLoading = status === 'loading' && isSelected;

        return (
          <button
            key={model.id}
            onClick={() => setSelectedModelId(model.id)}
            disabled={isLoading}
            className={`w-full text-left rounded-xl border p-3 transition-colors ${
              isSelected
                ? 'border-violet-300 bg-violet-50'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{model.name}</span>
              <span className="text-xs text-stone-400">{model.size}</span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{model.description}</p>
            {isSelected && (
              <div className="mt-1.5 flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-violet-500" />
                <span className="text-xs text-violet-600 font-medium">Ausgewählt</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
