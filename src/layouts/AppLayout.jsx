import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { MobileHeader } from '../components/navigation/MobileHeader'
import { BottomNavigation } from '../components/navigation/BottomNavigation'
import { TransactionFormModal } from '../components/transactions/TransactionFormModal'

export const AppLayout = () => {
  const location = useLocation()

  const getRouteInfo = () => {
    const path = location.pathname
    if (path === '/') return { title: 'Home', showBack: false }
    if (path === '/activity') return { title: 'Activity & History', showBack: false }
    if (path === '/reports') return { title: 'Reports & Analytics', showBack: false }
    if (path === '/profile') return { title: 'My Profile & Hub', showBack: false }
    if (path === '/budgets') return { title: 'Monthly Budgets', showBack: true }
    if (path === '/savings') return { title: 'Savings Vault & Goals', showBack: true }
    if (path === '/accounts') return { title: 'Accounts & Wallets', showBack: true }
    if (path.startsWith('/accounts/')) return { title: 'Account Details', showBack: true }
    if (path === '/categories') return { title: 'Category Manager', showBack: true }
    if (path === '/recurring') return { title: 'Subscriptions & Bills', showBack: true }
    if (path === '/calendar') return { title: 'Reminders & Calendar', showBack: true }
    if (path === '/friends-notes') return { title: 'Friends Notes (Borrow/Lend)', showBack: true }
    if (path === '/loans') return { title: 'Loans & EMI Manager', showBack: true }
    if (path === '/receivables') return { title: 'Receivables & Payables', showBack: true }
    if (path === '/vault') return { title: 'Document Vault', showBack: true }
    if (path === '/meetings') return { title: 'Meetings & Follow-ups', showBack: true }
    if (path === '/wiki') return { title: 'Personal Wiki', showBack: true }
    if (path === '/settings') return { title: 'Preferences', showBack: true }
    if (path === '/notifications') return { title: 'Notifications', showBack: true }
    return { title: 'FinWise', showBack: true }
  }

  const { title, showBack } = getRouteInfo()

  return (
    <div className="min-h-screen w-full bg-[#EEF2EE] text-forest flex justify-center items-start overflow-x-hidden">
      {/* Mobile-first App Frame */}
      <div className="w-full max-w-md min-h-screen bg-[#F7F9F7] flex flex-col relative shadow-card border-x border-brand-border/40 overflow-x-hidden">
        {/* Top Header */}
        <MobileHeader title={title} showBack={showBack} />

        {/* Scrollable Page Content */}
        <main className="w-full flex-1 px-4 pt-3 pb-24 overflow-x-hidden">
          <Outlet />
        </main>

        {/* Global Bottom Navigation */}
        <BottomNavigation />

        {/* Global Minimal Transaction Modal Bottom Sheet */}
        <TransactionFormModal />
      </div>
    </div>
  )
}
