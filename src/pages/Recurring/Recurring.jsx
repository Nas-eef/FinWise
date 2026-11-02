import React, { useState } from 'react'
import { CategoryIcon } from '../../components/common/CategoryIcon'
import { RecurringModal } from './RecurringModal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Plus, PauseCircle, PlayCircle, Trash2, Calendar, RefreshCw } from 'lucide-react'

export const Recurring = () => {
  const recurring = useFinanceStore((state) => state.recurring)
  const categories = useFinanceStore((state) => state.categories)
  const toggleRecurringStatus = useFinanceStore((state) => state.toggleRecurringStatus)
  const deleteRecurring = useFinanceStore((state) => state.deleteRecurring)
  const user = useFinanceStore((state) => state.user)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedToEdit, setSelectedToEdit] = useState(null)
  const [selectedToDelete, setSelectedToDelete] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const totalMonthly = recurring
    .filter(r => r.status === 'active')
    .reduce((sum, r) => sum + (r.amount || 0), 0)

  const filtered = recurring.filter(r => {
    if (statusFilter === 'active') return r.status === 'active'
    if (statusFilter === 'paused') return r.status === 'paused'
    return true
  })

  return (
    <div className="space-y-5 pb-20">
      {/* Banner */}
      <div className="bg-forest text-white rounded-card-lg p-6 shadow-float relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-sage/20 rounded-full blur-xl" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-mint/80 block mb-1">
          Monthly Subscriptions & Autopay
        </span>
        <h1 className="text-3xl font-black tracking-tight">
          {formatCurrency(totalMonthly, user?.currency)}
        </h1>
        <p className="text-xs text-mint/70 mt-1">
          {recurring.filter(r => r.status === 'active').length} active subscriptions
        </p>
      </div>

      {/* Tabs and Add Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 p-1 bg-white border border-brand-border rounded-2xl flex text-xs">
          {['all', 'active', 'paused'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 py-1.5 font-bold rounded-xl capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-forest text-white shadow-subtle'
                  : 'text-mutedgreen hover:text-forest'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setSelectedToEdit(null)
            setIsAddOpen(true)
          }}
          className="p-2.5 bg-forest hover:bg-forest/90 text-white rounded-2xl shadow-subtle active:scale-95 transition-all flex items-center justify-center shrink-0"
          aria-label="Add Subscription"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Subscription Cards */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const category = categories.find(c => c.id === item.categoryId)
          const isPaused = item.status === 'paused'

          return (
            <div
              key={item.id}
              className={`p-4 bg-white border rounded-card shadow-subtle transition-all ${
                isPaused ? 'border-brand-border/40 opacity-70' : 'border-brand-border/80'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: category?.color || '#242E25' }}
                  >
                    <CategoryIcon name={category?.icon || 'RefreshCw'} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-forest">{item.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-mutedgreen">
                      <span>{item.frequency}</span>
                      <span>•</span>
                      <span>Due {formatDate(item.nextDueDate, 'short')}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-forest">
                    {formatCurrency(item.amount, user?.currency)}
                  </span>
                  <span className={`block text-[10px] font-bold uppercase ${
                    isPaused ? 'text-mutedgreen' : 'text-brand-success'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-brand-border/40 text-xs">
                <button
                  onClick={() => toggleRecurringStatus(item.id)}
                  className="flex items-center gap-1.5 font-semibold text-forest hover:text-sage transition-colors"
                >
                  {isPaused ? (
                    <>
                      <PlayCircle className="w-4 h-4 text-brand-success" /> Resume Subscription
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-4 h-4 text-brand-warning" /> Pause Subscription
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedToEdit(item)
                      setIsAddOpen(true)
                    }}
                    className="p-1.5 text-mutedgreen hover:text-forest transition-colors"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setSelectedToDelete(item)}
                    className="p-1.5 text-mutedgreen hover:text-brand-error transition-colors"
                    title="Cancel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      <RecurringModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false)
          setSelectedToEdit(null)
        }}
        recurringToEdit={selectedToEdit}
      />

      <ConfirmDialog
        isOpen={!!selectedToDelete}
        onClose={() => setSelectedToDelete(null)}
        onConfirm={() => {
          if (selectedToDelete) deleteRecurring(selectedToDelete.id)
          setSelectedToDelete(null)
        }}
        title="Cancel Recurring Subscription"
        message={`Are you sure you want to stop tracking "${selectedToDelete?.name}"?`}
      />
    </div>
  )
}

