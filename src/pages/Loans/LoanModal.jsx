import React, { useState } from 'react'
import { Modal } from '../../components/common/Modal'
import { AmountInput } from '../../components/common/AmountInput'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Check, Bell } from 'lucide-react'

export const LoanModal = ({ isOpen, onClose }) => {
  const addLoan = useFinanceStore((state) => state.addLoan)
  const user = useFinanceStore((state) => state.user)

  const [name, setName] = useState('')
  const [lender, setLender] = useState('')
  const [originalAmount, setOriginalAmount] = useState('')
  const [outstandingAmount, setOutstandingAmount] = useState('')
  const [emiAmount, setEmiAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [dueDate, setDueDate] = useState('2026-11-15')
  const [pushNotification1DayBefore, setPushNotification1DayBefore] = useState(true)

  // Compute 1-day before notification preview date
  const get1DayBeforeDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    d.setDate(d.getDate() - 1)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !originalAmount || !emiAmount) return

    addLoan({
      name: name.trim(),
      lender: lender.trim() || 'Lender / Institution',
      originalAmount: parseFloat(originalAmount),
      outstandingAmount: parseFloat(outstandingAmount) || parseFloat(originalAmount),
      emiAmount: parseFloat(emiAmount),
      interestRate: parseFloat(interestRate) || 0,
      dueDate,
      pushNotification1DayBefore,
    })

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Loan / EMI Facility">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1">
            Loan Name / Purpose
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Car Loan, Education Loan, Laptop EMI"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1">
            Lender / Bank
          </label>
          <input
            type="text"
            placeholder="e.g. Chase Auto, SoFi, Apple Financial"
            value={lender}
            onChange={(e) => setLender(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest"
          />
        </div>

        {/* EMI Amount */}
        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1 text-center">
            Monthly EMI Amount
          </label>
          <AmountInput
            value={emiAmount}
            onChange={setEmiAmount}
            currency={user?.currency || 'USD'}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1">
              Original Amount
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="e.g. 15000"
              value={originalAmount}
              onChange={(e) => setOriginalAmount(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1">
              Outstanding Amount
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 8400"
              value={outstandingAmount}
              onChange={(e) => setOutstandingAmount(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1">
              Next EMI Due Date
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1">
              Interest Rate (% p.a.)
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 4.5"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest"
            />
          </div>
        </div>

        {/* 1-Day Before Push Notification Banner */}
        <div className="p-3 bg-mint/30 border border-sage/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-forest text-mint flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-forest">Push Alert 1 Day Before</p>
              <p className="text-[10px] text-mutedgreen">
                Triggers on <strong className="text-forest">{get1DayBeforeDate(dueDate)}</strong>
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={pushNotification1DayBefore}
            onChange={(e) => setPushNotification1DayBefore(e.target.checked)}
            className="w-4 h-4 rounded text-forest focus:ring-forest"
          />
        </div>

        <button
          type="submit"
          disabled={!name || !originalAmount || !emiAmount}
          className="w-full py-3.5 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span>Save Loan & Activate 1-Day Alert</span>
        </button>
      </form>
    </Modal>
  )
}
