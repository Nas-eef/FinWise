import React, { useState, useMemo } from 'react'
import { SearchBar } from '../../components/common/SearchBar'
import { TransactionItem } from '../../components/transactions/TransactionItem'
import { TransactionDetailsModal } from './TransactionDetailsModal'
import { EmptyState } from '../../components/common/EmptyState'
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Download, Plus } from 'lucide-react'

export const Transactions = () => {
  const transactions = useFinanceStore((state) => state.transactions)
  const categories = useFinanceStore((state) => state.categories)
  const expenseGroups = useFinanceStore((state) => state.expenseGroups)
  const openAddTransaction = useFinanceStore((state) => state.openAddTransaction)
  const user = useFinanceStore((state) => state.user)

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // 'all', 'expense', 'income'
  const [groupFilter, setGroupFilter] = useState('all')
  const [selectedTx, setSelectedTx] = useState(null)

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false
      if (groupFilter !== 'all' && tx.groupId !== groupFilter) return false

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const cat = categories.find((c) => c.id === tx.categoryId)
        const descMatch = (tx.description || '').toLowerCase().includes(query)
        const noteMatch = (tx.notes || '').toLowerCase().includes(query)
        const catMatch = (cat?.name || '').toLowerCase().includes(query)
        if (!descMatch && !noteMatch && !catMatch) return false
      }
      return true
    })
  }, [transactions, typeFilter, groupFilter, searchQuery, categories])

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups = {}
    filteredTransactions.forEach((tx) => {
      const dateKey = tx.date || 'Undated'
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(tx)
    })
    return groups
  }, [filteredTransactions])

  const handleExport = () => {
    const exportData = filteredTransactions.map((tx) => ({
      Date: tx.date,
      Type: tx.type,
      Description: tx.description,
      Amount: tx.amount,
      Notes: tx.notes || '',
    }))
    exportToCSV(exportData, `FinWise_Transactions_${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Search Bar & CSV Export */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search transactions, notes..."
          />
        </div>
        <button
          onClick={handleExport}
          className="p-2.5 bg-white border border-brand-border hover:bg-[#FAFBF9] rounded-full text-forest transition-colors shadow-subtle"
          title="Export CSV"
          aria-label="Export CSV"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Minimal Type Tabs */}
      <div className="flex p-1 bg-white border border-brand-border rounded-xl text-xs">
        {[
          { id: 'all', label: 'All Activity' },
          { id: 'expense', label: 'Expenses Only' },
          { id: 'income', label: 'Income Only' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id)}
            className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
              typeFilter === tab.id
                ? 'bg-forest text-white shadow-xs'
                : 'text-mutedgreen hover:text-forest'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Expense Group Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setGroupFilter('all')}
          className={`px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all ${
            groupFilter === 'all'
              ? 'bg-forest text-white'
              : 'bg-white border border-brand-border text-mutedgreen hover:text-forest'
          }`}
        >
          All Groups
        </button>
        {expenseGroups.map((grp) => (
          <button
            key={grp.id}
            onClick={() => setGroupFilter(grp.id)}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all ${
              groupFilter === grp.id
                ? 'bg-forest text-white'
                : 'bg-white border border-brand-border text-forest hover:bg-mint/30'
            }`}
          >
            {grp.name}
          </button>
        ))}
      </div>

      {/* Grouped Transactions List */}
      {Object.keys(groupedTransactions).length === 0 ? (
        <EmptyState
          title="No transactions found"
          description="We couldn't find any transactions matching your query."
          actionLabel="Record Transaction"
          onAction={() => openAddTransaction()}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([dateStr, items]) => {
            const dayTotal = items.reduce((sum, item) => {
              return item.type === 'income' ? sum + item.amount : sum - item.amount
            }, 0)

            return (
              <div key={dateStr} className="space-y-2">
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="font-bold text-mutedgreen uppercase tracking-wider">
                    {formatDate(dateStr, 'relative')}
                  </span>
                  <span className={`font-extrabold ${dayTotal >= 0 ? 'text-brand-success' : 'text-forest'}`}>
                    {dayTotal >= 0 ? '+' : ''}{formatCurrency(dayTotal, user?.currency)}
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      onClick={() => setSelectedTx(tx)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  )
}
