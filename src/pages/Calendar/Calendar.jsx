import React, { useState } from 'react'
import { ReminderModal } from './ReminderModal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Calendar as CalendarIcon, Plus, CheckCircle, Circle, Trash2, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

export const Calendar = () => {
  const reminders = useFinanceStore((state) => state.reminders) || []
  const toggleReminder = useFinanceStore((state) => state.toggleReminder)
  const deleteReminder = useFinanceStore((state) => state.deleteReminder)
  const user = useFinanceStore((state) => state.user)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [reminderToDelete, setReminderToDelete] = useState(null)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  // First day of month (0 = Sun, 1 = Mon...)
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  // Total days in current month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate()

  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1)
  const leadingBlanks = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  const changeMonth = (delta) => {
    setViewDate(new Date(year, month + delta, 1))
  }

  // Days that have reminders in this month
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const reminderDaysInMonth = new Set(
    reminders
      .filter((r) => r.dueDate && r.dueDate.startsWith(monthPrefix))
      .map((r) => parseInt(r.dueDate.split('-')[2]))
  )

  const filteredReminders = reminders
    .filter((r) => {
      if (activeTab === 'upcoming') return !r.completed
      if (activeTab === 'completed') return r.completed
      return true
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  return (
    <div className="space-y-5 pb-20">
      {/* Month Header and Mini Calendar Widget */}
      <div className="bg-white border border-brand-border/80 rounded-card-lg p-5 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-mutedgreen">
              Financial Calendar
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-lg font-black text-forest">{monthName}</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-1 text-mutedgreen hover:text-forest rounded-lg hover:bg-brand-bg transition-colors"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-1 text-mutedgreen hover:text-forest rounded-lg hover:bg-brand-bg transition-colors"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-forest text-mint rounded-xl text-xs font-bold shadow-subtle hover:bg-forest/90 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Reminder
          </button>
        </div>

        {/* Calendar Day Labels */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-mutedgreen mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Leading blank slots for days before 1st of month */}
          {leadingBlanks.map((b) => (
            <div key={`blank-${b}`} className="h-10" />
          ))}

          {daysArray.map((day) => {
            const hasReminder = reminderDaysInMonth.has(day)
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isSelected = selectedDate === dateStr
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear()

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`relative h-10 flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-forest text-white shadow-subtle'
                    : isToday
                    ? 'bg-mint/60 text-forest font-black ring-1 ring-forest'
                    : 'bg-[#FAFBF9] hover:bg-mint/30 text-forest'
                }`}
              >
                <span>{day}</span>
                {hasReminder && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected ? 'bg-mint' : 'bg-[#D9534F]'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex p-1 bg-white border border-brand-border rounded-2xl text-xs flex-1">
          {['upcoming', 'completed', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-forest text-mint shadow-subtle'
                  : 'text-mutedgreen hover:text-forest'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {filteredReminders.length === 0 ? (
          <div className="w-full p-8 text-center bg-white border border-brand-border/70 rounded-2xl space-y-1">
            <Clock className="w-8 h-8 text-sage mx-auto mb-2 opacity-60" />
            <p className="text-xs font-bold text-forest">No reminders found</p>
            <p className="text-[11px] text-mutedgreen">
              Add upcoming bill dues, EMIs, or subscription dates to track them here.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-3 px-3 py-1.5 bg-forest text-mint text-xs font-bold rounded-xl shadow-sm"
            >
              Add Reminder
            </button>
          </div>
        ) : (
          filteredReminders.map((rem) => (
            <div
              key={rem.id}
              className={`flex items-center justify-between p-4 bg-white border rounded-card shadow-subtle transition-all ${
                rem.completed ? 'border-brand-border/40 opacity-70' : 'border-brand-border/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleReminder(rem.id)}
                  className="text-forest hover:text-sage transition-colors p-1"
                  aria-label="Toggle completed"
                >
                  {rem.completed ? (
                    <CheckCircle className="w-5 h-5 text-brand-success" />
                  ) : (
                    <Circle className="w-5 h-5 text-mutedgreen" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-bold text-forest ${rem.completed ? 'line-through text-mutedgreen' : ''}`}>
                      {rem.title}
                    </h4>
                    {rem.type && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAFBF9] border border-brand-border text-mutedgreen uppercase">
                        {rem.type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-mutedgreen mt-0.5">
                    <span>Due {formatDate(rem.dueDate, 'relative')}</span>
                    {rem.priority === 'high' && (
                      <span className="text-brand-error font-semibold text-[10px]">High Priority</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-extrabold text-forest">
                    {formatCurrency(rem.amount, user?.currency)}
                  </p>
                  <span className={`text-[10px] font-bold uppercase ${
                    rem.completed ? 'text-brand-success' : 'text-brand-warning'
                  }`}>
                    {rem.completed ? 'Paid' : 'Due'}
                  </span>
                </div>

                <button
                  onClick={() => setReminderToDelete(rem)}
                  className="p-1.5 text-mutedgreen hover:text-brand-error transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <ReminderModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!reminderToDelete}
        onClose={() => setReminderToDelete(null)}
        onConfirm={() => {
          if (reminderToDelete) deleteReminder(reminderToDelete.id)
          setReminderToDelete(null)
        }}
        title="Delete Reminder"
        message={`Are you sure you want to delete "${reminderToDelete?.title}"?`}
      />
    </div>
  )
}
