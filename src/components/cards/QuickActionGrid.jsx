import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, MinusCircle, Users, Landmark, SlidersHorizontal } from 'lucide-react'
import { useFinanceStore } from '../../store/useFinanceStore'

export const QuickActionGrid = ({ onOpenFriendNote }) => {
  const navigate = useNavigate()
  const openAddTransaction = useFinanceStore((state) => state.openAddTransaction)

  const primaryActions = [
    {
      id: 'add-expense',
      label: 'Expense',
      icon: MinusCircle,
      color: 'bg-red-50 text-brand-error hover:bg-red-100',
      action: () => openAddTransaction({ type: 'expense' }),
    },
    {
      id: 'add-income',
      label: 'Income',
      icon: PlusCircle,
      color: 'bg-emerald-50 text-brand-success hover:bg-emerald-100',
      action: () => openAddTransaction({ type: 'income' }),
    },
    {
      id: 'friend-note',
      label: 'Friend Note',
      icon: Users,
      color: 'bg-mint/60 text-forest hover:bg-mint',
      action: onOpenFriendNote || (() => navigate('/friends-notes')),
    },
    {
      id: 'loans',
      label: 'Loans & EMI',
      icon: Landmark,
      color: 'bg-[#F2F5F2] text-forest hover:bg-mint/40',
      action: () => navigate('/loans'),
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-2">
      {primaryActions.map((btn) => {
        const Icon = btn.icon
        return (
          <button
            key={btn.id}
            onClick={btn.action}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-brand-border/70 shadow-subtle hover:border-forest/20 active:scale-95 transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${btn.color}`}>
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-bold text-forest group-hover:text-forest/80 text-center leading-tight">
              {btn.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
