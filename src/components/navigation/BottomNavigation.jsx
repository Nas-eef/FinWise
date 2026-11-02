import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, ArrowLeftRight, BarChart2, User, Plus } from 'lucide-react'
import { useFinanceStore } from '../../store/useFinanceStore'

export const BottomNavigation = () => {
  const openAddTransaction = useFinanceStore((state) => state.openAddTransaction)

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/activity', label: 'Activity', icon: ArrowLeftRight },
    { type: 'button', label: 'Add', icon: Plus },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
    { to: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-border/80 shadow-nav safe-bottom transition-all">
      <div className="w-full max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          if (item.type === 'button') {
            return (
              <button
                key="add-btn"
                type="button"
                onClick={() => openAddTransaction()}
                className="-mt-5 flex flex-col items-center justify-center group focus:outline-none shrink-0"
                aria-label="Add Transaction"
              >
                <div className="w-12 h-12 rounded-full bg-forest text-white shadow-float group-hover:scale-105 active:scale-95 transition-transform flex items-center justify-center border-4 border-[#F7F9F7]">
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-forest mt-0.5">Add</span>
              </button>
            )
          }

          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all min-w-[56px] ${
                  isActive
                    ? 'text-forest font-bold'
                    : 'text-mutedgreen hover:text-forest font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-mint/60' : ''}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5 text-center truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
