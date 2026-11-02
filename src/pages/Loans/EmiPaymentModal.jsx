import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/common/Modal'
import { AmountInput } from '../../components/common/AmountInput'
import { useFinanceStore } from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatters'
import { Check } from 'lucide-react'

export const EmiPaymentModal = ({ isOpen, onClose, loan }) => {
  const recordEmiPayment = useFinanceStore((state) => state.recordEmiPayment)
  const user = useFinanceStore((state) => state.user)

  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (loan) {
      setAmount(String(loan.emiAmount || ''))
    } else {
      setAmount('')
    }
  }, [loan, isOpen])

  if (!loan) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) return

    recordEmiPayment(loan.id, num)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Pay EMI: ${loan.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-[#FAFBF9] rounded-xl border border-brand-border text-xs space-y-1">
          <p className="flex justify-between">
            <span className="text-mutedgreen">Lender:</span>
            <strong className="text-forest">{loan.lender}</strong>
          </p>
          <p className="flex justify-between">
            <span className="text-mutedgreen">Current Outstanding:</span>
            <strong className="text-forest">{formatCurrency(loan.outstandingAmount, user?.currency)}</strong>
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1 text-center">
            EMI Payment Amount
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={user?.currency || 'INR'}
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Check className="w-5 h-5" />
          <span>Confirm EMI Payment</span>
        </button>
      </form>
    </Modal>
  )
}
