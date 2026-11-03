import React, { useState } from 'react'
import { useFinanceStore } from '../../store/useFinanceStore'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { scheduleLocalNotification } from '../../utils/nativeNotifications'
import {
  Calendar, Clock, User, Phone, Mail, MapPin, CheckCircle2,
  AlertCircle, Plus, Search, Edit3, Trash2, X, ChevronRight,
  MessageCircle, ExternalLink, Filter, CalendarCheck, Check
} from 'lucide-react'

const STATUS_FILTERS = ['Upcoming', 'Today', 'Completed', 'All']

const PRIORITY_THEMES = {
  urgent: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Urgent' },
  high: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'High' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Medium' },
  low: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Low' },
}

export const MeetingsManager = () => {
  const meetings = useFinanceStore((state) => state.meetings) || []
  const addMeeting = useFinanceStore((state) => state.addMeeting)
  const updateMeeting = useFinanceStore((state) => state.updateMeeting)
  const deleteMeeting = useFinanceStore((state) => state.deleteMeeting)
  const toggleMeetingStatus = useFinanceStore((state) => state.toggleMeetingStatus)

  const [activeTab, setActiveTab] = useState('Upcoming')
  const [searchQuery, setSearchQuery] = useState('')

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState(null)
  const [meetingToDelete, setMeetingToDelete] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactRole: '',
    followupDate: '',
    followupTime: '10:00',
    priority: 'medium',
    status: 'scheduled',
    location: '',
    notes: '',
  })

  // Date helpers
  const todayStr = new Date().toISOString().split('T')[0]

  // Filter meetings
  const filteredMeetings = meetings.filter((m) => {
    const meetingDateStr = m.followupDate ? m.followupDate.split('T')[0] : ''
    const isCompleted = m.status === 'completed'

    // Status Tab filtering
    if (activeTab === 'Upcoming') {
      if (isCompleted || meetingDateStr < todayStr) return false
    } else if (activeTab === 'Today') {
      if (meetingDateStr !== todayStr) return false
    } else if (activeTab === 'Completed') {
      if (!isCompleted) return false
    }

    // Search query
    const matchesSearch =
      m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.contactRole?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.notes?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  const handleOpenAdd = () => {
    setEditingMeeting(null)
    const now = new Date()
    now.setDate(now.getDate() + 1)
    const defaultDate = now.toISOString().split('T')[0]

    setFormData({
      title: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      contactRole: '',
      followupDate: defaultDate,
      followupTime: '10:00',
      priority: 'medium',
      status: 'scheduled',
      location: 'Google Meet / Call',
      notes: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (m) => {
    setEditingMeeting(m)
    let d = ''
    let t = '10:00'
    if (m.followupDate) {
      const parts = m.followupDate.split('T')
      d = parts[0]
      if (parts[1]) t = parts[1].substring(0, 5)
    }

    setFormData({
      title: m.title,
      contactName: m.contactName || '',
      contactPhone: m.contactPhone || '',
      contactEmail: m.contactEmail || '',
      contactRole: m.contactRole || '',
      followupDate: d || todayStr,
      followupTime: t,
      priority: m.priority || 'medium',
      status: m.status || 'scheduled',
      location: m.location || '',
      notes: m.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    const combinedDateTime = `${formData.followupDate}T${formData.followupTime}:00`

    if (editingMeeting) {
      await updateMeeting(editingMeeting.id, {
        title: formData.title.trim(),
        contactName: formData.contactName.trim(),
        contactPhone: formData.contactPhone.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactRole: formData.contactRole.trim(),
        followupDate: combinedDateTime,
        priority: formData.priority,
        status: formData.status,
        location: formData.location.trim(),
        notes: formData.notes.trim(),
      })
    } else {
      await addMeeting({
        title: formData.title.trim(),
        contactName: formData.contactName.trim(),
        contactPhone: formData.contactPhone.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactRole: formData.contactRole.trim(),
        followupDate: combinedDateTime,
        priority: formData.priority,
        status: formData.status,
        location: formData.location.trim(),
        notes: formData.notes.trim(),
      })

      // Schedule local push notification reminder 1 hour before
      const targetTime = new Date(combinedDateTime).getTime() - 60 * 60 * 1000
      if (targetTime > Date.now()) {
        scheduleLocalNotification({
          id: Math.floor(Math.random() * 100000),
          title: `Meeting Alert: ${formData.title}`,
          body: `Upcoming follow-up with ${formData.contactName || 'contact'} at ${formData.followupTime}`,
          scheduleAt: new Date(targetTime),
        }).catch(() => {})
      }
    }

    setIsModalOpen(false)
  }

  const formatDateTime = (dtStr) => {
    if (!dtStr) return ''
    try {
      const d = new Date(dtStr)
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dtStr
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="bg-white border border-brand-border/80 rounded-card p-4 shadow-subtle flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-forest flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-sage" /> Meeting & Follow-up Manager
          </h2>
          <p className="text-xs text-mutedgreen mt-0.5">
            Track client calls, renewals, interviews & contact action items
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-forest text-mint hover:bg-forest/90 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Meeting
        </button>
      </div>

      {/* Search & Tabs */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-mutedgreen" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, contact, role or notes..."
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-brand-border rounded-xl text-xs text-forest placeholder:text-mutedgreen/70 focus:outline-none focus:ring-2 focus:ring-sage/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-mutedgreen hover:text-forest"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-brand-border rounded-xl">
          {STATUS_FILTERS.map((tab) => {
            const count =
              tab === 'All'
                ? meetings.length
                : tab === 'Completed'
                ? meetings.filter((m) => m.status === 'completed').length
                : tab === 'Today'
                ? meetings.filter((m) => m.followupDate?.split('T')[0] === todayStr).length
                : meetings.filter(
                    (m) => m.status !== 'completed' && m.followupDate?.split('T')[0] >= todayStr
                  ).length

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-forest text-mint shadow-sm'
                    : 'text-mutedgreen hover:text-forest'
                }`}
              >
                <span>{tab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab ? 'bg-mint/20 text-mint' : 'bg-brand-bg text-forest'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Meeting List */}
      {filteredMeetings.length === 0 ? (
        <div className="bg-white border border-brand-border rounded-2xl p-8 text-center space-y-3 shadow-subtle">
          <div className="w-14 h-14 mx-auto rounded-full bg-mint/40 text-forest flex items-center justify-center">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-black text-forest">No meetings scheduled</h3>
            <p className="text-xs text-mutedgreen mt-1">
              {searchQuery || activeTab !== 'Upcoming'
                ? 'No matching meetings found for this filter'
                : 'Stay organized by tracking your next client discussion, renewal or follow-up date'}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest text-mint rounded-xl text-xs font-bold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Follow-up
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map((item) => {
            const priorityTheme = PRIORITY_THEMES[item.priority] || PRIORITY_THEMES.medium
            const isCompleted = item.status === 'completed'
            const isToday = item.followupDate?.split('T')[0] === todayStr

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-4 shadow-subtle transition-all space-y-3 ${
                  isCompleted
                    ? 'border-brand-border/60 opacity-80'
                    : isToday
                    ? 'border-sage ring-1 ring-sage/30'
                    : 'border-brand-border/80'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => toggleMeetingStatus(item.id)}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isCompleted
                          ? 'bg-brand-success border-brand-success text-white'
                          : 'border-brand-border hover:border-forest text-transparent'
                      }`}
                      title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-black text-forest truncate ${isCompleted ? 'line-through text-mutedgreen' : ''}`}>
                          {item.title}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityTheme.bg} ${priorityTheme.text} ${priorityTheme.border}`}>
                          {priorityTheme.label}
                        </span>
                        {isToday && !isCompleted && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-forest text-mint animate-pulse">
                            TODAY
                          </span>
                        )}
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-1.5 text-xs text-mutedgreen mt-1">
                        <Clock className="w-3.5 h-3.5 text-sage shrink-0" />
                        <span>{formatDateTime(item.followupDate)}</span>
                        {item.location && <span>• {item.location}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-mutedgreen hover:text-forest rounded-lg hover:bg-brand-bg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMeetingToDelete(item)}
                      className="p-1.5 text-mutedgreen hover:text-brand-error rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact Card Details */}
                {(item.contactName || item.contactPhone || item.contactEmail) && (
                  <div className="bg-[#FAFBF9] border border-brand-border/60 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-sage shrink-0" />
                        <span className="text-xs font-black text-forest truncate">{item.contactName || 'Contact'}</span>
                        {item.contactRole && (
                          <span className="text-[10px] text-mutedgreen truncate">({item.contactRole})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-mutedgreen truncate mt-0.5 pl-5">
                        {item.contactPhone && <span>{item.contactPhone}</span>}
                        {item.contactPhone && item.contactEmail && <span> • </span>}
                        {item.contactEmail && <span>{item.contactEmail}</span>}
                      </div>
                    </div>

                    {/* Quick Call / WhatsApp / Mail Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {item.contactPhone && (
                        <>
                          <a
                            href={`tel:${item.contactPhone}`}
                            className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Call Contact"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${item.contactPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="WhatsApp Message"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}
                      {item.contactEmail && (
                        <a
                          href={`mailto:${item.contactEmail}?subject=Follow-up: ${encodeURIComponent(item.title)}`}
                          className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes & Agenda */}
                {item.notes && (
                  <div className="text-xs text-forest/90 bg-white border border-brand-border/40 rounded-xl p-2.5 leading-relaxed">
                    <p className="font-bold text-[10px] uppercase text-mutedgreen tracking-wider mb-0.5">Notes & Action Items:</p>
                    <p className="whitespace-pre-line text-[11px]">{item.notes}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] flex flex-col space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border">
              <h3 className="text-base font-black text-forest flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-sage" />
                {editingMeeting ? 'Edit Meeting Details' : 'Schedule Meeting / Follow-up'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-mutedgreen hover:text-forest"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Title / Agenda */}
              <div>
                <label className="block text-xs font-bold text-forest mb-1">
                  Title / Agenda *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Tax Audit Sync, Product Demo, Insurance Renewal"
                  className="w-full px-3 py-2.5 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-forest mb-1">
                    Follow-up Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.followupDate}
                    onChange={(e) => setFormData({ ...formData, followupDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-forest mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.followupTime}
                    onChange={(e) => setFormData({ ...formData, followupTime: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-[#FAFBF9] border border-brand-border rounded-xl p-3 space-y-2.5">
                <span className="block text-[11px] font-black uppercase tracking-wider text-mutedgreen">
                  Contact Information
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Contact Name"
                    className="w-full px-3 py-2 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                  <input
                    type="text"
                    value={formData.contactRole}
                    onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                    placeholder="Role / Organization"
                    className="w-full px-3 py-2 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="Phone / WhatsApp"
                    className="w-full px-3 py-2 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="Email Address"
                    className="w-full px-3 py-2 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
              </div>

              {/* Priority & Location */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-forest mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-forest mb-1">
                    Meeting Mode / Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Google Meet, Office"
                    className="w-full px-3 py-2.5 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-forest mb-1">
                  Discussion Notes & Deliverables
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Key agenda, documents to bring, discussion points..."
                  className="w-full px-3 py-2 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-brand-bg text-forest font-bold text-xs rounded-xl hover:bg-brand-border/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-forest text-mint font-black text-xs rounded-xl shadow-md hover:bg-forest/90"
                >
                  {editingMeeting ? 'Update Meeting' : 'Save Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {meetingToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Meeting"
          message={`Are you sure you want to delete "${meetingToDelete.title}"?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            deleteMeeting(meetingToDelete.id)
            setMeetingToDelete(null)
          }}
          onCancel={() => setMeetingToDelete(null)}
        />
      )}
    </div>
  )
}

