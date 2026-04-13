import Dexie, { type Table } from 'dexie'
import type { ClassInfo, Student, Transaction, DueDate, BudgetItem, FundraisingAction, SocialFund, AuditRecord, BankTransaction } from '@/types'

class KlassenkasseDB extends Dexie {
  classInfo!: Table<ClassInfo>
  students!: Table<Student>
  transactions!: Table<Transaction>
  dueDates!: Table<DueDate>
  budgetItems!: Table<BudgetItem>
  fundraisingActions!: Table<FundraisingAction>
  socialFund!: Table<SocialFund>
  auditRecords!: Table<AuditRecord>
  bankTransactions!: Table<BankTransaction>

  constructor() {
    super('klassenkasse')
    this.version(1).stores({
      classInfo: '++id',
      students: '++id, name',
      transactions: '++id, type, category, date, studentId, isStorno',
      dueDates: '++id, dueDate',
    })
    this.version(2).stores({
      classInfo: '++id',
      students: '++id, name',
      transactions: '++id, type, category, date, studentId, isStorno',
      dueDates: '++id, dueDate',
      budgetItems: '++id, plannedDate, completed',
      fundraisingActions: '++id, date, completed',
      socialFund: '++id, type, date, studentId',
    })
    this.version(3).stores({
      classInfo: '++id',
      students: '++id, name, selfServiceToken',
      transactions: '++id, type, category, date, studentId, isStorno',
      dueDates: '++id, dueDate',
      budgetItems: '++id, plannedDate, completed',
      fundraisingActions: '++id, date, completed',
      socialFund: '++id, type, date, studentId',
    })
    this.version(4).stores({
      classInfo: '++id',
      students: '++id, name, selfServiceToken',
      transactions: '++id, type, category, date, studentId, isStorno',
      dueDates: '++id, dueDate',
      budgetItems: '++id, plannedDate, completed',
      fundraisingActions: '++id, date, completed',
      socialFund: '++id, type, date, studentId',
      auditRecords: '++id, date',
    })
    this.version(5).stores({
      classInfo: '++id',
      students: '++id, name, selfServiceToken, classId',
      transactions: '++id, type, category, date, studentId, isStorno, classId',
      dueDates: '++id, dueDate, classId',
      budgetItems: '++id, plannedDate, completed, classId',
      fundraisingActions: '++id, date, completed, classId',
      socialFund: '++id, type, date, studentId, classId',
      auditRecords: '++id, date, classId',
    }).upgrade(tx => {
      return Promise.all([
        tx.table('students').toCollection().modify(s => { if (!s.classId) s.classId = 1; }),
        tx.table('transactions').toCollection().modify(t => { if (!t.classId) t.classId = 1; }),
        tx.table('dueDates').toCollection().modify(d => { if (!d.classId) d.classId = 1; }),
        tx.table('budgetItems').toCollection().modify(b => { if (!b.classId) b.classId = 1; }),
        tx.table('fundraisingActions').toCollection().modify(f => { if (!f.classId) f.classId = 1; }),
        tx.table('socialFund').toCollection().modify(s => { if (!s.classId) s.classId = 1; }),
        tx.table('auditRecords').toCollection().modify(a => { if (!a.classId) a.classId = 1; }),
      ])
    })

    // v6: GoBD-Hashkette, KI-Felder, BankTransactions-Tabelle
    this.version(6).stores({
      classInfo: '++id',
      students: '++id, name, selfServiceToken, classId',
      transactions: '++id, type, category, date, studentId, isStorno, classId, sequenceNo',
      dueDates: '++id, dueDate, classId',
      budgetItems: '++id, plannedDate, completed, classId',
      fundraisingActions: '++id, date, completed, classId',
      socialFund: '++id, type, date, studentId, classId',
      auditRecords: '++id, date, classId',
      bankTransactions: '++id, date, confirmed, imported, classId',
    }).upgrade(tx => {
      // Bestehende Buchungen: GoBD-Defaults + KI-Defaults setzen
      return tx.table('transactions').toCollection().modify(t => {
        if (t.sequenceNo === undefined) t.sequenceNo = 0;
        if (t.hashPrev === undefined) t.hashPrev = 'GENESIS';
        if (t.hashSelf === undefined) t.hashSelf = '';
        if (t.taxNote === undefined) t.taxNote = '';
        if (t.aiSuggested === undefined) t.aiSuggested = false;
        if (t.updatedAt === undefined) t.updatedAt = t.createdAt;
      });
    })
  }
}

export const db = new KlassenkasseDB()
