import React, { useState } from 'react'
import { useFinanceStore } from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatters'
import { ExpenseGroupModal } from './ExpenseGroupModal'
import { ExpenseGroupDetailModal } from './ExpenseGroupDetailModal'
import {
  FolderPlus, Home, Briefcase, User, Compass, ShoppingBag,
  Zap, HeartPulse, Folder, ChevronRight, Layers
} from 'lucide-react'

export const ExpenseGroupsSection = () => {
  const expenseGroups = useFinanceStore((state) => state.expenseGroups)
  const transactions = useFinanceStore((state) => state.transactions)
  const user = useFinanceStore((state) => state.user)

  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)

  const iconMap = {
    Home,
    Briefcase,
    User,
    Compass,
    ShoppingBag,
    Zap,
    HeartPulse,
  }

  // Calculate totals per group
  const getGroupStats = (groupId) => {
    const groupTxs = transactions.filter((t) => t.groupId === groupId && t.type === 'expense')
    const total = groupTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    return { total, count: groupTxs.length }
  }

  return (
    <>
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mutedgreen flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sage" /> Expense Groups (Purposes)
          </h3>
          <button
            type="button"
            onClick={() => setIsAddGroupOpen(true)}
            className="text-xs font-bold text-forest hover:text-sage flex items-center gap-1"
          >
            <FolderPlus className="w-3.5 h-3.5" /> + New Group
          </button>
        </div>

        {/* Groups Grid */}
        {expenseGroups.length === 0 ? (
          <div
            onClick={() => setIsAddGroupOpen(true)}
            className="w-full p-4 bg-white border border-dashed border-brand-border/90 rounded-2xl text-center cursor-pointer hover:border-forest/40 transition-all group"
          >
            <FolderPlus className="w-6 h-6 mx-auto mb-1 text-sage group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-forest">No expense groups yet</p>
            <p className="text-[10px] text-mutedgreen mt-0.5">
              Tap to create your first group (e.g. PG Expenses, Trip to Goa, Wedding)
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {expenseGroups.map((group) => {
              const IconComponent = iconMap[group.icon] || Folder
              const { total, count } = getGroupStats(group.id)

              return (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className="p-3.5 bg-white border border-brand-border/80 rounded-2xl shadow-subtle hover:border-forest/30 cursor-pointer transition-all active:scale-[0.98] group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: group.color || '#26A69A' }}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-mutedgreen bg-[#FAFBF9] px-1.5 py-0.5 rounded border border-brand-border/50">
                        {count} items
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-forest truncate group-hover:text-forest/80">
                      {group.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-brand-border/40 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-forest">
                      {formatCurrency(total, user?.currency)}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-mutedgreen group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create New Group Modal */}
      <ExpenseGroupModal
        isOpen={isAddGroupOpen}
        onClose={() => setIsAddGroupOpen(false)}
      />

      {/* Group Detail & Add Expense Modal */}
      <ExpenseGroupDetailModal
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        group={selectedGroup}
      />
    </>
  )
}

