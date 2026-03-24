import QRCode from 'qrcode'

/**
 * EPC QR Code (GiroCode) generator according to EPC069-12 standard.
 * Compatible with all German banking apps.
 */
export interface EPCData {
  bic?: string
  name: string // Beneficiary name (max 70 chars)
  iban: string
  amount: number
  reference: string // Unstructured reference (max 140 chars)
}

function buildEPCPayload(data: EPCData): string {
  const lines = [
    'BCD',                              // Service Tag
    '002',                              // Version
    '1',                                // Character set (UTF-8)
    'SCT',                              // Identification code
    data.bic || '',                     // BIC (optional since 2014)
    data.name.slice(0, 70),             // Beneficiary Name
    data.iban.replace(/\s/g, ''),       // IBAN
    `EUR${data.amount.toFixed(2)}`,     // Amount
    '',                                 // Purpose (empty)
    '',                                 // Structured reference (empty)
    data.reference.slice(0, 140),       // Unstructured reference
    '',                                 // Information (empty)
  ]
  return lines.join('\n')
}

export async function generateEPCQRCode(data: EPCData): Promise<string> {
  const payload = buildEPCPayload(data)
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
    color: { dark: '#292524', light: '#ffffff' },
  })
}

export async function generateEPCQRCodeSVG(data: EPCData): Promise<string> {
  const payload = buildEPCPayload(data)
  return QRCode.toString(payload, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
    color: { dark: '#292524', light: '#ffffff' },
  })
}
