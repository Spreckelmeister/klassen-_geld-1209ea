import { db } from '@/db/database'
import { useAppStore } from '@/stores/appStore'

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0)
  return d
}

function weeksFromNow(weeks: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + weeks * 7)
  d.setHours(9, 0, 0, 0)
  return d
}

export async function seedDemoData(): Promise<void> {
  // 1. Create class
  const classId = await db.classInfo.add({
    className: '3a',
    schoolYear: '2025/2026',
    treasurerName: 'Sarah Becker',
    auditorName: 'Frau Hoffmann',
    iban: 'DE89370400440532013000',
    defaultAmount: 25,
    createdAt: new Date(),
  })

  // 2. Create students
  const studentNames = [
    { name: 'Lina Mueller', butStatus: false },
    { name: 'Ben Schmidt', butStatus: false },
    { name: 'Emma Weber', butStatus: false },
    { name: 'Noah Fischer', butStatus: true },
    { name: 'Mia Wagner', butStatus: false },
    { name: 'Paul Bauer', butStatus: false },
    { name: 'Hannah Koch', butStatus: false },
    { name: 'Luca Richter', butStatus: false },
  ]

  const studentIds: number[] = []
  for (const s of studentNames) {
    const id = await db.students.add({
      name: s.name,
      butStatus: s.butStatus,
      notes: '',
      classId: classId as number,
      createdAt: new Date(),
    })
    studentIds.push(id as number)
  }

  // 3. Create income transactions — 5 of 8 students paid 25 EUR
  const paidIndices = [0, 1, 2, 4, 5] // Lina, Ben, Emma, Mia, Paul
  const paymentDays = [12, 10, 8, 5, 3] // spread over ~2 weeks

  for (let i = 0; i < paidIndices.length; i++) {
    const idx = paidIndices[i]!
    await db.transactions.add({
      type: 'income',
      amount: 25,
      date: daysAgo(paymentDays[i]!),
      category: 'Einzahlung',
      description: `Klassenkassenbeitrag ${studentNames[idx]!.name}`,
      studentId: studentIds[idx],
      isStorno: false,
      classId: classId as number,
      createdAt: new Date(),
    })
  }

  // 4. Create expense transactions
  await db.transactions.add({
    type: 'expense',
    amount: 18.5,
    date: daysAgo(6),
    category: 'Material',
    description: 'Bastelmaterial',
    isStorno: false,
    classId: classId as number,
    createdAt: new Date(),
  })

  await db.transactions.add({
    type: 'expense',
    amount: 4.2,
    date: daysAgo(2),
    category: 'Kopien',
    description: 'Kopien Elternbrief',
    isStorno: false,
    classId: classId as number,
    createdAt: new Date(),
  })

  // 5. Create budget item
  await db.budgetItems.add({
    label: 'Ausflug Tierpark',
    estimatedAmount: 200,
    plannedDate: weeksFromNow(4),
    category: 'Ausflug',
    completed: false,
    classId: classId as number,
    createdAt: new Date(),
  })

  // 6. Set app state
  localStorage.setItem('isDemo', 'true')
  const { setActiveClassId, setSetupComplete } = useAppStore.getState()
  setActiveClassId(classId as number)
  setSetupComplete(true)
}

export async function clearDemoData(): Promise<void> {
  // Delete all IndexedDB data
  await db.delete()

  // Clear all localStorage
  localStorage.clear()

  // Reload to restart fresh
  window.location.reload()
}
