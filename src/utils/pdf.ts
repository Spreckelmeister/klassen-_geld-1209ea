import { jsPDF } from 'jspdf'
import type { ClassInfo, Transaction, Student, LetterTemplate, AuditRecord } from '@/types'
import { formatCurrency, formatDate } from './format'
import { generateEPCQRCode } from './qrcode'

const MARGIN = 20
const PAGE_WIDTH = 210
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN

function addHeader(doc: jsPDF, classInfo: ClassInfo, y: number): number {
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Klassenkasse', MARGIN, y)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  doc.text(`Klasse ${classInfo.className} · ${classInfo.schoolYear}`, MARGIN, y + 7)
  doc.text(`Kassenwart: ${classInfo.treasurerName}`, MARGIN, y + 12)
  doc.setTextColor(0)
  doc.setDrawColor(200)
  doc.line(MARGIN, y + 16, PAGE_WIDTH - MARGIN, y + 16)
  return y + 22
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Seite ${i} von ${pageCount} · Erstellt am ${formatDate(new Date())} · Klassenkasse-App`,
      PAGE_WIDTH / 2,
      290,
      { align: 'center' },
    )
    doc.setTextColor(0)
  }
}

// --- Parent Letter ---

const LETTER_TEMPLATES: Record<LetterTemplate, { title: string; intro: string }> = {
  first: {
    title: 'Einladung zur Einzahlung in die Klassenkasse',
    intro:
      'zu Beginn des Schuljahres möchten wir Sie bitten, den Beitrag für die Klassenkasse zu überweisen. Aus der Klassenkasse werden im Laufe des Schuljahres verschiedene Ausgaben wie Kopiergeld, Bastelmaterial, kleine Geschenke und Ausflüge finanziert.',
  },
  additional: {
    title: 'Zusatzbeitrag für die Klassenkasse',
    intro:
      'im Laufe des Schuljahres haben sich zusätzliche Ausgaben ergeben, die über den ursprünglichen Beitrag hinausgehen. Wir bitten Sie daher um einen Zusatzbeitrag.',
  },
  trip: {
    title: 'Beitrag für den Klassenausflug',
    intro:
      'wir planen einen Klassenausflug und bitten Sie, den Kostenbeitrag auf das Klassenkassen-Konto zu überweisen.',
  },
  yearEnd: {
    title: 'Jahresabschluss der Klassenkasse',
    intro:
      'das Schuljahr neigt sich dem Ende zu. Anbei finden Sie die Übersicht über die Klassenkasse.',
  },
}

export async function generateParentLetterPDF(
  classInfo: ClassInfo,
  template: LetterTemplate,
  amount: number,
  childName?: string,
): Promise<jsPDF> {
  const doc = new jsPDF()
  const tmpl = LETTER_TEMPLATES[template]

  let y = MARGIN

  // Header
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text(`Klasse ${classInfo.className} · ${classInfo.schoolYear}`, MARGIN, y)
  doc.text(formatDate(new Date()), PAGE_WIDTH - MARGIN, y, { align: 'right' })
  y += 12

  doc.setFontSize(8)
  doc.text(`Kassenwart: ${classInfo.treasurerName}`, MARGIN, y)
  y += 15

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text(tmpl.title, MARGIN, y)
  y += 10

  // Body
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const greeting = 'Liebe Eltern und Erziehungsberechtigte,'
  doc.text(greeting, MARGIN, y)
  y += 8

  const bodyLines = doc.splitTextToSize(tmpl.intro, CONTENT_WIDTH)
  doc.text(bodyLines, MARGIN, y)
  y += bodyLines.length * 5 + 8

  // Amount box
  if (amount > 0) {
    doc.setFillColor(249, 250, 249)
    doc.setDrawColor(200)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 30, 3, 3, 'FD')
    y += 8
    doc.setFontSize(10)
    doc.text('Überweisungsdaten:', MARGIN + 5, y)
    y += 6
    doc.setFont('helvetica', 'bold')
    doc.text(`Betrag: ${formatCurrency(amount)}`, MARGIN + 5, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    doc.setFontSize(9)
    doc.text(`IBAN: ${classInfo.iban}`, MARGIN + 5, y)
    y += 5
    const ref = childName
      ? `Klassenkasse ${classInfo.className} – ${childName}`
      : `Klassenkasse ${classInfo.className} – [Name des Kindes]`
    doc.text(`Verwendungszweck: ${ref}`, MARGIN + 5, y)
    y += 12
  }

  // QR Code
  if (amount > 0 && classInfo.iban) {
    try {
      const qrDataUrl = await generateEPCQRCode({
        name: classInfo.treasurerName,
        iban: classInfo.iban,
        amount,
        reference: childName
          ? `Klassenkasse ${classInfo.className} – ${childName}`
          : `Klassenkasse ${classInfo.className}`,
        bic: classInfo.bic,
      })

      y += 5
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('QR-Code für Ihre Banking-App (GiroCode):', MARGIN, y)
      y += 3
      doc.addImage(qrDataUrl, 'PNG', MARGIN, y, 40, 40)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(
        'Scannen Sie diesen Code mit Ihrer Banking-App,\num die Überweisung automatisch auszufüllen.',
        MARGIN + 45,
        y + 15,
      )
      doc.setTextColor(0)
      y += 48
    } catch {
      y += 5
    }
  }

  // Voluntariness notice
  y += 5
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.setFont('helvetica', 'italic')
  const notice = doc.splitTextToSize(
    'Hinweis: Die Einzahlung in die Klassenkasse ist freiwillig. Kein Kind wird bei Nichtzahlung von schulischen Aktivitäten ausgeschlossen. Familien mit Anspruch auf Leistungen aus dem Bildungs- und Teilhabepaket (BuT) können die Kosten für Ausflüge und Klassenfahrten über das Jobcenter oder Sozialamt erstatten lassen.',
    CONTENT_WIDTH,
  )
  doc.text(notice, MARGIN, y)
  doc.setTextColor(0)
  doc.setFont('helvetica', 'normal')

  y += notice.length * 4 + 10
  doc.setFontSize(10)
  doc.text('Mit freundlichen Grüßen', MARGIN, y)
  y += 6
  doc.text(classInfo.treasurerName, MARGIN, y)
  y += 4
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text(`Kassenwart der Klasse ${classInfo.className}`, MARGIN, y)

  // DSGVO footer
  doc.setFontSize(7)
  doc.setTextColor(150)
  doc.text(
    'Dieses Schreiben enthält keine personenbezogenen Daten Dritter und ist DSGVO-konform.',
    MARGIN,
    280,
  )

  return doc
}

// --- Annual Report PDF ---

export function generateAnnualReportPDF(
  classInfo: ClassInfo,
  transactions: Transaction[],
  students: Student[],
  latestAudit?: AuditRecord,
): jsPDF {
  const doc = new jsPDF()
  const studentMap = new Map(students.map((s) => [s.id, s.name]))
  const active = transactions.filter((t) => !t.isStorno)

  // Cover page
  let y = 60
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Kassenbericht', PAGE_WIDTH / 2, y, { align: 'center' })
  y += 12
  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.text(`Klasse ${classInfo.className}`, PAGE_WIDTH / 2, y, { align: 'center' })
  y += 8
  doc.setFontSize(12)
  doc.text(`Schuljahr ${classInfo.schoolYear}`, PAGE_WIDTH / 2, y, { align: 'center' })
  y += 20
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text(`Kassenwart: ${classInfo.treasurerName}`, PAGE_WIDTH / 2, y, { align: 'center' })
  y += 6
  doc.text(`Kassenprüfer:in: ${classInfo.auditorName}`, PAGE_WIDTH / 2, y, { align: 'center' })
  y += 6
  doc.text(`Erstellt am: ${formatDate(new Date())}`, PAGE_WIDTH / 2, y, { align: 'center' })
  doc.setTextColor(0)

  // Summary page
  doc.addPage()
  y = addHeader(doc, classInfo, MARGIN)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Zusammenfassung', MARGIN, y)
  y += 10

  const totalIncome = active.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = active.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  const summaryData = [
    ['Gesamteinnahmen', formatCurrency(totalIncome)],
    ['Gesamtausgaben', formatCurrency(totalExpense)],
    ['Kontostand', formatCurrency(balance)],
    ['Anzahl Buchungen', String(active.length)],
    ['Anzahl Schüler:innen', String(students.length)],
  ]

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  for (const [label, value] of summaryData) {
    doc.text(label!, MARGIN, y)
    doc.setFont('helvetica', 'bold')
    doc.text(value!, MARGIN + 80, y)
    doc.setFont('helvetica', 'normal')
    y += 7
  }

  // Category breakdown
  y += 10
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Ausgaben nach Kategorie', MARGIN, y)
  y += 8

  const categoryTotals = new Map<string, number>()
  for (const t of active.filter((t) => t.type === 'expense')) {
    categoryTotals.set(t.category, (categoryTotals.get(t.category) ?? 0) + t.amount)
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  for (const [cat, total] of [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])) {
    doc.text(cat, MARGIN, y)
    doc.text(formatCurrency(total), MARGIN + 80, y)
    y += 6
  }

  // Transaction list
  doc.addPage()
  y = addHeader(doc, classInfo, MARGIN)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Buchungsliste', MARGIN, y)
  y += 8

  // Table header
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(240, 240, 240)
  doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 7, 'F')
  doc.text('Datum', MARGIN + 2, y)
  doc.text('Typ', MARGIN + 28, y)
  doc.text('Kategorie', MARGIN + 48, y)
  doc.text('Beschreibung', MARGIN + 80, y)
  doc.text('Betrag', MARGIN + CONTENT_WIDTH - 2, y, { align: 'right' })
  y += 6

  doc.setFont('helvetica', 'normal')
  const sorted = [...active].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  for (const t of sorted) {
    if (y > 270) {
      doc.addPage()
      y = addHeader(doc, classInfo, MARGIN)
      y += 4
    }
    doc.text(formatDate(t.date), MARGIN + 2, y)
    doc.text(t.type === 'income' ? 'E' : 'A', MARGIN + 28, y)
    doc.text(t.category.slice(0, 15), MARGIN + 48, y)
    const desc = t.studentId
      ? `${(t.description || '').slice(0, 25)} (${(studentMap.get(t.studentId) ?? '').slice(0, 10)})`
      : (t.description || '').slice(0, 35)
    doc.text(desc, MARGIN + 80, y)
    const prefix = t.type === 'income' ? '+' : '-'
    doc.text(`${prefix}${formatCurrency(t.amount)}`, MARGIN + CONTENT_WIDTH - 2, y, {
      align: 'right',
    })
    y += 5
  }

  // Audit stamp
  if (latestAudit) {
    if (y > 240) {
      doc.addPage()
      y = addHeader(doc, classInfo, MARGIN)
    }
    y += 10
    doc.setDrawColor(5, 150, 105) // brand-income green
    doc.setFillColor(240, 253, 244)
    doc.roundedRect(MARGIN, y - 4, CONTENT_WIDTH, 28, 3, 3, 'FD')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(5, 150, 105)
    doc.text('Kassenprüfung bestätigt', MARGIN + 5, y + 2)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60)
    doc.text(`Prüfer:in: ${latestAudit.auditorName}`, MARGIN + 5, y + 8)
    doc.text(`Datum: ${formatDate(latestAudit.date)}`, MARGIN + 5, y + 13)
    doc.text(`Hash: ${latestAudit.transactionHash.slice(0, 32)}...`, MARGIN + 5, y + 18)
    doc.setTextColor(0)
  }

  addFooter(doc)
  return doc
}
