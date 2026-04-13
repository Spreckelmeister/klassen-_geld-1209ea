// AI-Act Dokumentationsseite

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function AIGovernance() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">KI-Transparenz & AI Act</h1>

      <Card>
        <h2 className="text-sm font-semibold mb-2">1. Eingesetztes KI-Modell</h2>
        <p className="text-sm text-stone-600">
          Standardmodell: <strong>Qwen 2.5 0.5B Instruct</strong> von Alibaba (Apache 2.0 Lizenz).
          Das Modell kann in den Einstellungen gewechselt werden. Alle verfügbaren Modelle
          sind Open-Source und laufen lokal im Browser.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">2. Verarbeitungsort</h2>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="income">Lokal</Badge>
        </div>
        <p className="text-sm text-stone-600">
          Die KI läuft ausschließlich lokal im Browser über WebGPU/WebLLM.
          Keine Daten werden an Cloud-Server, APIs oder Dritte übertragen.
          Das KI-Modell wird einmalig heruntergeladen und im Browser-Cache gespeichert.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">3. Einsatzzweck</h2>
        <ul className="text-sm text-stone-600 space-y-1 list-disc list-inside">
          <li>Textklassifikation: Zuordnung von Bankbuchungen zu Schüler:innen</li>
          <li>Kategorisierung: Automatische Einordnung von Ausgaben</li>
          <li>Textgenerierung: Elternbriefe nach Vorlage erstellen</li>
          <li>Übersetzung: Elternbriefe in andere Sprachen übersetzen</li>
          <li>Compliance: Prüfung der §22 UStG Konformität</li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">4. Was die KI NICHT tut</h2>
        <ul className="text-sm text-stone-600 space-y-1 list-disc list-inside">
          <li>Keine Bewertung oder Beurteilung von Schüler:innen</li>
          <li>Keine Emotionserkennung</li>
          <li>Kein Social Scoring oder Profiling</li>
          <li>Keine automatischen Entscheidungen über Personen</li>
          <li>Keine Gesichtserkennung oder biometrische Analyse</li>
          <li>Kein Training mit Nutzerdaten</li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">5. Risikoeinstufung (AI Act)</h2>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="income">Minimales Risiko</Badge>
        </div>
        <p className="text-sm text-stone-600">
          KlassenKasse AI ist kein Hochrisiko-System nach AI Act Annex III.
          Es handelt sich um ein Assistenzsystem für Textklassifikation und -generierung
          ohne Auswirkung auf Grundrechte, Bildungschancen oder soziale Leistungen.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">6. Human-in-the-Loop</h2>
        <p className="text-sm text-stone-600">
          <strong>Alle KI-Vorschläge müssen vom Kassenwart bestätigt werden.</strong>{' '}
          Die KI trifft keine eigenständigen Entscheidungen. Jeder Vorschlag ist mit einem{' '}
          <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full border border-violet-200">
            🤖 KI-Vorschlag
          </span>{' '}
          Badge gekennzeichnet und kann bearbeitet oder abgelehnt werden.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">7. Datenverarbeitung</h2>
        <ul className="text-sm text-stone-600 space-y-1 list-disc list-inside">
          <li>Keine Daten verlassen das Gerät</li>
          <li>Kein Cloud-basiertes Training mit Nutzerdaten</li>
          <li>Modell-Gewichte werden nur von HuggingFace geladen (einmalig)</li>
          <li>Alle Verarbeitung findet im Browser-Tab statt</li>
          <li>Bei Schließen des Browsers werden KI-Modelle aus dem RAM entladen</li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">8. Grenzen der KI</h2>
        <p className="text-sm text-stone-600">
          Die KI kann Fehler machen, besonders bei:
        </p>
        <ul className="text-sm text-stone-600 space-y-1 list-disc list-inside mt-1">
          <li>Ungewöhnlichen oder fremdsprachigen Namen</li>
          <li>Abkürzungen im Verwendungszweck</li>
          <li>Mehrdeutigen Beschreibungen</li>
          <li>Sehr kurzen oder kryptischen Texten</li>
        </ul>
        <p className="text-sm text-stone-600 mt-2">
          Deshalb ist die manuelle Bestätigung aller Vorschläge obligatorisch.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">9. Kontakt & Fehlerberichte</h2>
        <p className="text-sm text-stone-600">
          Fehler und Verbesserungsvorschläge können über GitHub Issues gemeldet werden.
          KlassenKasse AI ist ein Open-Source-Projekt unter MIT-Lizenz.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">10. Letzte Aktualisierung</h2>
        <p className="text-sm text-stone-600">
          Stand: April 2026 · Version 2.0.0
        </p>
      </Card>
    </div>
  );
}
