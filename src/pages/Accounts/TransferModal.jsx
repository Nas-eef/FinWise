import React, { useState } from 'react'
import { Modal } from '../../components/common/Modal'
import { AmountInput } from '../../components/common/AmountInput'
import { useFinanceStore } from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatters'
import { ArrowLeftRight, Check } from 'lucide-react'

export const TransferModal = ({ isOpen, onClose, initialFromAccountId }) => {
  const accounts = useFinanceStore((state) => state.accounts)
  const addTransaction = useFinanceStore((state) => state.addTransaction)
  const user = useFinanceStore((state) => state.user)

  const [amount, setAmount] = useState('')
  const [fromAccountId, setFromAccountId] = useState(initialFromAccountId || accounts[0]?.id || '')
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '')
  const [notes, setNotes] = useState('')

  const fromAcc = accounts.find(a => a.id === fromAccountId)
  const toAcc = accounts.find(a => a.id === toAccountId)

  const handleSwap = () => {
    const temp = fromAccountId
    setFromAccountId(toAccountId)
    setToAccountId(temp)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) return
    if (fromAccountId === toAccountId) return

    addTransaction({
      type: 'transfer',
      amount: numAmount,
      fromAccountId,
      toAccountId,
      date: new Date().toISOString().split('T')[0],
      description: `Transfer to ${toAcc?.name || 'Account'}`,
      notes: notes || 'Internal money transfer',
      paymentMethod: 'Transfer',
    })

    setAmount('')
    setNotes('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Money">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-2 text-center">
            Transfer Amount
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={user?.currency || 'USD'}
          />
        </div>

        {/* From & To Selector with swap button */}
        <div className="relative space-y-3 bg-[#FAFBF9] p-4 rounded-2xl border border-brand-border">
          <div>
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="font-bold text-mutedgreen uppercase tracking-wider">From Account</span>
              <span className="text-mutedgreen">Bal: {formatCurrency(fromAcc?.balance || 0, user?.currency)}</span>
            </div>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full p-2.5 bg-white border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} disabled={acc.id === toAccountId}>
                  {acc.name} ({acc.type}) - ${acc.balance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button in center */}
          <div className="flex justify-center -my-1">
            <button
              type="button"
              onClick={handleSwap}
              className="p-1.5 rounded-full bg-white border border-brand-border shadow-subtle hover:bg-mint text-forest transition-colors"
              title="Swap accounts"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="font-bold text-mutedgreen uppercase tracking-wider">To Account</span>
              <span className="text-mutedgreen">Bal: {formatCurrency(toAcc?.balance || 0, user?.currency)}</span>
            </div>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full p-2.5 bg-white border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>
                  {acc.name} ({acc.type}) - ${acc.balance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Transfer Purpose / Memo
          </label>
          <input
            type="text"
            placeholder="e.g. Savings boost, Bill funding"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest placeholder:text-mutedgreen/60"
          />
        </div>

        <button
          type="submit"
          disabled={!amount || parseFloat(amount) <= 0 || fromAccountId === toAccountId}
          className="w-full py-3.5 bg-forest hover:bg-forest/90 text-white font-bold rounded-2xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          <span>Confirm Transfer</span>
        </button>
      </form>
    </Modal>
  )
}

