// IServ Schüler-CSV Import
// IServ exportiert: Vorname, Nachname, Klasse, Import-ID (oder Account, E-Mail)

import Papa from 'papaparse';

export interface IServStudent {
  name: string;
  firstName: string;
  lastName: string;
  group: string;
  importId?: string;
}

export async function parseIServCSV(file: File): Promise<IServStudent[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const students: IServStudent[] = (results.data as Record<string, string>[])
          .filter((row) => row['Vorname'] || row['Nachname'] || row['Name'])
          .map((row) => {
            const firstName = (row['Vorname'] || '').trim();
            const lastName = (row['Nachname'] || row['Name'] || '').trim();
            return {
              name: `${firstName} ${lastName}`.trim(),
              firstName,
              lastName,
              group: (row['Klasse'] || row['Gruppe'] || '').trim(),
              importId: (row['Import-ID'] || row['ID'] || row['Account'] || '').trim() || undefined,
            };
          });
        resolve(students);
      },
      error: reject,
    });
  });
}
