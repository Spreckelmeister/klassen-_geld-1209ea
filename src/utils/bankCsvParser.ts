export interface ParsedTransaction {
  date: Date
  amount: number
  senderName: string
  reference: string
  rawLine: string
}

export type BankFormat =
  | 'sparkasse'
  | 'dkb'
  | 'vrbank'
  | 'ing'
  | 'commerzbank'
  | 'n26'
  | 'postbank'
  | 'generic'

const BANK_LABELS: Record<BankFormat, string> = {
  sparkasse: 'Sparkasse',
  dkb: 'DKB',
  vrbank: 'VR-Bank / Volksbank',
  ing: 'ING',
  commerzbank: 'Commerzbank',
  n26: 'N26',
  postbank: 'Postbank',
  generic: 'Andere / Generisch',
}

export function getBankLabel(format: BankFormat): string {
  return BANK_LABELS[format]
}

export const BANK_OPTIONS: { value: BankFormat; label: string }[] = Object.entries(BANK_LABELS).map(
  ([value, label]) => ({ value: value as BankFormat, label }),
)

/**
 * Strip UTF-8 BOM if present
 */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

/**
 * Parse a German-format number: "1.234,56" -> 1234.56
 */
function parseGermanNumber(value: string): number {
  const cleaned = value.trim().replace(/\./g, '').replace(',', '.')
  return parseFloat(cleaned)
}

/**
 * Parse German date formats: DD.MM.YYYY or DD.MM.YY
 */
function parseGermanDate(value: string): Date {
  const trimmed = value.trim().replace(/"/g, '')
  const parts = trimmed.split('.')
  if (parts.length < 3) return new Date(NaN)

  const day = parseInt(parts[0]!, 10)
  const month = parseInt(parts[1]!, 10) - 1
  let year = parseInt(parts[2]!, 10)

  if (year < 100) {
    year += year < 50 ? 2000 : 1900
  }

  return new Date(year, month, day)
}

/**
 * Parse a single CSV line respecting quoted fields (semicolon-separated)
 */
function parseCsvLine(line: string, separator = ';'): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === separator && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current.trim())

  return fields.map((f) => f.replace(/^"|"$/g, ''))
}

/**
 * Find column index by testing multiple possible header names (case-insensitive)
 */
function findColumn(headers: string[], ...candidates: string[]): number {
  const lowerHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-zäöüß0-9]/g, ''))
  for (const candidate of candidates) {
    const needle = candidate.toLowerCase().replace(/[^a-zäöüß0-9]/g, '')
    const idx = lowerHeaders.findIndex((h) => h.includes(needle))
    if (idx !== -1) return idx
  }
  return -1
}

interface ColumnMap {
  date: number
  amount: number
  reference: number
  sender: number
}

function detectColumns(headers: string[], format: BankFormat): ColumnMap {
  switch (format) {
    case 'sparkasse':
      return {
        date: findColumn(headers, 'Buchungstag'),
        amount: findColumn(headers, 'Betrag'),
        reference: findColumn(headers, 'Verwendungszweck'),
        sender: findColumn(headers, 'Beguenstigter', 'Zahlungspflichtiger'),
      }
    case 'dkb':
      return {
        date: findColumn(headers, 'Buchungsdatum'),
        amount: findColumn(headers, 'Betrag'),
        reference: findColumn(headers, 'Verwendungszweck'),
        sender: findColumn(headers, 'Zahlungspflichtige'),
      }
    case 'vrbank':
      return {
        date: findColumn(headers, 'Buchungstag'),
        amount: findColumn(headers, 'Betrag'),
        reference: findColumn(headers, 'Verwendungszweck'),
        sender: findColumn(headers, 'Name Zahlungsbeteiligter'),
      }
    case 'ing':
      return {
        date: findColumn(headers, 'Buchung'),
        amount: findColumn(headers, 'Betrag'),
        reference: findColumn(headers, 'Verwendungszweck'),
        sender: findColumn(headers, 'Auftraggeber', 'Empfänger'),
      }
    case 'commerzbank':
    case 'n26':
    case 'postbank':
    case 'generic':
    default:
      return {
        date: findColumn(headers, 'Buchungstag', 'Buchungsdatum', 'Buchung', 'Datum', 'Valuta'),
        amount: findColumn(headers, 'Betrag', 'Umsatz'),
        reference: findColumn(headers, 'Verwendungszweck', 'Buchungstext'),
        sender: findColumn(
          headers,
          'Auftraggeber',
          'Empfänger',
          'Name',
          'Beguenstigter',
          'Zahlungspflichtiger',
          'Zahlungsbeteiligter',
        ),
      }
  }
}

/**
 * Some bank CSVs have metadata rows before the actual header.
 * Skip lines until we find one that looks like a CSV header.
 */
function findHeaderLine(lines: string[]): number {
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const lower = lines[i]!.toLowerCase()
    if (
      lower.includes('buchung') ||
      lower.includes('datum') ||
      lower.includes('betrag') ||
      lower.includes('verwendungszweck')
    ) {
      return i
    }
  }
  return 0
}

export function parseBankCsv(csvText: string, format: BankFormat): ParsedTransaction[] {
  const cleaned = stripBom(csvText)
  const allLines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0)

  if (allLines.length < 2) return []

  const headerIdx = findHeaderLine(allLines)
  const headerLine = allLines[headerIdx]!
  const dataLines = allLines.slice(headerIdx + 1)

  const headers = parseCsvLine(headerLine)
  const columns = detectColumns(headers, format)

  // Validate that we found at least date and amount
  if (columns.date === -1 || columns.amount === -1) {
    throw new Error(
      'CSV-Format nicht erkannt. Bitte pruefen Sie, ob die richtige Bank ausgewaehlt ist.',
    )
  }

  const results: ParsedTransaction[] = []

  for (const line of dataLines) {
    if (!line.trim()) continue

    const fields = parseCsvLine(line)
    if (fields.length <= Math.max(columns.date, columns.amount)) continue

    const dateStr = fields[columns.date] ?? ''
    const amountStr = fields[columns.amount] ?? ''
    const reference = columns.reference !== -1 ? (fields[columns.reference] ?? '') : ''
    const sender = columns.sender !== -1 ? (fields[columns.sender] ?? '') : ''

    const date = parseGermanDate(dateStr)
    const amount = parseGermanNumber(amountStr)

    // Skip invalid rows
    if (isNaN(date.getTime()) || isNaN(amount)) continue

    // Only include incoming payments (positive amounts)
    if (amount <= 0) continue

    results.push({
      date,
      amount,
      senderName: sender,
      reference,
      rawLine: line,
    })
  }

  return results
}
