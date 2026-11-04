import React, { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { AmountInput } from '../common/AmountInput'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Check } from 'lucide-react'

export const BudgetModal = ({ isOpen, onClose }) => {
  const monthlyBudget = useFinanceStore((state) => state.monthlyBudget)
  const budgets = useFinanceStore((state) => state.budgets)
  const updateMonthlyBudgetLimit = useFinanceStore((state) => state.updateMonthlyBudgetLimit)
  const user = useFinanceStore((state) => state.user)

  const activeLimit = Number(monthlyBudget) || Number(budgets?.monthlyLimit) || 0
  const [budgetAmount, setBudgetAmount] = useState(activeLimit > 0 ? String(activeLimit) : '')

  // Keep input in sync whenever the modal is opened or store limits update
  useEffect(() => {
    if (isOpen) {
      const current = Number(monthlyBudget) || Number(budgets?.monthlyLimit) || 0
      setBudgetAmount(current > 0 ? String(current) : '')
    }
  }, [isOpen, monthlyBudget, budgets?.monthlyLimit])

  const presets = [15000, 25000, 35000, 50000, 75000]

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = parseFloat(budgetAmount) || 0
    updateMonthlyBudgetLimit(num)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Monthly Spending Limit">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center space-y-1">
          <p className="text-xs text-mutedgreen">
            Set a monthly spending limit to track your utilization and receive budget warning alerts.
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1 text-center">
            Budget Amount (₹)
          </label>
          <AmountInput
            value={budgetAmount}
            onChange={setBudgetAmount}
            currency={user?.currency || 'INR'}
          />
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-[10px] font-bold text-mutedgreen uppercase tracking-wider mb-1.5 text-center">
            Quick Suggestions
          </label>
          <div className="flex flex-wrap justify-center gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setBudgetAmount(String(preset))}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#FAFBF9] border border-brand-border text-forest hover:bg-mint/40 transition-colors"
              >
                ₹{preset.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Check className="w-4 h-4" />
          <span>Save Spending Limit</span>
        </button>
      </form>
    </Modal>
  )
}

