export interface ClassInfo {
  id?: number
  className: string
  schoolYear: string
  treasurerName: string
  auditorName: string
  iban: string
  defaultAmount: number
  pin?: string
  auditorPin?: string
  bankName?: string
  bic?: string
  createdAt: Date
}

export type LetterTemplate = 'first' | 'additional' | 'trip' | 'yearEnd'

export interface Student {
  id?: number
  name: string
  butStatus: boolean
  notes: string
  selfServiceToken?: string
  classId?: number
  createdAt: Date
}

export interface Transaction {
  id?: number
  type: 'income' | 'expense'
  amount: number
  date: Date
  category: string
  description: string
  studentId?: number
  receiptPhoto?: Blob
  isStorno: boolean
  stornoRef?: number
  classId?: number
  createdAt: Date
}

export type TransactionCategory =
  | 'Einzahlung'
  | 'Ausflug'
  | 'Klassenfahrt'
  | 'Material'
  | 'Kopien'
  | 'Geschenke'
  | 'Veranstaltung'
  | 'Sonstiges'

export const INCOME_CATEGORIES: TransactionCategory[] = ['Einzahlung', 'Sonstiges']
export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'Ausflug',
  'Klassenfahrt',
  'Material',
  'Kopien',
  'Geschenke',
  'Veranstaltung',
  'Sonstiges',
]

export interface DueDate {
  id?: number
  label: string
  amount: number
  dueDate: Date
  classId?: number
  createdAt: Date
}

export interface BudgetItem {
  id?: number
  label: string
  estimatedAmount: number
  actualAmount?: number
  plannedDate: Date
  category: string
  completed: boolean
  classId?: number
  createdAt: Date
}

export interface FundraisingAction {
  id?: number
  name: string
  date: Date
  description: string
  grossIncome: number
  costs: number
  completed: boolean
  classId?: number
  createdAt: Date
}

export interface SocialFund {
  id?: number
  type: 'deposit' | 'withdrawal'
  amount: number
  date: Date
  description: string
  studentId?: number
  classId?: number
  createdAt: Date
}

export interface AuditRecord {
  id?: number
  auditorName: string
  date: Date
  transactionCount: number
  balance: number
  transactionHash: string
  confirmed: boolean
  classId?: number
  createdAt: Date
}
