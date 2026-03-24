import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import { useAppStore } from '@/stores/appStore'

export function useActiveClassId() {
  return useAppStore((s) => s.activeClassId)
}

export function useActiveClassInfo() {
  const activeClassId = useAppStore((s) => s.activeClassId)
  return useLiveQuery(() => {
    if (activeClassId) return db.classInfo.get(activeClassId)
    return db.classInfo.toCollection().first()
  }, [activeClassId])
}

export function useAllClasses() {
  return useLiveQuery(() => db.classInfo.toArray())
}

export function useClassStudents() {
  const activeClassId = useAppStore((s) => s.activeClassId)
  return useLiveQuery(() => {
    if (activeClassId) return db.students.where('classId').equals(activeClassId).toArray()
    return db.students.toArray()
  }, [activeClassId])
}

export function useClassTransactions() {
  const activeClassId = useAppStore((s) => s.activeClassId)
  return useLiveQuery(() => {
    if (activeClassId) return db.transactions.where('classId').equals(activeClassId).toArray()
    return db.transactions.toArray()
  }, [activeClassId])
}

export function useClassBudgetItems() {
  const activeClassId = useAppStore((s) => s.activeClassId)
  return useLiveQuery(() => {
    if (activeClassId) return db.budgetItems.where('classId').equals(activeClassId).toArray()
    return db.budgetItems.toArray()
  }, [activeClassId])
}

export function useClassFundraisingActions() {
  const activeClassId = useAppStore((s) => s.activeClassId)
  return useLiveQuery(() => {
    if (activeClassId) return db.fundraisingActions.where('classId').equals(activeClassId).toArray()
    return db.fundraisingActions.toArray()
  }, [activeClassId])
}

export function useClassSocialFund() {
  const activeClassId = useAppStore((s) => s.activeClassId)
  return useLiveQuery(() => {
    if (activeClassId) return db.socialFund.where('classId').equals(activeClassId).toArray()
    return db.socialFund.toArray()
  }, [activeClassId])
}

export function useClassDueDates() {
  const activeClassId = useAppStore((s) => s.activeClassId)
  return useLiveQuery(() => {
    if (activeClassId) return db.dueDates.where('classId').equals(activeClassId).toArray()
    return db.dueDates.toArray()
  }, [activeClassId])
}

export function useClassAuditRecords() {
  const activeClassId = useAppStore((s) => s.activeClassId)
  return useLiveQuery(() => {
    if (activeClassId) return db.auditRecords.where('classId').equals(activeClassId).toArray()
    return db.auditRecords.toArray()
  }, [activeClassId])
}
