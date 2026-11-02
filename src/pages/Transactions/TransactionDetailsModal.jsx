import React, { useState } from 'react'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { CategoryIcon } from '../../components/common/CategoryIcon'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Edit2, Trash2, Calendar, FileText } from 'lucide-react'

export const TransactionDetailsModal = ({ transaction, isOpen, onClose }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const openAddTransaction = useFinanceStore((state) => state.openAddTransaction)
  const deleteTransaction = useFinanceStore((state) => state.deleteTransaction)
  const categories = useFinanceStore((state) => state.categories)
  const user = useFinanceStore((state) => state.user)

  if (!transaction) return null

  const category = categories.find((c) => c.id === transaction.categoryId)
  const isExpense = transaction.type === 'expense'

  const handleEdit = () => {
    onClose()
    openAddTransaction(transaction)
  }

  const handleDelete = () => {
    deleteTransaction(transaction.id)
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Transaction Details">
        <div className="space-y-5">
          {/* Header Amount */}
          <div className="text-center py-4 bg-[#FAFBF9] rounded-2xl border border-brand-border">
            <div
              className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white mb-2 shadow-xs"
              style={{ backgroundColor: category?.color || '#242E25' }}
            >
              <CategoryIcon name={category?.icon || 'HelpCircle'} className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black text-forest">
              {isExpense ? '-' : '+'}{formatCurrency(transaction.amount, user?.currency)}
            </h3>
            <span className={`inline-block mt-1 px-3 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full ${
              isExpense ? 'bg-red-50 text-brand-error' : 'bg-emerald-50 text-brand-success'
            }`}>
              {transaction.type}
            </span>
          </div>

          {/* Details list */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-brand-border/60">
              <span className="text-mutedgreen flex items-center gap-2">
                <FileText className="w-4 h-4" /> Description
              </span>
              <span className="font-bold text-forest">{transaction.description}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-brand-border/60">
              <span className="text-mutedgreen flex items-center gap-2">
                <CategoryIcon name="Grid" className="w-4 h-4" /> Category
              </span>
              <span className="font-bold text-forest">{category?.name || 'Uncategorized'}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-brand-border/60">
              <span className="text-mutedgreen flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Date
              </span>
              <span className="font-bold text-forest">{formatDate(transaction.date)}</span>
            </div>

            {transaction.notes && (
              <div className="py-2 border-b border-brand-border/60">
                <span className="text-mutedgreen block mb-1">Note</span>
                <p className="text-forest bg-[#FAFBF9] p-2.5 rounded-xl border border-brand-border leading-relaxed font-medium">
                  {transaction.notes}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-red-200 text-xs font-bold text-brand-error hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
            <button
              onClick={handleEdit}
              className="flex-1 py-2.5 px-4 rounded-xl bg-forest hover:bg-forest/90 text-xs font-bold text-white shadow-subtle flex items-center justify-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? Your total balance will automatically update."
      />
    </>
  )
}
