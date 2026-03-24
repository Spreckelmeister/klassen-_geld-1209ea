export function generateReminderText(
  familyName: string,
  className: string,
  amount: number,
  iban: string,
): string {
  const amountStr = amount.toFixed(2).replace('.', ',')
  return `Liebe Familie ${familyName},

für die Klassenkasse der Klasse ${className} steht noch ein Betrag von ${amountStr} € aus.

Bitte überweisen Sie den Betrag auf folgendes Konto:
IBAN: ${iban}
Verwendungszweck: Klassenkasse ${className} – ${familyName}

Vielen Dank für Ihre Unterstützung!

Hinweis: Die Einzahlung in die Klassenkasse ist freiwillig. Kein Kind wird bei Nichtzahlung von Aktivitäten ausgeschlossen.`
}

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'klassenkasse-salt')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const hash = await hashPin(pin)
  return hash === storedHash
}
