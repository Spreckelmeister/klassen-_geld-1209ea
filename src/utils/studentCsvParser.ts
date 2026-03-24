/**
 * Parses student list CSVs from common German school systems
 * (IServ, WebUntis, Excel export, or simple name lists).
 */

interface ParsedStudent {
  name: string
  butStatus: boolean
}

const HEADER_KEYWORDS = [
  'name',
  'vorname',
  'nachname',
  'klasse',
  'schüler',
  'schueler',
  'schülerin',
  'schuelerin',
  'first',
  'last',
  'class',
  'firstname',
  'lastname',
  'familienname',
  'rufname',
]

function isHeaderRow(row: string): boolean {
  const lower = row.toLowerCase().trim()
  return HEADER_KEYWORDS.some((kw) => lower.includes(kw))
}

function detectDelimiter(text: string): string {
  const firstLines = text.split(/\r?\n/).slice(0, 5).join('\n')
  const semicolons = (firstLines.match(/;/g) || []).length
  const commas = (firstLines.match(/,/g) || []).length
  const tabs = (firstLines.match(/\t/g) || []).length

  if (tabs > semicolons && tabs > commas) return '\t'
  if (semicolons > commas) return ';'
  if (commas > 0) return ','
  return '' // single column (one name per line)
}

function findNameColumns(headers: string[]): { firstNameIdx: number; lastNameIdx: number } {
  const lower = headers.map((h) => h.toLowerCase().trim())

  const lastNameAliases = ['nachname', 'familienname', 'lastname', 'last_name', 'last name', 'name']
  const firstNameAliases = ['vorname', 'rufname', 'firstname', 'first_name', 'first name']

  let lastNameIdx = -1
  let firstNameIdx = -1

  for (const alias of firstNameAliases) {
    const idx = lower.indexOf(alias)
    if (idx !== -1) {
      firstNameIdx = idx
      break
    }
  }

  for (const alias of lastNameAliases) {
    const idx = lower.indexOf(alias)
    // Don't pick the same column as firstName for "name"
    if (idx !== -1 && idx !== firstNameIdx) {
      lastNameIdx = idx
      break
    }
  }

  // If we only found "name" and no firstName, treat it as full name
  if (lastNameIdx === -1 && firstNameIdx === -1) {
    const nameIdx = lower.indexOf('name')
    if (nameIdx !== -1) {
      lastNameIdx = nameIdx
    }
  }

  return { firstNameIdx, lastNameIdx }
}

export function parseStudentCsv(raw: string): ParsedStudent[] {
  // Strip BOM
  let text = raw.replace(/^\uFEFF/, '')

  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const lines = text.split('\n').filter((l) => l.trim() !== '')
  if (lines.length === 0) return []

  const delimiter = detectDelimiter(text)
  const results: ParsedStudent[] = []

  // No delimiter detected: simple name list (one name per line)
  if (delimiter === '') {
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (isHeaderRow(trimmed)) continue
      results.push({ name: trimmed, butStatus: false })
    }
    return results
  }

  // Multi-column CSV
  const rows = lines.map((l) => l.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, '')))

  let startIdx = 0
  let firstNameIdx = -1
  let lastNameIdx = -1

  // Check if first row is a header
  if (rows.length > 0 && isHeaderRow(lines[0]!)) {
    const cols = findNameColumns(rows[0]!)
    firstNameIdx = cols.firstNameIdx
    lastNameIdx = cols.lastNameIdx
    startIdx = 1
  }

  // If no header detected or columns not found, use heuristics
  if (firstNameIdx === -1 && lastNameIdx === -1) {
    // Assume first two columns are Nachname;Vorname or Name,Vorname
    if (rows[0] && rows[0].length >= 2) {
      lastNameIdx = 0
      firstNameIdx = 1
    } else if (rows[0] && rows[0].length === 1) {
      lastNameIdx = 0
    }
  }

  for (let i = startIdx; i < rows.length; i++) {
    const cols = rows[i]
    if (!cols || cols.every((c) => !c)) continue

    let name = ''

    if (firstNameIdx !== -1 && lastNameIdx !== -1) {
      const firstName = cols[firstNameIdx] || ''
      const lastName = cols[lastNameIdx] || ''
      name = `${firstName} ${lastName}`.trim()
    } else if (lastNameIdx !== -1) {
      name = cols[lastNameIdx] || ''
    } else if (cols.length >= 1) {
      name = cols[0] || ''
    }

    if (name) {
      results.push({ name, butStatus: false })
    }
  }

  return results
}
