import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CategoryIcon } from '../../components/common/CategoryIcon'
import { AddAccountModal } from './AddAccountModal'
import { TransferModal } from './TransferModal'
import { formatCurrency } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Plus, ArrowLeftRight, ChevronRight, Wallet } from 'lucide-react'

export const Accounts = () => {
  const navigate = useNavigate()
  const accounts = useFinanceStore((state) => state.accounts)
  const transactions = useFinanceStore((state) => state.transactions)
  const user = useFinanceStore((state) => state.user)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)

  const totalBalance = accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0)

  // Count transactions per account
  const getTxCount = (accId) => {
    return transactions.filter(t => t.accountId === accId || t.fromAccountId === accId || t.toAccountId === accId).length
  }

  return (
    <div className="space-y-5 pb-20">
      {/* Prominent Net Worth / Balance Header */}
      <div className="bg-forest text-white rounded-card-lg p-6 shadow-float relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-sage/20 rounded-full blur-xl" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-mint/80 block mb-1">
          Total Net Balance
        </span>
        <h1 className="text-3xl font-black tracking-tight">
          {formatCurrency(totalBalance, user?.currency)}
        </h1>
        <p className="text-xs text-mint/70 mt-1">
          {accounts.length} connected accounts
        </p>

        {/* Action buttons inside banner */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/10">
          <button
            onClick={() => setIsTransferOpen(true)}
            className="flex-1 py-2.5 px-3 bg-mint/20 hover:bg-mint/30 rounded-xl text-xs font-bold text-mint flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" /> Transfer
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex-1 py-2.5 px-3 bg-white text-forest hover:bg-mint rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-subtle transition-colors"
          >
            <Plus className="w-4 h-4" /> New Account
          </button>
        </div>
      </div>

      {/* Account Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-forest">Accounts Overview</h3>
          <span className="text-xs text-mutedgreen font-medium">Tap for history</span>
        </div>

        <div className="space-y-3">
          {accounts.map((acc) => {
            const txCount = getTxCount(acc.id)
            return (
              <div
                key={acc.id}
                onClick={() => navigate(`/accounts/${acc.id}`)}
                className="p-4 bg-white border border-brand-border/70 rounded-card shadow-subtle hover:border-forest/20 cursor-pointer active:scale-[0.99] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: acc.color || '#242E25' }}
                    >
                      <CategoryIcon name={acc.icon || 'Landmark'} className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-forest group-hover:text-forest/80">
                          {acc.name}
                        </h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAFBF9] border border-brand-border text-mutedgreen">
                          {acc.type}
                        </span>
                      </div>
                      <p className="text-xs text-mutedgreen mt-0.5">
                        {acc.accountNumber} • {txCount} transactions
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm font-extrabold text-forest">
                        {formatCurrency(acc.balance, user?.currency)}
                      </p>
                      <p className="text-[11px] text-brand-success font-medium">Active</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-mutedgreen group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modals */}
      <AddAccountModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />
    </div>
  )
}

