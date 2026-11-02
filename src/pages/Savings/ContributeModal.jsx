import React, { useState } from 'react'
import { Modal } from '../../components/common/Modal'
import { AmountInput } from '../../components/common/AmountInput'
import { useFinanceStore } from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatters'
import confetti from 'canvas-confetti'
import { PlusCircle, MinusCircle, Check } from 'lucide-react'

export const ContributeModal = ({ isOpen, onClose, goal }) => {
  const accounts = useFinanceStore((state) => state.accounts)
  const contributeToGoal = useFinanceStore((state) => state.contributeToGoal)
  const withdrawFromGoal = useFinanceStore((state) => state.withdrawFromGoal)
  const user = useFinanceStore((state) => state.user)

  const [mode, setMode] = useState('deposit') // 'deposit' or 'withdraw'
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')

  if (!goal) return null

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const selectedAccount = accounts.find(a => a.id === accountId)

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) return

    if (mode === 'deposit') {
      contributeToGoal(goal.id, num, accountId)
      if (goal.currentAmount + num >= goal.targetAmount) {
        // Trigger celebratory confetti!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#242E25', '#8AAB8F', '#D3E8D6', '#43845A']
          })
        } catch (e) {
          // ignore if canvas unavailable
        }
      }
    } else {
      withdrawFromGoal(goal.id, num, accountId)
    }

    setAmount('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'deposit' ? `Add to ${goal.name}` : `Withdraw from ${goal.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Mode */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAFBF9] border border-brand-border rounded-xl">
          <button
            type="button"
            onClick={() => setMode('deposit')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'deposit' ? 'bg-forest text-white shadow-xs' : 'text-mutedgreen hover:text-forest'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Deposit
          </button>
          <button
            type="button"
            onClick={() => setMode('withdraw')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'withdraw' ? 'bg-forest text-white shadow-xs' : 'text-mutedgreen hover:text-forest'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5" /> Withdraw
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-2 text-center">
            {mode === 'deposit' ? 'Deposit Amount' : 'Withdrawal Amount'}
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={user?.currency || 'USD'}
          />
        </div>

        {/* Account Selection */}
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            {mode === 'deposit' ? 'Deduct From Account' : 'Transfer Into Account'}
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({formatCurrency(acc.balance, user?.currency)})
              </option>
            ))}
          </select>
        </div>

        <div className="p-3 bg-[#FAFBF9] rounded-xl border border-brand-border text-xs flex justify-between items-center text-mutedgreen">
          <span>Remaining to reach goal:</span>
          <strong className="text-forest font-bold">{formatCurrency(remaining, user?.currency)}</strong>
        </div>

        <button
          type="submit"
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          <span>Confirm {mode === 'deposit' ? 'Contribution' : 'Withdrawal'}</span>
        </button>
      </form>
    </Modal>
  )
}

