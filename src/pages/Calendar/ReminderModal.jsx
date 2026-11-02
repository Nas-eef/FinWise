import React, { useState } from 'react'
import { Modal } from '../../components/common/Modal'
import { AmountInput } from '../../components/common/AmountInput'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Check } from 'lucide-react'

export const ReminderModal = ({ isOpen, onClose }) => {
  const addReminder = useFinanceStore((state) => state.addReminder)
  const user = useFinanceStore((state) => state.user)

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState('Bill')
  const [priority, setPriority] = useState('medium')

  const reminderTypes = ['Bill', 'EMI', 'Rent', 'Subscription', 'Tax', 'Custom']

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !dueDate) return

    addReminder({
      title: title.trim(),
      amount: parseFloat(amount) || 0,
      dueDate,
      type,
      priority,
    })

    setTitle('')
    setAmount('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Payment Reminder">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Reminder Title
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Electric Bill, Credit Card Due, Rent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-2 text-center">
            Amount Due
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={user?.currency || 'USD'}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
              Due Date
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
            <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
              Category / Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
            >
              {reminderTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Priority Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['low', 'medium', 'high'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`py-2 text-xs font-bold capitalize rounded-xl transition-all border ${
                  priority === p
                    ? 'bg-forest text-white border-forest shadow-xs'
                    : 'bg-[#FAFBF9] border-brand-border text-mutedgreen hover:text-forest'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Check className="w-5 h-5" />
          <span>Save Reminder</span>
        </button>
      </form>
    </Modal>
  )
}

