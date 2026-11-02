import React, { useState } from 'react'
import { formatCurrency } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { BudgetModal } from './BudgetModal'
import { AlertCircle, Edit2, SlidersHorizontal } from 'lucide-react'

export const BudgetProgressCard = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const monthlyBudget = useFinanceStore((state) => state.monthlyBudget)
  const transactions = useFinanceStore((state) => state.transactions)
  const user = useFinanceStore((state) => state.user)

  const currentMonthPrefix = new Date().toISOString().substring(0, 7)
  const monthlyExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date && t.date.startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const hasBudget = monthlyBudget > 0
  const limit = hasBudget ? monthlyBudget : 0
  const spent = monthlyExpenses
  const remaining = hasBudget ? Math.max(0, limit - spent) : 0
  const percentage = hasBudget ? Math.round((spent / limit) * 100) : 0

  const isOverBudget = hasBudget && spent > limit
  const isNearBudget = hasBudget && percentage >= 80 && !isOverBudget

  return (
    <>
      <div
        onClick={() => setIsEditModalOpen(true)}
        className="p-4 bg-white border border-brand-border/70 rounded-card shadow-subtle space-y-2.5 cursor-pointer hover:border-forest/30 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-mutedgreen">
                Monthly Spending Limit
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditModalOpen(true)
                }}
                className="p-1 -my-1 text-mutedgreen hover:text-forest transition-colors rounded-md group-hover:bg-[#FAFBF9]"
                title="Edit Limit"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
            <h3 className="text-sm font-extrabold text-forest mt-0.5">
              {hasBudget ? (
                <>
                  {formatCurrency(remaining, user?.currency)}{' '}
                  <span className="text-xs font-normal text-mutedgreen">remaining</span>
                </>
              ) : (
                <span className="text-xs font-bold text-sage">Tap to set monthly limit</span>
              )}
            </h3>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              !hasBudget
                ? 'bg-gray-100 text-mutedgreen'
                : isOverBudget
                ? 'bg-red-50 text-brand-error'
                : isNearBudget
                ? 'bg-amber-50 text-brand-warning'
                : 'bg-mint text-forest'
            }`}
          >
            {hasBudget ? `${percentage}% spent` : 'No limit'}
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-2 bg-[#FAFBF9] border border-brand-border/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              !hasBudget ? 'bg-transparent' : isOverBudget ? 'bg-brand-error' : isNearBudget ? 'bg-brand-warning' : 'bg-forest'
            }`}
            style={{ width: `${hasBudget ? Math.min(percentage, 100) : 0}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-mutedgreen">
          <span>Spent: <strong className="text-forest font-bold">{formatCurrency(spent, user?.currency)}</strong></span>
          <span>Limit: <strong className="text-forest font-bold">{hasBudget ? formatCurrency(limit, user?.currency) : 'Not set'}</strong></span>
        </div>

        {isOverBudget && (
          <div className="flex items-center gap-1.5 text-xs text-brand-error font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Exceeded limit by {formatCurrency(spent - limit, user?.currency)}</span>
          </div>
        )}
      </div>

      <BudgetModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  )
}
