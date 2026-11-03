import React, { useState } from 'react'
import { CategoryIcon } from '../../components/common/CategoryIcon'
import { BudgetModal } from './BudgetModal'
import { formatCurrency } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Edit3, AlertTriangle, CheckCircle, Flame, Plus, History } from 'lucide-react'

export const Budgets = () => {
  const budgets = useFinanceStore((state) => state.budgets)
  const categories = useFinanceStore((state) => state.categories)
  const transactions = useFinanceStore((state) => state.transactions)
  const user = useFinanceStore((state) => state.user)

  const [activeCategoryModal, setActiveCategoryModal] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  const currentMonthPrefix = new Date().toISOString().substring(0, 7) // 2026-11
  const monthlyTransactions = transactions.filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentMonthPrefix))

  const monthlyBudget = useFinanceStore((state) => state.monthlyBudget)

  // Total spent
  const totalSpent = monthlyTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const totalLimit = Number(budgets.monthlyLimit) || Number(monthlyBudget) || 0
  const totalRemaining = Math.max(0, totalLimit - totalSpent)
  const totalPercentage = Math.round((totalSpent / totalLimit) * 100) || 0

  const expenseCategories = categories.filter(c => c.type === 'expense')

  // Calculate spent per category
  const categoryStats = expenseCategories.map(cat => {
    const spent = monthlyTransactions
      .filter(t => t.categoryId === cat.id)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

    const limit = budgets.categoryLimits?.[cat.id] || 0
    const remaining = Math.max(0, limit - spent)
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0
    const isOver = limit > 0 && spent > limit
    const isNear = limit > 0 && percentage >= 80 && !isOver

    return {
      cat,
      spent,
      limit,
      remaining,
      percentage,
      isOver,
      isNear,
    }
  }).sort((a, b) => b.spent - a.spent)

  // Mock Budget history
  const historyData = [
    { month: 'October 2026', limit: 4500, spent: 4120, status: 'On Track' },
    { month: 'September 2026', limit: 4500, spent: 3950, status: 'On Track' },
    { month: 'August 2026', limit: 4200, spent: 4350, status: 'Exceeded' },
    { month: 'July 2026', limit: 4200, spent: 3880, status: 'On Track' },
  ]

  return (
    <div className="space-y-5 pb-20">
      {/* Monthly Budget Master Card */}
      <div className="bg-forest text-white rounded-card-lg p-6 shadow-float relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-mint/80">
            November 2026 Budget
          </span>
          <button
            onClick={() => setActiveCategoryModal('total')}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs font-semibold text-mint transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Set Limit
          </button>
        </div>

        <div className="my-3">
          <p className="text-xs text-mint/70">Remaining to Spend</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5">
            {formatCurrency(totalRemaining, user?.currency)}
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden p-0.5 my-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totalSpent > totalLimit ? 'bg-[#EF5350]' : totalPercentage >= 80 ? 'bg-[#FFA726]' : 'bg-mint'
            }`}
            style={{ width: `${Math.min(totalPercentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-mint/80 pt-1">
          <span>Spent: <strong className="text-white">{formatCurrency(totalSpent, user?.currency)}</strong> ({totalPercentage}%)</span>
          <span>Limit: <strong className="text-white">{formatCurrency(totalLimit, user?.currency)}</strong></span>
        </div>
      </div>

      {/* History Toggle Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-bold text-forest">Category Allocations</h3>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs font-bold text-forest hover:text-sage flex items-center gap-1 transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          {showHistory ? 'Hide History' : 'Monthly History'}
        </button>
      </div>

      {/* Historical Budgets Drawer if active */}
      {showHistory && (
        <div className="p-4 bg-white border border-brand-border/70 rounded-card shadow-subtle space-y-3">
          <h4 className="text-xs font-bold text-forest uppercase tracking-wider">Past 4 Months Record</h4>
          <div className="space-y-2">
            {historyData.map(h => (
              <div key={h.month} className="flex items-center justify-between py-2 border-b border-brand-border/40 text-xs">
                <div>
                  <p className="font-bold text-forest">{h.month}</p>
                  <p className="text-mutedgreen">Limit: {formatCurrency(h.limit, user?.currency)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-forest">{formatCurrency(h.spent, user?.currency)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    h.status === 'Exceeded' ? 'bg-red-50 text-brand-error' : 'bg-emerald-50 text-brand-success'
                  }`}>
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Budgets List */}
      <div className="space-y-3">
        {categoryStats.map(({ cat, spent, limit, remaining, percentage, isOver, isNear }) => (
          <div
            key={cat.id}
            onClick={() => setActiveCategoryModal(cat.id)}
            className={`p-4 bg-white border rounded-card shadow-subtle hover:border-forest/20 cursor-pointer transition-all active:scale-[0.99] group ${
              isOver ? 'border-red-200' : isNear ? 'border-amber-200' : 'border-brand-border/70'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon name={cat.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-forest group-hover:text-forest/80">
                    {cat.name}
                  </h4>
                  <p className="text-xs text-mutedgreen">
                    Limit: {limit > 0 ? formatCurrency(limit, user?.currency) : 'No limit set'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isOver
                    ? 'bg-red-50 text-brand-error'
                    : isNear
                    ? 'bg-amber-50 text-brand-warning'
                    : 'bg-mint text-forest'
                }`}>
                  {limit > 0 ? `${percentage}%` : 'Uncapped'}
                </span>
                <p className="text-xs font-extrabold text-forest mt-1">
                  {formatCurrency(spent, user?.currency)}
                </p>
              </div>
            </div>

            {/* Progress bar if limit is set */}
            {limit > 0 ? (
              <div className="space-y-1">
                <div className="w-full h-2 bg-[#FAFBF9] border border-brand-border/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-brand-error' : isNear ? 'bg-brand-warning' : 'bg-forest'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-mutedgreen pt-1">
                  <span>
                    {isOver ? (
                      <span className="text-brand-error font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Over by {formatCurrency(spent - limit, user?.currency)}
                      </span>
                    ) : (
                      `${formatCurrency(remaining, user?.currency)} remaining`
                    )}
                  </span>
                  <span className="text-forest font-medium flex items-center gap-1 group-hover:underline">
                    Edit limit <Edit3 className="w-3 h-3 text-mutedgreen" />
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-mutedgreen pt-1 border-t border-brand-border/40">
                <span>No budget limit defined</span>
                <button
                  type="button"
                  className="text-forest font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Set Budget
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Budget Set/Edit Modal */}
      <BudgetModal
        isOpen={!!activeCategoryModal}
        onClose={() => setActiveCategoryModal(null)}
        categoryId={activeCategoryModal}
      />
    </div>
  )
}

