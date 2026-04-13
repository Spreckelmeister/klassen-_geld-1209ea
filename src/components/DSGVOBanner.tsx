// Kontextbezogene DSGVO-Hinweis-Banner

import { InfoBox } from './ui/InfoBox';

type DSGVOContext = 'setup' | 'students' | 'payment-status' | 'letter' | 'export';

const DSGVO_TEXTS: Record<DSGVOContext, string> = {
  setup: 'Alle Daten werden ausschließlich lokal auf Ihrem Gerät gespeichert. Es werden keine Daten an Server übertragen.',
  students: 'Der BuT-Status ist nur für den Kassenwart sichtbar. Erstellen Sie keine Listen mit offenen Zahlungen.',
  'payment-status': 'Zahlungsinformationen sind vertraulich. Erstellen Sie keine offenen Zahlungslisten und benennen Sie keine Nicht-Zahler.',
  letter: 'Dieser Brief enthält keine personenbezogenen Daten anderer Familien. Keine Bloßstellung von Nicht-Zahlern.',
  export: 'Exportierte Daten enthalten personenbezogene Informationen. Kontoauszüge nicht an Dritte weitergeben.',
};

export function DSGVOBanner({ context }: { context: DSGVOContext }) {
  return (
    <InfoBox variant="privacy">
      {DSGVO_TEXTS[context]}
    </InfoBox>
  );
}
