// SchILD-NRW XML Parser
// SchILD exportiert Schülerdaten als XML mit <Schueler>-Elementen

export interface SchildStudent {
  name: string;
  firstName: string;
  lastName: string;
  group: string;
  importId?: string;
}

export function parseSchildXML(xmlString: string): SchildStudent[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const errorNode = doc.querySelector('parsererror');
  if (errorNode) throw new Error('Ungültiges XML-Format');

  const students: SchildStudent[] = [];

  // SchILD-NRW Standard-Tags
  const schuelerNodes =
    doc.querySelectorAll('Schueler') ||
    doc.querySelectorAll('schueler') ||
    doc.querySelectorAll('Student');

  schuelerNodes.forEach((node) => {
    const firstName =
      getNodeText(node, 'Vorname') || getNodeText(node, 'vorname') || '';
    const lastName =
      getNodeText(node, 'Name') ||
      getNodeText(node, 'Nachname') ||
      getNodeText(node, 'nachname') ||
      '';
    const group =
      getNodeText(node, 'Klasse') ||
      getNodeText(node, 'klasse') ||
      getNodeText(node, 'Jahrgang') ||
      '';
    const importId =
      getNodeText(node, 'InternID') ||
      getNodeText(node, 'ID') ||
      getNodeText(node, 'SchuelerID') ||
      '';

    if (firstName || lastName) {
      students.push({
        name: `${firstName} ${lastName}`.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        group: group.trim(),
        importId: importId.trim() || undefined,
      });
    }
  });

  return students;
}

function getNodeText(parent: Element, tagName: string): string {
  const el = parent.querySelector(tagName);
  return el?.textContent?.trim() || '';
}

export async function parseSchildFile(file: File): Promise<SchildStudent[]> {
  const text = await file.text();
  return parseSchildXML(text);
}
