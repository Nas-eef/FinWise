import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/common/Modal'
import { CategoryIcon } from '../../components/common/CategoryIcon'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Check } from 'lucide-react'

export const GoalModal = ({ isOpen, onClose, goalToEdit }) => {
  const addSavingsGoal = useFinanceStore((state) => state.addSavingsGoal)

  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [category, setCategory] = useState('Safety')
  const [icon, setIcon] = useState('ShieldCheck')
  const [color, setColor] = useState('#43845A')

  const icons = ['ShieldCheck', 'Plane', 'Laptop', 'Car', 'Home', 'GraduationCap', 'Heart', 'Sparkles']
  const colors = ['#43845A', '#8AAB8F', '#242E25', '#D99A42', '#26A69A', '#3F51B5', '#E91E63']

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name || '')
      setTargetAmount(String(goalToEdit.targetAmount || ''))
      setCurrentAmount(String(goalToEdit.currentAmount || ''))
      setTargetDate(goalToEdit.targetDate || '')
      setCategory(goalToEdit.category || 'General')
      setIcon(goalToEdit.icon || 'ShieldCheck')
      setColor(goalToEdit.color || '#43845A')
    } else {
      setName('')
      setTargetAmount('')
      setCurrentAmount('0')
      setTargetDate('2027-01-01')
      setCategory('Safety')
      setIcon('ShieldCheck')
      setColor('#43845A')
    }
  }, [goalToEdit, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !targetAmount) return

    addSavingsGoal({
      name: name.trim(),
      targetAmount: parseFloat(targetAmount) || 0,
      currentAmount: parseFloat(currentAmount) || 0,
      targetDate: targetDate || new Date().toISOString().split('T')[0],
      category,
      icon,
      color,
    })

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={goalToEdit ? 'Edit Savings Goal' : 'Create Savings Goal'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Goal Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Emergency Fund, New Car, Vacation"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
              Target Amount
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="e.g. 5000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
              Current Saved
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Target Completion Date
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest"
          />
        </div>

        {/* Icon & Color */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider">
            Icon & Theme
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {icons.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`p-2 rounded-xl border transition-all ${
                  icon === ic ? 'bg-forest text-white' : 'bg-[#FAFBF9] text-mutedgreen'
                }`}
              >
                <CategoryIcon name={ic} className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  color === c ? 'scale-115 ring-2 ring-forest ring-offset-2' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-2 py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Check className="w-5 h-5" />
          <span>Save Goal</span>
        </button>
      </form>
    </Modal>
  )
}

