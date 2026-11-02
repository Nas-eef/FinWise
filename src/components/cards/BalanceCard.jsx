import React, { useState } from 'react'
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'

export const BalanceCard = () => {
  const [showBalance, setShowBalance] = useState(true)
  const totalBalance = useFinanceStore((state) => state.totalBalance)
  const transactions = useFinanceStore((state) => state.transactions)
  const user = useFinanceStore((state) => state.user)

  // Current month income & expenses
  const currentMonthPrefix = new Date().toISOString().substring(0, 7)
  const monthlyTransactions = transactions.filter((t) => t.date && t.date.startsWith(currentMonthPrefix))

  const monthlyIncome = monthlyTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const monthlyExpense = monthlyTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  return (
    <div className="relative overflow-hidden bg-forest text-white rounded-card-lg p-5 shadow-float">
      {/* Decorative organic background aura */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-sage/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[10px] font-bold text-mint/80 uppercase tracking-widest">
          Total Net Balance
        </span>
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="p-1 text-mint/70 hover:text-white rounded-full transition-colors"
          aria-label="Toggle balance visibility"
        >
          {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Balance Display */}
      <div className="relative z-10 my-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          {showBalance ? formatCurrency(totalBalance, user?.currency) : '••••••••'}
        </h1>
      </div>

      {/* Income / Expense Split */}
      <div className="relative z-10 grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-mint/20 flex items-center justify-center text-mint">
            <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-[9px] text-mint/70 uppercase font-bold">This Month Inflow</p>
            <p className="text-xs font-black text-white">
              {showBalance ? `+${formatCurrency(monthlyIncome, user?.currency)}` : '••••'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[#FF8A80]">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-[9px] text-mint/70 uppercase font-bold">This Month Outflow</p>
            <p className="text-xs font-black text-white">
              {showBalance ? `-${formatCurrency(monthlyExpense, user?.currency)}` : '••••'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
