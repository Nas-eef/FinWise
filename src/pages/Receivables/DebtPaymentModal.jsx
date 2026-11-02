import React, { useState } from 'react'
import { Modal } from '../../components/common/Modal'
import { AmountInput } from '../../components/common/AmountInput'
import { useFinanceStore } from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatters'
import { Check } from 'lucide-react'

export const DebtPaymentModal = ({ isOpen, onClose, debt }) => {
  const recordDebtPayment = useFinanceStore((state) => state.recordDebtPayment)
  const user = useFinanceStore((state) => state.user)

  if (!debt) return null

  const outstanding = Math.max(0, debt.amount - debt.paidAmount)
  const [amount, setAmount] = useState(String(outstanding || ''))
  const [note, setNote] = useState('Payment settlement')

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) return

    recordDebtPayment(debt.id, num, note)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Payment: ${debt.personName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-[#FAFBF9] rounded-xl border border-brand-border text-xs space-y-1">
          <p className="flex justify-between">
            <span className="text-mutedgreen">Total Amount:</span>
            <strong className="text-forest">{formatCurrency(debt.amount, user?.currency)}</strong>
          </p>
          <p className="flex justify-between">
            <span className="text-mutedgreen">Already Settled:</span>
            <strong className="text-forest">{formatCurrency(debt.paidAmount, user?.currency)}</strong>
          </p>
          <p className="flex justify-between">
            <span className="text-mutedgreen">Remaining Outstanding:</span>
            <strong className="text-forest font-black">{formatCurrency(outstanding, user?.currency)}</strong>
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-2 text-center">
            Payment Amount
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={user?.currency || 'USD'}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Note / Payment Method
          </label>
          <input
            type="text"
            placeholder="e.g. Venmo transfer, Cash paid"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Check className="w-5 h-5" />
          <span>Confirm Payment Record</span>
        </button>
      </form>
    </Modal>
  )
}

