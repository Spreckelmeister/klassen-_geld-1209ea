// KI-Transparenz-Badge — kennzeichnet KI-generierte Inhalte

export function AIBadge({ confidence }: { confidence?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
      <span aria-hidden="true">🤖</span>
      <span>KI-Vorschlag</span>
      {confidence !== undefined && (
        <span className="text-violet-400">({Math.round(confidence * 100)}%)</span>
      )}
    </span>
  );
}
