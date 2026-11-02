import React from 'react'
import { BottomSheet } from '../common/BottomSheet'
import { useFinanceStore } from '../../store/useFinanceStore'
import { RotateCcw, Check } from 'lucide-react'

export const FilterSheet = ({ isOpen, onClose, filters, setFilters, onReset }) => {
  const categories = useFinanceStore((state) => state.categories)
  const accounts = useFinanceStore((state) => state.accounts)

  const types = [
    { id: 'all', label: 'All' },
    { id: 'expense', label: 'Expenses' },
    { id: 'income', label: 'Income' },
    { id: 'transfer', label: 'Transfers' },
    { id: 'refund', label: 'Refunds' },
  ]

  const datePresets = [
    { id: 'all', label: 'All Time' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_30_days', label: 'Last 30 Days' },
  ]

  const sortOptions = [
    { id: 'date_desc', label: 'Newest First' },
    { id: 'date_asc', label: 'Oldest First' },
    { id: 'amount_desc', label: 'Highest Amount' },
    { id: 'amount_asc', label: 'Lowest Amount' },
  ]

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filter & Sort">
      <div className="space-y-5">
        {/* Type Filter */}
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-2">
            Transaction Type
          </label>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilters({ ...filters, type: t.id })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filters.type === t.id
                    ? 'bg-forest text-white shadow-subtle'
                    : 'bg-[#FAFBF9] border border-brand-border text-forest hover:bg-mint/30'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Preset */}
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-2">
            Date Range
          </label>
          <div className="flex flex-wrap gap-2">
            {datePresets.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setFilters({ ...filters, dateRange: d.id })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filters.dateRange === d.id
                    ? 'bg-forest text-white shadow-subtle'
                    : 'bg-[#FAFBF9] border border-brand-border text-forest hover:bg-mint/30'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Account Filter */}
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-2">
            Account
          </label>
          <select
            value={filters.accountId}
            onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
          >
            <option value="all">All Accounts</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-2">
            Category
          </label>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name} ({cat.type})</option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-2">
            Sort Order
          </label>
          <div className="grid grid-cols-2 gap-2">
            {sortOptions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilters({ ...filters, sortBy: s.id })}
                className={`p-2 rounded-xl text-xs font-semibold text-center transition-all ${
                  filters.sortBy === s.id
                    ? 'bg-forest text-white shadow-subtle'
                    : 'bg-[#FAFBF9] border border-brand-border text-forest hover:bg-mint/30'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-3 px-4 rounded-xl border border-brand-border text-xs font-bold text-forest hover:bg-[#FAFBF9] flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-forest hover:bg-forest/90 text-xs font-bold text-white shadow-subtle flex items-center justify-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" /> Apply Filters
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

