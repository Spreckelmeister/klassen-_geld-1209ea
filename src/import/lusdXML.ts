// LUSD Hessen XML Parser
// LUSD (Lehrer- und Schüler-Datenbank) exportiert Schülerdaten als XML

export interface LusdStudent {
  name: string;
  firstName: string;
  lastName: string;
  group: string;
  importId?: string;
}

export function parseLusdXML(xmlString: string): LusdStudent[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const errorNode = doc.querySelector('parsererror');
  if (errorNode) throw new Error('Ungültiges XML-Format');

  const students: LusdStudent[] = [];

  // LUSD-Hessen Tags
  const schuelerNodes =
    doc.querySelectorAll('Schueler') ||
    doc.querySelectorAll('schueler') ||
    doc.querySelectorAll('Lernende');

  schuelerNodes.forEach((node) => {
    const firstName =
      getNodeText(node, 'Vorname') || getNodeText(node, 'Rufname') || '';
    const lastName =
      getNodeText(node, 'Familienname') ||
      getNodeText(node, 'Nachname') ||
      getNodeText(node, 'Name') ||
      '';
    const group =
      getNodeText(node, 'Klasse') ||
      getNodeText(node, 'Lerngruppe') ||
      getNodeText(node, 'Organisationseinheit') ||
      '';
    const importId =
      getNodeText(node, 'SchuelerID') ||
      getNodeText(node, 'LUSD_ID') ||
      getNodeText(node, 'ID') ||
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

export async function parseLusdFile(file: File): Promise<LusdStudent[]> {
  const text = await file.text();
  return parseLusdXML(text);
}
