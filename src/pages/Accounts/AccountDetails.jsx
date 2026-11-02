import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CategoryIcon } from '../../components/common/CategoryIcon'
import { TransactionItem } from '../../components/transactions/TransactionItem'
import { TransactionDetailsModal } from '../Transactions/TransactionDetailsModal'
import { TransferModal } from './TransferModal'
import { AddAccountModal } from './AddAccountModal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { EmptyState } from '../../components/common/EmptyState'
import { formatCurrency } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { ArrowLeftRight, Edit3, Trash2, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export const AccountDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const accounts = useFinanceStore((state) => state.accounts)
  const transactions = useFinanceStore((state) => state.transactions)
  const deleteAccount = useFinanceStore((state) => state.deleteAccount)
  const openAddTransaction = useFinanceStore((state) => state.openAddTransaction)
  const user = useFinanceStore((state) => state.user)

  const [selectedTx, setSelectedTx] = useState(null)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const account = accounts.find(a => a.id === id)

  if (!account) {
    return (
      <div className="py-12">
        <EmptyState
          title="Account not found"
          description="The account you are looking for does not exist or has been removed."
          actionLabel="Back to Accounts"
          onAction={() => navigate('/accounts')}
        />
      </div>
    )
  }

  // Filter transactions for this specific account
  const accountTransactions = transactions.filter(t => 
    t.accountId === account.id || t.fromAccountId === account.id || t.toAccountId === account.id
  )

  const totalIncome = accountTransactions
    .filter(t => (t.type === 'income' && t.accountId === account.id) || (t.type === 'transfer' && t.toAccountId === account.id))
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const totalExpense = accountTransactions
    .filter(t => (t.type === 'expense' && t.accountId === account.id) || (t.type === 'transfer' && t.fromAccountId === account.id))
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const handleDelete = () => {
    deleteAccount(account.id)
    navigate('/accounts')
  }

  return (
    <div className="space-y-5 pb-20">
      {/* Account Card Banner */}
      <div
        className="rounded-card-lg p-6 text-white shadow-float relative overflow-hidden"
        style={{ backgroundColor: account.color || '#242E25' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <CategoryIcon name={account.icon || 'Landmark'} className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-white/70 font-bold block">
                {account.type}
              </span>
              <h2 className="text-xl font-bold">{account.name}</h2>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 bg-white/20 rounded-full font-mono text-white/90">
            {account.accountNumber}
          </span>
        </div>

        <div className="my-3">
          <p className="text-xs text-white/70">Available Balance</p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-0.5">
            {formatCurrency(account.balance, user?.currency)}
          </h1>
        </div>

        {/* In / Out Summary */}
        <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-white/15 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-mint">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] text-white/70 uppercase">Inflow</p>
              <p className="font-bold">+{formatCurrency(totalIncome, user?.currency)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-red-200">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] text-white/70 uppercase">Outflow</p>
              <p className="font-bold">-{formatCurrency(totalExpense, user?.currency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Action Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setIsTransferOpen(true)}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-brand-border/70 text-forest shadow-subtle hover:bg-mint/40 active:scale-95 transition-all"
        >
          <ArrowLeftRight className="w-4 h-4 text-forest mb-1" />
          <span className="text-[11px] font-bold">Transfer</span>
        </button>

        <button
          onClick={() => openAddTransaction({ accountId: account.id })}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-brand-border/70 text-forest shadow-subtle hover:bg-mint/40 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 text-forest mb-1" />
          <span className="text-[11px] font-bold">Add Entry</span>
        </button>

        <button
          onClick={() => setIsEditOpen(true)}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-brand-border/70 text-forest shadow-subtle hover:bg-mint/40 active:scale-95 transition-all"
        >
          <Edit3 className="w-4 h-4 text-forest mb-1" />
          <span className="text-[11px] font-bold">Edit</span>
        </button>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-red-200 text-brand-error shadow-subtle hover:bg-red-50 active:scale-95 transition-all"
        >
          <Trash2 className="w-4 h-4 mb-1" />
          <span className="text-[11px] font-bold">Delete</span>
        </button>
      </div>

      {/* Account Transaction History */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-forest">
            Transaction History ({accountTransactions.length})
          </h3>
        </div>

        {accountTransactions.length === 0 ? (
          <EmptyState
            title="No transactions for this account"
            description="Start recording income, expense or transfers with this account."
            actionLabel="Add Transaction"
            onAction={() => openAddTransaction({ accountId: account.id })}
          />
        ) : (
          <div className="space-y-2">
            {accountTransactions.map(tx => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onClick={() => setSelectedTx(tx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TransactionDetailsModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        initialFromAccountId={account.id}
      />

      <AddAccountModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        accountToEdit={account}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Account"
        message={`Are you sure you want to delete ${account.name}? This will remove the account from your dashboard.`}
      />
    </div>
  )
}

