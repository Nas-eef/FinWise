import React, { useState } from 'react'
import { Modal } from '../../components/common/Modal'
import { AmountInput } from '../../components/common/AmountInput'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Check } from 'lucide-react'

export const DebtModal = ({ isOpen, onClose, defaultType = 'receivable' }) => {
  const addDebt = useFinanceStore((state) => state.addDebt)
  const user = useFinanceStore((state) => state.user)

  const [type, setType] = useState(defaultType)
  const [personName, setPersonName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('2026-11-30')
  const [description, setDescription] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!personName.trim() || !amount) return

    addDebt({
      type,
      personName: personName.trim(),
      amount: parseFloat(amount),
      dueDate,
      description: description.trim() || (type === 'receivable' ? 'Money owed to you' : 'Money you owe'),
    })

    setPersonName('')
    setAmount('')
    setDescription('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'receivable' ? 'Add Money Lent (Receivable)' : 'Add Money Borrowed (Payable)'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAFBF9] border border-brand-border rounded-xl">
          <button
            type="button"
            onClick={() => setType('receivable')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'receivable' ? 'bg-forest text-white shadow-xs' : 'text-mutedgreen'
            }`}
          >
            They Owe Me (Receivable)
          </button>
          <button
            type="button"
            onClick={() => setType('payable')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'payable' ? 'bg-forest text-white shadow-xs' : 'text-mutedgreen'
            }`}
          >
            I Owe Them (Payable)
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Person / Party Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Sarah Jenkins, Dave Miller, Mechanic"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-2 text-center">
            Total Amount
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={user?.currency || 'USD'}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Expected Settlement Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Reason / Description
          </label>
          <input
            type="text"
            placeholder="e.g. Dinner bill split, Trip lodging, Emergency loan"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest placeholder:text-mutedgreen/60"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Check className="w-5 h-5" />
          <span>Save Entry</span>
        </button>
      </form>
    </Modal>
  )
}

