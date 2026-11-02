import React from 'react'
import { useFinanceStore } from '../../store/useFinanceStore'
import { EmptyState } from '../../components/common/EmptyState'
import { Bell, CheckCheck, TrendingUp, AlertTriangle, ShieldCheck, Clock } from 'lucide-react'

export const Notifications = () => {
  const notifications = useFinanceStore((state) => state.notifications)
  const markNotificationAsRead = useFinanceStore((state) => state.markNotificationAsRead)
  const markAllNotificationsAsRead = useFinanceStore((state) => state.markAllNotificationsAsRead)

  const getIcon = (type) => {
    switch (type) {
      case 'income':
        return <TrendingUp className="w-5 h-5 text-brand-success" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-brand-warning" />
      case 'success':
        return <ShieldCheck className="w-5 h-5 text-forest" />
      default:
        return <Clock className="w-5 h-5 text-sage" />
    }
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-bold text-forest">Notifications Inbox</h3>
        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1.5 text-xs font-bold text-forest hover:text-sage transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description="You do not have any unread financial notifications right now."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              className={`flex items-start gap-3 p-4 bg-white border rounded-2xl shadow-subtle cursor-pointer transition-all ${
                notif.read ? 'border-brand-border/60 opacity-75' : 'border-forest/40 ring-1 ring-mint'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-[#FAFBF9] border border-brand-border shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-xs font-bold text-forest">{notif.title}</h4>
                  <span className="text-[10px] text-mutedgreen">{notif.time}</span>
                </div>
                <p className="text-xs text-mutedgreen leading-relaxed">{notif.message}</p>
              </div>

              {!notif.read && (
                <span className="w-2 h-2 rounded-full bg-brand-success shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

