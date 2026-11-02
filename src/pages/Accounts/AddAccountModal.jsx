import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/common/Modal'
import { CategoryIcon } from '../../components/common/CategoryIcon'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Check } from 'lucide-react'

export const AddAccountModal = ({ isOpen, onClose, accountToEdit }) => {
  const addAccount = useFinanceStore((state) => state.addAccount)
  const updateAccount = useFinanceStore((state) => state.updateAccount)

  const [name, setName] = useState('')
  const [type, setType] = useState('Bank')
  const [balance, setBalance] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [icon, setIcon] = useState('Landmark')
  const [color, setColor] = useState('#242E25')

  const accountTypes = ['Bank', 'Savings', 'Cash', 'Current', 'Wallet', 'Other']
  const icons = ['Landmark', 'PiggyBank', 'Wallet', 'Building2', 'Smartphone', 'CreditCard', 'Coins']
  const colors = ['#242E25', '#8AAB8F', '#43845A', '#7C827C', '#D99A42', '#26A69A', '#3F51B5']

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name || '')
      setType(accountToEdit.type || 'Bank')
      setBalance(String(accountToEdit.balance || ''))
      setAccountNumber(accountToEdit.accountNumber || '')
      setIcon(accountToEdit.icon || 'Landmark')
      setColor(accountToEdit.color || '#242E25')
    } else {
      setName('')
      setType('Bank')
      setBalance('')
      setAccountNumber('')
      setIcon('Landmark')
      setColor('#242E25')
    }
  }, [accountToEdit, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const payload = {
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      accountNumber: accountNumber.trim() || 'Custom',
      icon,
      color,
    }

    if (accountToEdit) {
      updateAccount(accountToEdit.id, payload)
    } else {
      addAccount(payload)
    }

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={accountToEdit ? 'Edit Account' : 'Add Financial Account'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Account Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Chase Main Checking, Cash Pocket"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
              Account Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
            >
              {accountTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
              {accountToEdit ? 'Current Balance' : 'Opening Balance'}
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Account / Card Number (Masked)
          </label>
          <input
            type="text"
            placeholder="e.g. ****4829 or IBAN ending"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest"
          />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Icon
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {icons.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`p-2.5 rounded-xl border transition-all ${
                  icon === ic
                    ? 'border-forest bg-mint/50 text-forest shadow-xs'
                    : 'border-brand-border bg-white text-mutedgreen hover:text-forest'
                }`}
              >
                <CategoryIcon name={ic} className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Color Accent
          </label>
          <div className="flex items-center gap-2.5">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === c ? 'scale-110 ring-2 ring-forest ring-offset-2' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-2 py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Check className="w-5 h-5" />
          <span>{accountToEdit ? 'Save Account' : 'Add Account'}</span>
        </button>
      </form>
    </Modal>
  )
}

