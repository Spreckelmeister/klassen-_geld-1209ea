import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import { useAppStore } from '@/stores/appStore'
import { Layout, MoreMenu } from '@/components/Layout'
import { SetupWizard } from '@/pages/SetupWizard'
import { Dashboard } from '@/pages/Dashboard'
import { Transactions } from '@/pages/Transactions'
import { AddTransaction } from '@/pages/AddTransaction'
import { Students } from '@/pages/Students'
import { PinLock } from '@/pages/PinLock'
import { FamilyView } from '@/pages/FamilyView'

// Lazy-loaded pages (heavy deps: jsPDF, qrcode)
const QRCodePage = lazy(() => import('@/pages/QRCode').then((m) => ({ default: m.QRCodePage })))
const ParentLetter = lazy(() => import('@/pages/ParentLetter').then((m) => ({ default: m.ParentLetter })))
const AuditorView = lazy(() => import('@/pages/AuditorView').then((m) => ({ default: m.AuditorView })))
const Export = lazy(() => import('@/pages/Export').then((m) => ({ default: m.Export })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))
const BudgetPlanner = lazy(() => import('@/pages/BudgetPlanner').then((m) => ({ default: m.BudgetPlanner })))
const FundraisingTracker = lazy(() => import('@/pages/FundraisingTracker').then((m) => ({ default: m.FundraisingTracker })))
const Handover = lazy(() => import('@/pages/Handover').then((m) => ({ default: m.Handover })))
const SocialFund = lazy(() => import('@/pages/SocialFund').then((m) => ({ default: m.SocialFund })))
const BankImport = lazy(() => import('@/pages/BankImport').then((m) => ({ default: m.BankImport })))
const AIGovernance = lazy(() => import('@/pages/AIGovernance').then((m) => ({ default: m.AIGovernance })))
const SyncPage = lazy(() => import('@/pages/Sync').then((m) => ({ default: m.Sync })))
const PDFImport = lazy(() => import('@/pages/PDFImport').then((m) => ({ default: m.PDFImport })))

function PageLoader() {
  return (
    <div className="flex h-40 items-center justify-center text-stone-400">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-brand-primary" />
        <span className="text-sm">Laden...</span>
      </div>
    </div>
  )
}

export default function App() {
  const isSetupComplete = useAppStore((s) => s.isSetupComplete)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const activeClassId = useAppStore((s) => s.activeClassId)
  const setActiveClassId = useAppStore((s) => s.setActiveClassId)
  const location = useLocation()

  // Auto-initialize activeClassId for existing users migrating to multi-class
  const firstClass = useLiveQuery(() => db.classInfo.toCollection().first())
  useEffect(() => {
    if (activeClassId === null && firstClass?.id) {
      setActiveClassId(firstClass.id)
    }
  }, [activeClassId, firstClass, setActiveClassId])

  // Family view is accessible without authentication
  if (location.pathname.startsWith('/family/')) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/family/:token" element={<FamilyView />} />
        </Routes>
      </Suspense>
    )
  }

  if (!isSetupComplete) {
    return <SetupWizard />
  }

  if (!isAuthenticated) {
    return <PinLock />
  }

  // Add-class mode: show setup wizard outside of Layout
  if (location.pathname === '/setup') {
    return <SetupWizard />
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/add-transaction" element={<AddTransaction />} />
          <Route path="/students" element={<Students />} />
          <Route path="/more" element={<MoreMenu />} />
          <Route path="/qrcode" element={<QRCodePage />} />
          <Route path="/letter" element={<ParentLetter />} />
          <Route path="/auditor" element={<AuditorView />} />
          <Route path="/export" element={<Export />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/budget" element={<BudgetPlanner />} />
          <Route path="/fundraising" element={<FundraisingTracker />} />
          <Route path="/handover" element={<Handover />} />
          <Route path="/social-fund" element={<SocialFund />} />
          <Route path="/bank-import" element={<BankImport />} />
          <Route path="/ai-governance" element={<AIGovernance />} />
          <Route path="/sync" element={<SyncPage />} />
          <Route path="/pdf-import" element={<PDFImport />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
