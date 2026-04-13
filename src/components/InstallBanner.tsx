// PWA Install-Hinweis Banner

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('install-dismissed') === 'true');
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Prüfe ob bereits als PWA installiert
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (installed || dismissed || !installPrompt) return null;

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstalled(true);
    }
    setInstallPrompt(null);
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('install-dismissed', 'true');
  }

  return (
    <div className="mx-auto max-w-lg px-4 mt-2">
      <div className="flex items-start gap-3 rounded-2xl bg-violet-50 border border-violet-200 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-violet-900">App installieren</p>
          <p className="text-xs text-violet-700 mt-0.5">
            Installieren Sie die Klassenkasse auf Ihrem Gerät. Funktioniert dann auch ohne Internet.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleInstall}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 transition-colors min-h-[32px]"
            >
              Jetzt installieren
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg px-3 py-1.5 text-xs text-violet-600 hover:bg-violet-100 transition-colors min-h-[32px]"
            >
              Später
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
