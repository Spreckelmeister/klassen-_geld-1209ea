import { useState } from 'react'
import { InfoBox } from './ui/InfoBox'

export function PrivacyBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('privacyBannerDismissed') === 'true',
  )

  if (dismissed) return null

  return (
    <div className="mb-4">
      <InfoBox variant="privacy">
        <div className="flex items-start justify-between gap-3">
          <span>
            Alle Daten werden ausschließlich auf Ihrem Gerät gespeichert. Es werden keine
            Daten an Server übertragen. Diese App ist DSGVO-konform.
          </span>
          <button
            onClick={() => {
              localStorage.setItem('privacyBannerDismissed', 'true')
              setDismissed(true)
            }}
            className="shrink-0 text-sky-600 hover:text-sky-800 font-medium text-xs min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Hinweis schließen"
          >
            OK
          </button>
        </div>
      </InfoBox>
    </div>
  )
}
