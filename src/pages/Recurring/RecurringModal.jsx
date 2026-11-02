import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/common/Modal'
import { AmountInput } from '../../components/common/AmountInput'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Check } from 'lucide-react'

export const RecurringModal = ({ isOpen, onClose, recurringToEdit }) => {
  const accounts = useFinanceStore((state) => state.accounts)
  const categories = useFinanceStore((state) => state.categories)
  const addRecurring = useFinanceStore((state) => state.addRecurring)
  const user = useFinanceStore((state) => state.user)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('cat-bills')
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [frequency, setFrequency] = useState('Monthly')
  const [nextDueDate, setNextDueDate] = useState('')
  const [reminderDays, setReminderDays] = useState('2')

  const frequencies = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Custom']

  useEffect(() => {
    if (recurringToEdit) {
      setName(recurringToEdit.name || '')
      setAmount(String(recurringToEdit.amount || ''))
      setCategoryId(recurringToEdit.categoryId || 'cat-bills')
      setAccountId(recurringToEdit.accountId || (accounts[0]?.id || ''))
      setFrequency(recurringToEdit.frequency || 'Monthly')
      setNextDueDate(recurringToEdit.nextDueDate || '')
      setReminderDays(String(recurringToEdit.reminderDays || 2))
    } else {
      setName('')
      setAmount('')
      setCategoryId('cat-bills')
      setAccountId(accounts[0]?.id || '')
      setFrequency('Monthly')
      setNextDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      setReminderDays('2')
    }
  }, [recurringToEdit, isOpen, accounts])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !amount) return

    addRecurring({
      name: name.trim(),
      amount: parseFloat(amount),
      categoryId,
      accountId,
      frequency,
      nextDueDate: nextDueDate || new Date().toISOString().split('T')[0],
      reminderDays: parseInt(reminderDays) || 2,
    })

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={recurringToEdit ? 'Edit Subscription' : 'Add Recurring Payment'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Service / Subscription Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Netflix, Spotify, Gym, Fiber Internet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-2 text-center">
            Recurring Amount
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
              Billing Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
            >
              {frequencies.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
              Next Due Date
            </label>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest"
            >
              {categories.filter(c => c.type === 'expense').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
              Deduct Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Remind Me In Advance
          </label>
          <select
            value={reminderDays}
            onChange={(e) => setReminderDays(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest"
          >
            <option value="1">1 day before</option>
            <option value="2">2 days before</option>
            <option value="3">3 days before</option>
            <option value="7">1 week before</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          <span>Save Recurring Payment</span>
        </button>
      </form>
    </Modal>
  )
}

