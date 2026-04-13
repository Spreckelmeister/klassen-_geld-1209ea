// Auto-Erkennung des Import-Dateiformats

export type ImportFormat = 'iserv-csv' | 'schild-xml' | 'lusd-xml' | 'generic-csv' | 'unknown';

export async function detectImportFormat(file: File): Promise<ImportFormat> {
  const name = file.name.toLowerCase();

  // XML-Dateien
  if (name.endsWith('.xml')) {
    const text = await file.text();
    const lower = text.toLowerCase();

    if (lower.includes('schild') || lower.includes('internid') || lower.includes('schuelerid')) {
      return 'schild-xml';
    }
    if (lower.includes('lusd') || lower.includes('familienname') || lower.includes('lerngruppe')) {
      return 'lusd-xml';
    }
    // Generisches XML mit Schüler-Daten
    if (lower.includes('schueler') || lower.includes('vorname')) {
      return 'schild-xml'; // Default-XML-Format
    }
    return 'unknown';
  }

  // CSV-Dateien
  if (name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.tsv')) {
    const text = await file.slice(0, 2048).text(); // Nur Anfang lesen
    const lower = text.toLowerCase();

    // IServ-Erkennungsmerkmale
    if (
      lower.includes('import-id') ||
      lower.includes('account') ||
      (lower.includes('vorname') && lower.includes('nachname') && lower.includes('klasse'))
    ) {
      return 'iserv-csv';
    }

    return 'generic-csv';
  }

  return 'unknown';
}
