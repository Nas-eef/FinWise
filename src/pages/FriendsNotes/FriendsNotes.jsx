import React, { useState } from 'react'
import { FriendNoteModal } from './FriendNoteModal'
import { FriendPaymentModal } from './FriendPaymentModal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Plus, ArrowDownLeft, ArrowUpRight, CheckCircle, Circle, Edit2, Trash2, Calendar, FileText } from 'lucide-react'

export const FriendsNotes = () => {
  const friendsNotes = useFinanceStore((state) => state.friendsNotes)
  const toggleFriendsSettled = useFinanceStore((state) => state.toggleFriendsSettled)
  const deleteFriendsNote = useFinanceStore((state) => state.deleteFriendsNote)
  const user = useFinanceStore((state) => state.user)

  const [activeTab, setActiveTab] = useState('all') // 'all', 'to_pay', 'to_get', 'settled'
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [noteToEdit, setNoteToEdit] = useState(null)
  const [paymentNote, setPaymentNote] = useState(null)
  const [noteToDelete, setNoteToDelete] = useState(null)

  // Calculations
  const toPayTotal = friendsNotes
    .filter(n => n.type === 'to_pay' && !n.isSettled)
    .reduce((sum, n) => sum + Math.max(0, n.amount - (n.paidAmount || 0)), 0)

  const toGetTotal = friendsNotes
    .filter(n => n.type === 'to_get' && !n.isSettled)
    .reduce((sum, n) => sum + Math.max(0, n.amount - (n.paidAmount || 0)), 0)

  const netBalance = toGetTotal - toPayTotal

  const filteredNotes = friendsNotes.filter((n) => {
    if (activeTab === 'to_pay') return n.type === 'to_pay' && !n.isSettled
    if (activeTab === 'to_get') return n.type === 'to_get' && !n.isSettled
    if (activeTab === 'settled') return n.isSettled
    return true
  })

  return (
    <div className="w-full space-y-4 pb-20 overflow-x-hidden">
      {/* Minimal Balance Hero */}
      <div className="w-full bg-forest text-white rounded-card-lg p-5 shadow-float relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-mint/80">
            Friends Borrow & Lend Notes
          </span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
            netBalance >= 0 ? 'bg-mint/20 text-mint' : 'bg-red-400/20 text-red-200'
          }`}>
            Net: {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance, user?.currency)}
          </span>
        </div>

        {/* 2 Split Stats */}
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/10">
          <div>
            <div className="flex items-center gap-1.5 text-mint text-xs font-bold mb-0.5">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>To Get (Lent)</span>
            </div>
            <p className="text-xl font-black text-white whitespace-nowrap">
              {formatCurrency(toGetTotal, user?.currency)}
            </p>
            <p className="text-[10px] text-mint/60">Friends borrowed from me</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[#FF8A80] text-xs font-bold mb-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>To Pay (Borrowed)</span>
            </div>
            <p className="text-xl font-black text-white whitespace-nowrap">
              {formatCurrency(toPayTotal, user?.currency)}
            </p>
            <p className="text-[10px] text-mint/60">I have to pay him</p>
          </div>
        </div>
      </div>

      {/* Tabs and Add Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 p-1 bg-white border border-brand-border rounded-xl flex text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'to_pay', label: 'To Pay' },
            { id: 'to_get', label: 'To Get' },
            { id: 'settled', label: 'Settled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-forest text-white shadow-xs'
                  : 'text-mutedgreen hover:text-forest'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setNoteToEdit(null)
            setIsAddOpen(true)
          }}
          className="p-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl shadow-subtle active:scale-95 transition-all flex items-center justify-center shrink-0"
          aria-label="Add Friend Note"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-2.5">
        {filteredNotes.length === 0 ? (
          <div className="w-full p-8 text-center bg-white border border-brand-border/70 rounded-2xl">
            <FileText className="w-8 h-8 text-sage mx-auto mb-2 opacity-60" />
            <p className="text-xs font-bold text-forest">No friend notes recorded</p>
            <p className="text-[11px] text-mutedgreen mt-0.5">
              Add a note when you lend money or borrow from a friend.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-3 px-3 py-1.5 bg-forest text-white text-xs font-bold rounded-lg"
            >
              Add Note
            </button>
          </div>
        ) : (
          filteredNotes.map((item) => {
            const isToPay = item.type === 'to_pay'
            const remaining = Math.max(0, item.amount - (item.paidAmount || 0))
            const isSettled = item.isSettled || remaining === 0

            return (
              <div
                key={item.id}
                className={`w-full p-4 bg-white border rounded-2xl shadow-subtle transition-all overflow-hidden ${
                  isSettled ? 'border-brand-border/40 opacity-70' : 'border-brand-border/80'
                }`}
              >
                {/* Top Row: Name, Type Badge, Amount */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <button
                      onClick={() => toggleFriendsSettled(item.id)}
                      className="p-1 -ml-1 text-forest hover:text-sage transition-colors shrink-0"
                      title={isSettled ? 'Mark Unsettled' : 'Mark Settled'}
                    >
                      {isSettled ? (
                        <CheckCircle className="w-5 h-5 text-brand-success" />
                      ) : (
                        <Circle className="w-5 h-5 text-mutedgreen" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <h4 className={`text-sm font-bold text-forest truncate ${isSettled ? 'line-through text-mutedgreen' : ''}`}>
                        {item.personName}
                      </h4>
                      <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                        isToPay ? 'bg-red-50 text-brand-error' : 'bg-emerald-50 text-brand-success'
                      }`}>
                        {isToPay ? 'To Pay Him' : 'To Get from Friend'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black whitespace-nowrap ${isToPay ? 'text-brand-error' : 'text-brand-success'}`}>
                      {isToPay ? '-' : '+'}{formatCurrency(remaining, user?.currency)}
                    </p>
                    {item.paidAmount > 0 && remaining > 0 && (
                      <p className="text-[10px] text-mutedgreen whitespace-nowrap">
                        Paid: {formatCurrency(item.paidAmount, user?.currency)} of {formatCurrency(item.amount, user?.currency)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Note Content Block (Prominent) */}
                <div className="my-2.5 p-2.5 bg-[#FAFBF9] border border-brand-border/60 rounded-xl overflow-hidden">
                  <p className="text-xs text-forest font-medium leading-relaxed break-words">
                    <strong className="text-mutedgreen mr-1">Note:</strong>
                    {item.note}
                  </p>
                </div>

                {/* Footer: Date & Actions */}
                <div className="flex items-center justify-between text-xs text-mutedgreen pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due: {formatDate(item.dueDate, 'short')}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isSettled && (
                      <button
                        onClick={() => setPaymentNote(item)}
                        className="px-2.5 py-1 bg-mint/50 hover:bg-mint text-forest text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap"
                      >
                        {isToPay ? 'Pay Part' : 'Receive Part'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setNoteToEdit(item)
                        setIsAddOpen(true)
                      }}
                      className="p-1 text-mutedgreen hover:text-forest"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setNoteToDelete(item)}
                      className="p-1 text-mutedgreen hover:text-brand-error"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modals */}
      <FriendNoteModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false)
          setNoteToEdit(null)
        }}
        noteToEdit={noteToEdit}
      />

      <FriendPaymentModal
        isOpen={!!paymentNote}
        onClose={() => setPaymentNote(null)}
        noteItem={paymentNote}
      />

      <ConfirmDialog
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={() => {
          if (noteToDelete) deleteFriendsNote(noteToDelete.id)
          setNoteToDelete(null)
        }}
        title="Delete Friend Note"
        message={`Are you sure you want to delete note for ${noteToDelete?.personName}?`}
      />
    </div>
  )
}
