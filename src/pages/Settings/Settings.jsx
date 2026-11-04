import React, { useState } from 'react'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Bell, Check } from 'lucide-react'

export const Settings = () => {
  const user = useFinanceStore((state) => state.user)
  const updateUser = useFinanceStore((state) => state.updateUser)
  const monthlyBudget = useFinanceStore((state) => state.monthlyBudget)
  const budgets = useFinanceStore((state) => state.budgets)
  const updateMonthlyBudgetLimit = useFinanceStore((state) => state.updateMonthlyBudgetLimit)

  const activeLimit = Number(monthlyBudget) || Number(budgets?.monthlyLimit) || 0
  const [currency, setCurrency] = useState(user.currency || 'INR')
  const [dateFormat, setDateFormat] = useState(user.dateFormat || 'DD/MM/YYYY')
  const [budget, setBudget] = useState(activeLimit > 0 ? String(activeLimit) : '')
  const [loanNotification1DayBefore, setLoanNotification1DayBefore] = useState(user.loanNotification1DayBefore !== false)

  const handleSave = () => {
    updateUser({
      currency,
      dateFormat,
      loanNotification1DayBefore,
    })
    updateMonthlyBudgetLimit(parseFloat(budget) || 0)
    alert('Preferences saved successfully!')
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white border border-brand-border/80 rounded-card p-5 shadow-subtle space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-mutedgreen">
          Preferences & Settings
        </h3>

        {/* Currency */}
        <div>
          <label className="block text-xs font-bold text-forest mb-1.5">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value)
              updateUser({ currency: e.target.value })
            }}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
          >
            <option value="INR">INR (₹) - Indian Rupee</option>
            <option value="USD">USD ($) - US Dollar</option>
            <option value="EUR">EUR (€) - Euro</option>
            <option value="GBP">GBP (£) - British Pound</option>
            <option value="CAD">CAD (CA$) - Canadian Dollar</option>
            <option value="AUD">AUD (A$) - Australian Dollar</option>
          </select>
        </div>

        {/* Date Format */}
        <div>
          <label className="block text-xs font-bold text-forest mb-1.5">
            Date Format
          </label>
          <select
            value={dateFormat}
            onChange={(e) => {
              setDateFormat(e.target.value)
              updateUser({ dateFormat: e.target.value })
            }}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 02/11/2026)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/02/2026)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-11-02)</option>
          </select>
        </div>

        {/* Monthly Spending Budget */}
        <div>
          <label className="block text-xs font-bold text-forest mb-1.5">
            Monthly Spending Limit (₹)
          </label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
          />
        </div>

        {/* 1-Day Before Push Notification Switch */}
        <div className="flex items-center justify-between py-2 border-t border-brand-border/40">
          <div>
            <p className="text-xs font-bold text-forest flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-sage" /> Loans 1-Day Pre-Due Push Alerts
            </p>
            <p className="text-[11px] text-mutedgreen">
              Automatically receive notifications 1 day before any EMI installment is due
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const updated = !loanNotification1DayBefore
              setLoanNotification1DayBefore(updated)
              updateUser({ loanNotification1DayBefore: updated })
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              loanNotification1DayBefore ? 'bg-forest' : 'bg-brand-border'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                loanNotification1DayBefore ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-subtle flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" /> Save Preferences
        </button>
      </div>
    </div>
  )
}
