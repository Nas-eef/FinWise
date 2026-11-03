import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinanceStore } from '../../store/useFinanceStore'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { supabase } from '../../utils/supabase'
import { formatCurrency } from '../../utils/formatters'
import {
  Settings as SettingsIcon, Bell, Users, Landmark,
  LogOut, LogIn, ChevronRight, Check, RefreshCw,
  BarChart2, PieChart, PiggyBank, Wallet, Tags,
  Repeat, Calendar, ShieldCheck, Edit3, Trash2
} from 'lucide-react'

export const Profile = () => {
  const navigate = useNavigate()
  const user = useFinanceStore((state) => state.user)
  const updateUser = useFinanceStore((state) => state.updateUser)
  const logoutUser = useFinanceStore((state) => state.logoutUser)
  const resetAllData = useFinanceStore((state) => state.resetAllData)
  const totalBalance = useFinanceStore((state) => state.totalBalance)
  const transactions = useFinanceStore((state) => state.transactions)
  const loans = useFinanceStore((state) => state.loans)
  const friendsNotes = useFinanceStore((state) => state.friendsNotes)

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user.name || '')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleSaveProfile = (e) => {
    e.preventDefault()
    if (name.trim()) {
      updateUser({ name: name.trim() })
    }
    setIsEditing(false)
  }

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false)
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    logoutUser()
    navigate('/login')
  }

  const token = localStorage.getItem('finance_access_token')
  const isLoggedIn = Boolean(token || user?.email)

  // User initials
  const initials = (user?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const financialPages = [
    {
      label: 'Reports & Analytics',
      desc: 'Cashflow trends, spending breakdown & CSV exports',
      icon: BarChart2,
      path: '/reports',
      badge: null,
    },
    {
      label: 'Monthly Budgets',
      desc: 'Set category limits and track spend thresholds',
      icon: PieChart,
      path: '/budgets',
      badge: null,
    },
    {
      label: 'Savings Vault & Goals',
      desc: 'Track target funds, emergency savings and deposits',
      icon: PiggyBank,
      path: '/savings',
      badge: null,
    },
    {
      label: 'Accounts & Wallets',
      desc: 'Bank accounts, UPI wallets, cash & inter-transfers',
      icon: Wallet,
      path: '/accounts',
      badge: null,
    },
    {
      label: 'Category Manager',
      desc: 'Customise income and expense categories',
      icon: Tags,
      path: '/categories',
      badge: null,
    },
    {
      label: 'Subscriptions & Bills',
      desc: 'Recurring monthly subscriptions, SIPs & utility bills',
      icon: Repeat,
      path: '/recurring',
      badge: null,
    },
    {
      label: 'Reminders & Calendar',
      desc: 'Upcoming payment due dates & reminders calendar',
      icon: Calendar,
      path: '/calendar',
      badge: null,
    },
    {
      label: 'Friends Notes (Borrow / Lend)',
      desc: 'Split bills, money to get and money to pay friends',
      icon: Users,
      path: '/friends-notes',
      badge: `${friendsNotes.length} notes`,
    },
    {
      label: 'Loans & EMI Manager',
      desc: 'Auto 1-day before push notifications & installments',
      icon: Landmark,
      path: '/loans',
      badge: `${loans.length} active`,
    },
  ]

  const preferencePages = [
    {
      label: 'Push Notifications',
      desc: 'View 1-day pre-due alerts, reminders & notices',
      icon: Bell,
      path: '/notifications',
    },
    {
      label: 'Preferences & Currency',
      desc: 'Currency symbol (INR ₹), date format & alert settings',
      icon: SettingsIcon,
      path: '/settings',
    },
  ]

  return (
    <div className="space-y-4 pb-20">
      {/* User Header Profile Card */}
      <div className="bg-white border border-brand-border/80 rounded-card p-5 shadow-subtle relative overflow-hidden">
        {/* Subtle accent backdrop */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-mint/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4">
          {/* Avatar Circle */}
          <div className="w-16 h-16 rounded-full bg-forest text-mint flex items-center justify-center font-black text-xl shadow-subtle ring-4 ring-mint/30 shrink-0">
            {initials || 'U'}
          </div>

          <div className="flex-1 min-w-0">
            {!isEditing ? (
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-forest truncate">{user.name}</h2>
                  <button
                    onClick={() => {
                      setName(user.name)
                      setIsEditing(true)
                    }}
                    className="p-1 text-mutedgreen hover:text-forest transition-colors"
                    aria-label="Edit name"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-mutedgreen truncate mt-0.5">
                  {user.email || 'Guest Session (Local Mode)'}
                </p>

                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-mint/30 border border-brand-border rounded-full text-[10px] font-bold text-forest">
                    <ShieldCheck className="w-3 h-3 text-brand-success" />
                    {isLoggedIn ? 'Verified Account' : 'Guest Mode'}
                  </span>
                  <span className="inline-block px-2 py-0.5 bg-[#FAFBF9] border border-brand-border rounded-full text-[10px] font-semibold text-mutedgreen">
                    Currency: {user.currency || 'INR (₹)'}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  placeholder="Your Name"
                  className="w-full p-2 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-mutedgreen rounded-lg border border-brand-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-[11px] font-bold text-white bg-forest rounded-lg flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-brand-border/60 text-center">
          <div className="bg-[#FAFBF9] p-2 rounded-xl border border-brand-border/50">
            <span className="text-[10px] font-bold text-mutedgreen block uppercase">Balance</span>
            <span className="text-xs font-black text-forest truncate block mt-0.5">
              {formatCurrency(totalBalance, user?.currency)}
            </span>
          </div>
          <div className="bg-[#FAFBF9] p-2 rounded-xl border border-brand-border/50">
            <span className="text-[10px] font-bold text-mutedgreen block uppercase">Txs</span>
            <span className="text-xs font-black text-forest block mt-0.5">
              {transactions.length}
            </span>
          </div>
          <div className="bg-[#FAFBF9] p-2 rounded-xl border border-brand-border/50">
            <span className="text-[10px] font-bold text-mutedgreen block uppercase">Loans</span>
            <span className="text-xs font-black text-forest block mt-0.5">
              {loans.length}
            </span>
          </div>
          <div className="bg-[#FAFBF9] p-2 rounded-xl border border-brand-border/50">
            <span className="text-[10px] font-bold text-mutedgreen block uppercase">Notes</span>
            <span className="text-xs font-black text-forest block mt-0.5">
              {friendsNotes.length}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Management Hub */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-mutedgreen px-1 mb-2">
          Financial Management
        </p>
        <div className="bg-white border border-brand-border/80 rounded-card shadow-subtle divide-y divide-brand-border/50 overflow-hidden">
          {financialPages.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex items-center justify-between p-3 hover:bg-[#FAFBF9] cursor-pointer transition-colors group active:bg-mint/20"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-xl bg-mint/50 flex items-center justify-center text-forest shrink-0">
                    <Icon className="w-4 h-4 text-forest" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-forest truncate group-hover:text-forest/80">
                        {item.label}
                      </p>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 bg-mint/40 text-forest text-[9px] font-bold rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-mutedgreen truncate">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-mutedgreen group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            )
          })}
        </div>
      </div>

      {/* App & Preferences */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-mutedgreen px-1 mb-2">
          App & Preferences
        </p>
        <div className="bg-white border border-brand-border/80 rounded-card shadow-subtle divide-y divide-brand-border/50 overflow-hidden">
          {preferencePages.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex items-center justify-between p-3 hover:bg-[#FAFBF9] cursor-pointer transition-colors group active:bg-mint/20"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-xl bg-mint/50 flex items-center justify-center text-forest shrink-0">
                    <Icon className="w-4 h-4 text-forest" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-forest truncate group-hover:text-forest/80">
                      {item.label}
                    </p>
                    <p className="text-[10.5px] text-mutedgreen truncate">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-mutedgreen group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            )
          })}
        </div>
      </div>

      {/* Data Management */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-mutedgreen px-1 mb-2">
          Data Management
        </p>
        <div className="bg-white border border-brand-border/80 rounded-card shadow-subtle p-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-emerald-50 text-forest transition-colors text-xs font-bold text-left"
          >
            <Trash2 className="w-4 h-4 text-brand-error shrink-0" />
            <div>
              <span className="block text-brand-error">Clear All Data & Start Fresh (₹0.00)</span>
              <span className="text-[10px] text-mutedgreen font-normal">Wipe local transactions and balances to start zero-balance</span>
            </div>
          </button>
        </div>
      </div>

      {/* Log In / Log Out Section */}
      <div className="pt-2">
        {!isLoggedIn ? (
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-forest text-white text-xs font-bold rounded-card hover:bg-forest/90 transition-colors flex items-center justify-center gap-2 shadow-subtle active:scale-[0.99]"
          >
            <LogIn className="w-4 h-4" /> Sign In / Register
          </button>
        ) : (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 bg-red-50 border border-red-200 text-brand-error text-xs font-extrabold rounded-card hover:bg-red-100 transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <LogOut className="w-4 h-4 text-brand-error" /> Log Out
          </button>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Log Out of FinWise"
        message="Are you sure you want to log out? Your cloud data is saved in your Supabase account."
        confirmText="Yes, Log Out"
        isDanger={true}
      />

      {/* Fresh Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={async () => {
          setShowResetConfirm(false)
          await resetAllData()
        }}
        title="Clear All Financial Data"
        message="This will permanently delete all your transactions, loans, friend notes, and reset account balances to ₹0.00 both on this device and in your Supabase cloud database. This action cannot be undone."
        confirmText="Yes, Clear All Data"
        isDanger={true}
      />
    </div>
  )
}
