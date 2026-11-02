import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BalanceCard } from '../../components/cards/BalanceCard'
import { QuickActionGrid } from '../../components/cards/QuickActionGrid'
import { BudgetProgressCard } from '../../components/cards/BudgetProgressCard'
import { ExpenseGroupsSection } from '../../components/groups/ExpenseGroupsSection'
import { TransactionItem } from '../../components/transactions/TransactionItem'
import { TransactionDetailsModal } from '../Transactions/TransactionDetailsModal'
import { FriendNoteModal } from '../FriendsNotes/FriendNoteModal'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { ChevronRight, Users, Bell, ArrowDownLeft, ArrowUpRight } from 'lucide-react'

export const Dashboard = () => {
  const navigate = useNavigate()
  const transactions = useFinanceStore((state) => state.transactions)
  const friendsNotes = useFinanceStore((state) => state.friendsNotes)
  const loans = useFinanceStore((state) => state.loans)
  const user = useFinanceStore((state) => state.user)

  const [selectedTx, setSelectedTx] = useState(null)
  const [isAddFriendNoteOpen, setIsAddFriendNoteOpen] = useState(false)

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5)

  // Top pending friend notes (unsettled)
  const pendingFriendsNotes = friendsNotes.filter((n) => !n.isSettled).slice(0, 3)

  // Next Loan EMI Due (showing 1-day notification notice)
  const nextLoan = loans[0]
  const get1DayAlert = (dueDate) => {
    if (!dueDate) return ''
    const d = new Date(dueDate)
    d.setDate(d.getDate() - 1)
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="w-full space-y-4 pb-20 overflow-x-hidden">
      {/* 1. Minimal Balance Hero */}
      <BalanceCard />

      {/* 2. Quick Action Grid */}
      <QuickActionGrid onOpenFriendNote={() => setIsAddFriendNoteOpen(true)} />

      {/* 3. Expense Groups (Purposes like PG Expenses, Personal, etc.) */}
      <ExpenseGroupsSection />

      {/* 4. Loans & EMI 1-Day Notification Alert Banner */}
      {nextLoan && (
        <div
          onClick={() => navigate('/loans')}
          className="w-full p-3.5 bg-white border border-brand-border/80 rounded-2xl shadow-subtle flex items-center justify-between cursor-pointer hover:border-forest/20 transition-all active:scale-[0.99] overflow-hidden"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            <div className="w-9 h-9 rounded-xl bg-mint/50 flex items-center justify-center text-forest shrink-0">
              <Bell className="w-4 h-4 text-forest" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-forest truncate">{nextLoan.name}</span>
                <span className="text-[9px] font-bold text-forest bg-mint/60 px-1.5 py-0.2 rounded shrink-0">
                  1-Day Push Alert
                </span>
              </div>
              <p className="text-[11px] text-mutedgreen truncate mt-0.5">
                EMI {formatCurrency(nextLoan.emiAmount, user?.currency)} due {formatDate(nextLoan.dueDate, 'short')} (Alert on {get1DayAlert(nextLoan.dueDate)})
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-mutedgreen shrink-0" />
        </div>
      )}

      {/* 4. Friends Borrow & Lend Notes Section */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mutedgreen flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-sage" /> Friends Notes (Borrow / Lend)
          </h3>
          <button
            onClick={() => navigate('/friends-notes')}
            className="text-xs font-bold text-forest hover:text-sage flex items-center gap-0.5"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingFriendsNotes.length === 0 ? (
          <div className="w-full p-4 bg-white border border-brand-border/70 rounded-2xl text-center">
            <p className="text-xs font-bold text-forest">No pending friend notes</p>
            <p className="text-[10px] text-mutedgreen mt-0.5">All borrowed and lent amounts are settled</p>
          </div>
        ) : (
          <div className="w-full space-y-2">
            {pendingFriendsNotes.map((note) => {
              const isToPay = note.type === 'to_pay'
              const remaining = Math.max(0, note.amount - (note.paidAmount || 0))
              return (
                <div
                  key={note.id}
                  onClick={() => navigate('/friends-notes')}
                  className="w-full p-3 bg-white border border-brand-border/70 rounded-2xl shadow-subtle hover:bg-[#FAFBF9] cursor-pointer transition-all overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isToPay ? 'bg-red-50 text-brand-error' : 'bg-emerald-50 text-brand-success'
                      }`}>
                        {isToPay ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-forest truncate">{note.personName}</p>
                          <span className={`text-[9px] font-extrabold uppercase px-1 rounded shrink-0 ${
                            isToPay ? 'bg-red-50 text-brand-error' : 'bg-emerald-50 text-brand-success'
                          }`}>
                            {isToPay ? 'To Pay' : 'To Get'}
                          </span>
                        </div>
                        <p className="text-[11px] text-mutedgreen truncate italic">
                          "{note.note}"
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-xs font-black whitespace-nowrap ${isToPay ? 'text-brand-error' : 'text-brand-success'}`}>
                        {isToPay ? '-' : '+'}{formatCurrency(remaining, user?.currency)}
                      </p>
                      <p className="text-[10px] text-mutedgreen whitespace-nowrap">
                        {formatDate(note.dueDate, 'short')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 5. Minimal Monthly Budget Progress */}
      <BudgetProgressCard />

      {/* 6. Recent Activity */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mutedgreen">Recent Activity</h3>
          <button
            onClick={() => navigate('/activity')}
            className="text-xs font-bold text-forest hover:text-sage flex items-center gap-0.5"
          >
            All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="w-full p-6 bg-white border border-brand-border/70 rounded-2xl text-center space-y-1">
            <p className="text-xs font-bold text-forest">No transactions recorded yet</p>
            <p className="text-[11px] text-mutedgreen">
              Tap the <strong>+</strong> button below to record your first income or expense.
            </p>
          </div>
        ) : (
          <div className="w-full space-y-2">
            {recentTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onClick={() => setSelectedTx(tx)}
              />
            ))}
          </div>
        )}
      </div>


      {/* Modals */}
      <TransactionDetailsModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      <FriendNoteModal
        isOpen={isAddFriendNoteOpen}
        onClose={() => setIsAddFriendNoteOpen(false)}
      />
    </div>
  )
}
