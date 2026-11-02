import React from 'react'
import { CategoryIcon } from '../common/CategoryIcon'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'

export const TransactionItem = ({ transaction, onClick }) => {
  const categories = useFinanceStore((state) => state.categories)
  const user = useFinanceStore((state) => state.user)

  const category = categories.find((c) => c.id === transaction.categoryId)
  const isExpense = transaction.type === 'expense'

  return (
    <div
      onClick={onClick}
      className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-[#FAFBF9] border border-brand-border/70 rounded-2xl shadow-subtle transition-all cursor-pointer active:scale-[0.99] group overflow-hidden"
    >
      {/* Left icon and description */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
          style={{ backgroundColor: category?.color || '#242E25' }}
        >
          <CategoryIcon name={category?.icon || 'HelpCircle'} className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-forest truncate group-hover:text-forest/80">
            {transaction.description}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-mutedgreen mt-0.5 truncate">
            <span className="shrink-0 font-medium">{category?.name || 'General'}</span>
            {transaction.notes && (
              <span className="truncate text-mutedgreen/70 italic">• {transaction.notes}</span>
            )}
          </div>
        </div>
      </div>

      {/* Right amount and date */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-black whitespace-nowrap ${isExpense ? 'text-forest' : 'text-brand-success'}`}>
          {isExpense ? '-' : '+'}{formatCurrency(transaction.amount, user?.currency)}
        </p>
        <p className="text-[11px] text-mutedgreen mt-0.5 whitespace-nowrap">
          {formatDate(transaction.date, 'short')}
        </p>
      </div>
    </div>
  )
}
