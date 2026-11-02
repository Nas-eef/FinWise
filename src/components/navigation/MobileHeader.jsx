import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, ArrowLeft } from 'lucide-react'
import { useFinanceStore } from '../../store/useFinanceStore'

export const MobileHeader = ({ title, showBack = false, rightAction }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useFinanceStore((state) => state.user)
  const notifications = useFinanceStore((state) => state.notifications)
  const unreadCount = notifications.filter(n => !n.read).length

  const isHome = location.pathname === '/'

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <header className="sticky top-0 z-30 w-full bg-[#F7F9F7]/95 backdrop-blur-md px-4 pt-3 pb-3 border-b border-brand-border/40 safe-top">
      <div className="w-full flex items-center justify-between">
        {isHome ? (
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-[10px] font-bold text-mutedgreen uppercase tracking-wider">{currentDate}</p>
            <h2 className="text-base font-extrabold text-forest leading-tight truncate">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
            </h2>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 -ml-1 text-forest hover:bg-mint/40 rounded-full transition-colors active:scale-95 shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
            )}
            <h2 className="text-lg font-extrabold text-forest tracking-tight truncate">{title}</h2>
          </div>
        )}

        {/* Right contextual items */}
        <div className="flex items-center gap-2 shrink-0">
          {rightAction ? (
            rightAction
          ) : (
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 text-forest hover:bg-mint/40 rounded-full transition-colors active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 stroke-[2]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-brand-error text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-[#F7F9F7]">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
