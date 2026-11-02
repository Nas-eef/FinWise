import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/common/Modal'
import { AmountInput } from '../../components/common/AmountInput'
import { useFinanceStore } from '../../store/useFinanceStore'
import { ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react'

export const FriendNoteModal = ({ isOpen, onClose, noteToEdit, defaultType = 'to_pay' }) => {
  const addFriendsNote = useFinanceStore((state) => state.addFriendsNote)
  const updateFriendsNote = useFinanceStore((state) => state.updateFriendsNote)
  const user = useFinanceStore((state) => state.user)

  const [type, setType] = useState(defaultType) // 'to_pay' or 'to_get'
  const [personName, setPersonName] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    if (noteToEdit) {
      setType(noteToEdit.type || 'to_pay')
      setPersonName(noteToEdit.personName || '')
      setAmount(String(noteToEdit.amount || ''))
      setNote(noteToEdit.note || '')
      setDueDate(noteToEdit.dueDate || '')
    } else {
      setType(defaultType)
      setPersonName('')
      setAmount('')
      setNote('')
      setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    }
  }, [noteToEdit, defaultType, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!personName.trim() || !num || num <= 0) return

    const payload = {
      type,
      personName: personName.trim(),
      amount: num,
      note: note.trim() || 'Friendly loan note',
      dueDate: dueDate || new Date().toISOString().split('T')[0],
    }

    if (noteToEdit) {
      updateFriendsNote(noteToEdit.id, payload)
    } else {
      addFriendsNote(payload)
    }

    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={noteToEdit ? 'Edit Friend Note' : 'Add Friend Borrow / Lend Note'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle: To Pay (Borrowed) vs To Get (Lent) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAFBF9] border border-brand-border rounded-xl">
          <button
            type="button"
            onClick={() => setType('to_pay')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              type === 'to_pay'
                ? 'bg-forest text-white shadow-xs'
                : 'text-mutedgreen hover:text-forest'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-[#FF8A80]" />
            <span>To Pay (Borrowed)</span>
          </button>

          <button
            type="button"
            onClick={() => setType('to_get')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              type === 'to_get'
                ? 'bg-forest text-white shadow-xs'
                : 'text-mutedgreen hover:text-forest'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-brand-success" />
            <span>To Get (Lent)</span>
          </button>
        </div>

        {/* Friend Name */}
        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1">
            Friend / Person Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Sarah Jenkins, Dave, Alex"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1 text-center">
            Amount
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={user?.currency || 'INR'}
          />
        </div>

        {/* Note / Purpose (Prominent) */}
        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1">
            Note / What was this for?
          </label>
          <textarea
            rows="2"
            required
            placeholder="e.g. Dinner bill split, Emergency cash for medicine, Ticket booking..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest resize-none font-medium"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1">
            Expected Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!amount || parseFloat(amount) <= 0 || !personName.trim()}
          className="w-full py-3.5 bg-forest hover:bg-forest/95 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span>{noteToEdit ? 'Save Note' : 'Add Friend Note'}</span>
        </button>
      </form>
    </Modal>
  )
}

