import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/common/Modal'
import { AmountInput } from '../../components/common/AmountInput'
import { useFinanceStore } from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatters'
import { Check } from 'lucide-react'

export const FriendPaymentModal = ({ isOpen, onClose, noteItem }) => {
  const recordFriendsPayment = useFinanceStore((state) => state.recordFriendsPayment)
  const user = useFinanceStore((state) => state.user)

  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (noteItem) {
      const remaining = Math.max(0, noteItem.amount - (noteItem.paidAmount || 0))
      setAmount(remaining > 0 ? String(remaining) : '')
    } else {
      setAmount('')
    }
  }, [noteItem, isOpen])

  if (!noteItem) return null

  const remaining = Math.max(0, noteItem.amount - (noteItem.paidAmount || 0))

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) return

    recordFriendsPayment(noteItem.id, num)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={noteItem.type === 'to_pay' ? `Pay to ${noteItem.personName}` : `Receive from ${noteItem.personName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-[#FAFBF9] rounded-xl border border-brand-border text-xs space-y-1">
          <p className="flex justify-between">
            <span className="text-mutedgreen">Note / Purpose:</span>
            <strong className="text-forest font-semibold">{noteItem.note}</strong>
          </p>
          <p className="flex justify-between">
            <span className="text-mutedgreen">Total Amount:</span>
            <strong className="text-forest">{formatCurrency(noteItem.amount, user?.currency)}</strong>
          </p>
          <p className="flex justify-between">
            <span className="text-mutedgreen">Remaining to Settle:</span>
            <strong className="text-forest font-black">{formatCurrency(remaining, user?.currency)}</strong>
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1 text-center">
            {noteItem.type === 'to_pay' ? 'Amount You Paid Him' : 'Amount Friend Returned'}
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={user?.currency || 'INR'}
          />
        </div>

        <button
          type="submit"
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          <span>Confirm Payment</span>
        </button>
      </form>
    </Modal>
  )
}
