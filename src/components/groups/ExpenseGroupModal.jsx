import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Check, FolderPlus, Home, Briefcase, User, Compass, ShoppingBag, Zap, HeartPulse } from 'lucide-react'

export const ExpenseGroupModal = ({ isOpen, onClose }) => {
  const addExpenseGroup = useFinanceStore((state) => state.addExpenseGroup)

  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('Home')
  const [selectedColor, setSelectedColor] = useState('#26A69A')

  const icons = [
    { name: 'Home', icon: Home, label: 'PG / House' },
    { name: 'Briefcase', icon: Briefcase, label: 'Work / Office' },
    { name: 'User', icon: User, label: 'Personal' },
    { name: 'Compass', icon: Compass, label: 'Travel / Trip' },
    { name: 'ShoppingBag', icon: ShoppingBag, label: 'Shopping' },
    { name: 'Zap', icon: Zap, label: 'Bills' },
    { name: 'HeartPulse', icon: HeartPulse, label: 'Health' },
  ]

  const colors = [
    '#26A69A', // Sage Teal
    '#43845A', // Forest Green
    '#42A5F5', // Soft Blue
    '#AB47BC', // Purple
    '#FFA726', // Orange
    '#EF5350', // Red Coral
    '#78909C', // Slate
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    addExpenseGroup({
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
    })

    setName('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Expense Group">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1">
            Group / Purpose Name
          </label>
          <input
            type="text"
            required
            autoFocus
            placeholder="e.g. PG Expenses, Goa Trip, College"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
          />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Select Icon
          </label>
          <div className="grid grid-cols-4 gap-2">
            {icons.map((item) => {
              const IconComp = item.icon
              const isSelected = selectedIcon === item.name
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setSelectedIcon(item.name)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-forest text-white border-forest shadow-xs'
                      : 'bg-[#FAFBF9] border-brand-border text-forest hover:bg-mint/30'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span className="text-[10px] font-bold truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Group Color
          </label>
          <div className="flex items-center gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  selectedColor === color ? 'scale-110 ring-2 ring-forest ring-offset-2' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>Create Group</span>
        </button>
      </form>
    </Modal>
  )
}

