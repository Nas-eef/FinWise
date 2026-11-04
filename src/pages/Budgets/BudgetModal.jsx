import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/common/Modal'
import { AmountInput } from '../../components/common/AmountInput'
import { CategoryIcon } from '../../components/common/CategoryIcon'
import { useFinanceStore } from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatters'
import { Check } from 'lucide-react'

export const BudgetModal = ({ isOpen, onClose, categoryId = null }) => {
  const budgets = useFinanceStore((state) => state.budgets)
  const monthlyBudget = useFinanceStore((state) => state.monthlyBudget)
  const categories = useFinanceStore((state) => state.categories)
  const updateMonthlyBudgetLimit = useFinanceStore((state) => state.updateMonthlyBudgetLimit)
  const setCategoryBudget = useFinanceStore((state) => state.setCategoryBudget)
  const user = useFinanceStore((state) => state.user)

  const isEditingTotal = categoryId === 'total' || !categoryId
  const category = categories.find(c => c.id === categoryId)

  const currentTotal = Number(budgets?.monthlyLimit) || Number(monthlyBudget) || 0
  const initialAmount = isEditingTotal
    ? (currentTotal > 0 ? String(currentTotal) : '')
    : String(budgets?.categoryLimits?.[categoryId] || '')

  const [amount, setAmount] = useState(initialAmount)

  // Keep input synchronized when opening or switching category/total
  useEffect(() => {
    if (isOpen) {
      if (isEditingTotal) {
        const total = Number(budgets?.monthlyLimit) || Number(monthlyBudget) || 0
        setAmount(total > 0 ? String(total) : '')
      } else if (categoryId) {
        const catLimit = budgets?.categoryLimits?.[categoryId] || 0
        setAmount(catLimit > 0 ? String(catLimit) : '')
      }
    }
  }, [isOpen, categoryId, isEditingTotal, budgets, monthlyBudget])

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = parseFloat(amount) || 0
    if (isEditingTotal) {
      updateMonthlyBudgetLimit(num)
    } else if (categoryId) {
      setCategoryBudget(categoryId, num)
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditingTotal ? 'Set Total Monthly Budget' : `Set Budget for ${category?.name || 'Category'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {!isEditingTotal && category && (
          <div className="flex items-center gap-3 p-3 bg-[#FAFBF9] rounded-xl border border-brand-border">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: category.color }}
            >
              <CategoryIcon name={category.icon} className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-forest">{category.name}</h4>
              <p className="text-xs text-mutedgreen">
                Current limit: {formatCurrency(budgets.categoryLimits?.[category.id] || 0, user?.currency)}
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-2 text-center">
            {isEditingTotal ? 'Total Monthly Budget Limit' : 'Category Monthly Allocation'}
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={user?.currency || 'USD'}
          />
        </div>

        <button
          type="submit"
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-3.5 bg-forest hover:bg-forest/90 text-white font-bold rounded-2xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          <span>Save Budget Limit</span>
        </button>
      </form>
    </Modal>
  )
}

