import React, { useState } from 'react'
import { CategoryIcon } from '../../components/common/CategoryIcon'
import { CategoryModal } from './CategoryModal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { SearchBar } from '../../components/common/SearchBar'
import { useFinanceStore } from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatters'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export const Categories = () => {
  const categories = useFinanceStore((state) => state.categories)
  const transactions = useFinanceStore((state) => state.transactions)
  const deleteCategory = useFinanceStore((state) => state.deleteCategory)
  const user = useFinanceStore((state) => state.user)

  const [activeTab, setActiveTab] = useState('expense')
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState(null)
  const [categoryToDelete, setCategoryToDelete] = useState(null)

  const filtered = categories.filter(c => {
    if (c.type !== activeTab) return false
    if (search.trim()) {
      return c.name.toLowerCase().includes(search.toLowerCase())
    }
    return true
  })

  // Calculate total spent/earned per category
  const getCategoryStats = (catId) => {
    const catTxs = transactions.filter(t => t.categoryId === catId)
    const total = catTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    return { count: catTxs.length, total }
  }

  const handleEdit = (cat, e) => {
    e.stopPropagation()
    setCategoryToEdit(cat)
    setIsModalOpen(true)
  }

  const handleDelete = (cat, e) => {
    e.stopPropagation()
    setCategoryToDelete(cat)
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Tab Switcher & Add Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 p-1 bg-white border border-brand-border rounded-2xl flex">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'expense'
                ? 'bg-forest text-white shadow-subtle'
                : 'text-mutedgreen hover:text-forest'
            }`}
          >
            Expenses ({categories.filter(c => c.type === 'expense').length})
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'income'
                ? 'bg-forest text-white shadow-subtle'
                : 'text-mutedgreen hover:text-forest'
            }`}
          >
            Income ({categories.filter(c => c.type === 'income').length})
          </button>
        </div>

        <button
          onClick={() => {
            setCategoryToEdit(null)
            setIsModalOpen(true)
          }}
          className="p-2.5 bg-forest hover:bg-forest/90 text-white rounded-2xl shadow-subtle active:scale-95 transition-all flex items-center justify-center shrink-0"
          aria-label="Add Category"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={`Search ${activeTab} categories...`}
      />

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filtered.map((cat) => {
          const stats = getCategoryStats(cat.id)
          return (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3.5 bg-white border border-brand-border/70 rounded-2xl shadow-subtle hover:border-forest/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon name={cat.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-forest">{cat.name}</h4>
                  <p className="text-xs text-mutedgreen">
                    {stats.count} transactions • {formatCurrency(stats.total, user?.currency)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                <button
                  onClick={(e) => handleEdit(cat, e)}
                  className="p-1.5 text-mutedgreen hover:text-forest hover:bg-mint/40 rounded-lg transition-colors"
                  aria-label="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDelete(cat, e)}
                  className="p-1.5 text-mutedgreen hover:text-brand-error hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setCategoryToEdit(null)
        }}
        categoryToEdit={categoryToEdit}
        defaultType={activeTab}
      />

      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) deleteCategory(categoryToDelete.id)
          setCategoryToDelete(null)
        }}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? Transactions assigned to it will remain but become uncategorized.`}
      />
    </div>
  )
}

