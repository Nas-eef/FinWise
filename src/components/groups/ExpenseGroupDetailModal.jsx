import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { CategoryIcon } from '../common/CategoryIcon'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Plus, Trash2, Home, Briefcase, User, Compass, ShoppingBag, Zap, HeartPulse, Folder } from 'lucide-react'

export const ExpenseGroupDetailModal = ({ isOpen, onClose, group }) => {
  const transactions = useFinanceStore((state) => state.transactions)
  const categories = useFinanceStore((state) => state.categories)
  const deleteTransaction = useFinanceStore((state) => state.deleteTransaction)
  const deleteExpenseGroup = useFinanceStore((state) => state.deleteExpenseGroup)
  const openAddTransaction = useFinanceStore((state) => state.openAddTransaction)
  const user = useFinanceStore((state) => state.user)

  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false)
  const [txToDelete, setTxToDelete] = useState(null)

  if (!group) return null

  // Filter expenses belonging to this group
  const groupExpenses = transactions.filter((t) => t.groupId === group.id && t.type === 'expense')
  const totalSpent = groupExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const iconMap = {
    Home,
    Briefcase,
    User,
    Compass,
    ShoppingBag,
    Zap,
    HeartPulse,
  }
  const IconComponent = iconMap[group.icon] || Folder

  const handleAddExpenseToGroup = () => {
    onClose()
    openAddTransaction({ type: 'expense', groupId: group.id })
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={group.name}>
        <div className="space-y-4">
          {/* Group Header Card */}
          <div
            className="p-4 rounded-2xl text-white shadow-subtle flex items-center justify-between"
            style={{ backgroundColor: group.color || '#242E25' }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black truncate">{group.name}</h3>
                <p className="text-[11px] text-white/80">{groupExpenses.length} logged expense items</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-white/70 block">Total Spent</span>
              <span className="text-lg font-black text-white">{formatCurrency(totalSpent, user?.currency)}</span>
            </div>
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={handleAddExpenseToGroup}
            className="w-full py-2.5 px-3 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-subtle active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense to {group.name}</span>
          </button>

          {/* Expenses List Under This Group */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-mutedgreen">
              Expenses in {group.name}
            </h4>

            {groupExpenses.length === 0 ? (
              <div className="p-6 bg-[#FAFBF9] border border-brand-border/60 rounded-xl text-center space-y-1">
                <p className="text-xs font-bold text-forest">No expenses in this group yet</p>
                <p className="text-[11px] text-mutedgreen">
                  Log your PG rent, groceries, food, or bills under this purpose.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {groupExpenses.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId)
                  return (
                    <div
                      key={tx.id}
                      className="p-3 bg-white border border-brand-border/70 rounded-xl flex items-center justify-between shadow-xs hover:bg-[#FAFBF9] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: cat?.color || '#242E25' }}
                        >
                          <CategoryIcon name={cat?.icon || 'HelpCircle'} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-forest truncate">{tx.description || cat?.name}</p>
                          <p className="text-[10px] text-mutedgreen truncate">
                            {cat?.name} • {formatDate(tx.date, 'short')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black text-brand-error whitespace-nowrap">
                          -{formatCurrency(tx.amount, user?.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTxToDelete(tx)}
                          className="p-1 text-mutedgreen hover:text-brand-error rounded-md"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Delete Group Option */}
          <div className="pt-2 border-t border-brand-border/60 flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => setShowDeleteGroupConfirm(true)}
              className="text-brand-error hover:underline text-[11px] font-bold flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Delete This Group
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-[#FAFBF9] border border-brand-border text-forest rounded-lg font-bold text-[11px]"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Group Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteGroupConfirm}
        onClose={() => setShowDeleteGroupConfirm(false)}
        onConfirm={() => {
          deleteExpenseGroup(group.id)
          setShowDeleteGroupConfirm(false)
          onClose()
        }}
        title={`Delete "${group.name}" Group`}
        message={`Are you sure you want to delete "${group.name}"? Expenses inside will remain in activity as general transactions.`}
        confirmText="Delete Group"
      />

      {/* Delete Expense Confirmation */}
      <ConfirmDialog
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={() => {
          if (txToDelete) deleteTransaction(txToDelete.id)
          setTxToDelete(null)
        }}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record?"
        confirmText="Delete Expense"
      />
    </>
  )
}

