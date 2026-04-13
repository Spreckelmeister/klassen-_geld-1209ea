// 15+ Elternbrief-Vorlagen als JSON

export interface BriefTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
}

export const BRIEF_TEMPLATES: BriefTemplate[] = [
  { id: 'ersteinzahlung', name: 'Ersteinzahlung', type: 'ersteinzahlung', description: 'Erste Einzahlung zu Schuljahresbeginn' },
  { id: 'nachzahlung', name: 'Nachzahlung', type: 'nachzahlung', description: 'Zusätzlicher Betrag für geplante Ausgaben' },
  { id: 'ausflug', name: 'Ausflug', type: 'ausflug', description: 'Beitrag für einen Klassenausflug' },
  { id: 'erinnerung', name: 'Zahlungserinnerung', type: 'erinnerung', description: 'Freundliche Erinnerung an ausstehende Zahlung' },
  { id: 'jahresabschluss', name: 'Jahresabschluss', type: 'jahresabschluss', description: 'Jahresabrechnung mit Kassenstand' },
  { id: 'kuchenverkauf', name: 'Kuchenverkauf', type: 'kuchenverkauf', description: 'Ankündigung oder Einladung zum Kuchenverkauf' },
  { id: 'abschlussfahrt', name: 'Abschlussfahrt', type: 'abschlussfahrt', description: 'Beitrag für die Abschlussfahrt' },
  { id: 'but_hinweis', name: 'BuT-Hinweis', type: 'but_hinweis', description: 'Info zu Bildung-und-Teilhabe-Leistungen' },
  { id: 'klassenfest', name: 'Klassenfest', type: 'klassenfest', description: 'Beitrag für ein Klassenfest' },
  { id: 'weihnachten', name: 'Weihnachtsfeier', type: 'weihnachten', description: 'Beitrag für die Weihnachtsfeier' },
  { id: 'bastelmaterial', name: 'Bastelmaterial', type: 'bastelmaterial', description: 'Beitrag für gemeinsames Bastelmaterial' },
  { id: 'schulstart', name: 'Schulstart-Info', type: 'schulstart', description: 'Allgemeine Info zu Beginn des Schuljahres' },
  { id: 'danksagung', name: 'Danksagung', type: 'danksagung', description: 'Dank an Eltern für Einzahlungen/Mithilfe' },
  { id: 'kassenuebergabe', name: 'Kassenübergabe', type: 'kassenuebergabe', description: 'Info über Kassenwart-Wechsel' },
  { id: 'kita_beitrag', name: 'Kita-Beitrag', type: 'kita_beitrag', description: 'Beitrag für Kindergarten-Aktivitäten' },
  { id: 'spendenaufruf', name: 'Spendenaufruf', type: 'spendenaufruf', description: 'Aufruf für zusätzliche freiwillige Spende' },
];
