import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/common/Modal'
import { CategoryIcon } from '../../components/common/CategoryIcon'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Check } from 'lucide-react'

export const CategoryModal = ({ isOpen, onClose, categoryToEdit, defaultType = 'expense' }) => {
  const addCategory = useFinanceStore((state) => state.addCategory)
  const updateCategory = useFinanceStore((state) => state.updateCategory)

  const [name, setName] = useState('')
  const [type, setType] = useState(defaultType)
  const [icon, setIcon] = useState('Utensils')
  const [color, setColor] = useState('#FF7043')

  const availableIcons = [
    'Utensils', 'Car', 'ShoppingBag', 'Home', 'Zap', 'HeartPulse',
    'Film', 'GraduationCap', 'Plane', 'Sparkles', 'Landmark', 'MoreHorizontal',
    'Briefcase', 'Laptop', 'Building2', 'Building', 'TrendingUp', 'Percent', 'PlusCircle', 'Gift', 'Coffee'
  ]

  const availableColors = [
    '#FF7043', '#42A5F5', '#AB47BC', '#26A69A', '#FFA726',
    '#EF5350', '#8D6E63', '#5C6BC0', '#29B6F6', '#EC407A',
    '#78909C', '#43845A', '#8AAB8F', '#2E7D32', '#00ACC1', '#242E25'
  ]

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || '')
      setType(categoryToEdit.type || 'expense')
      setIcon(categoryToEdit.icon || 'Utensils')
      setColor(categoryToEdit.color || '#FF7043')
    } else {
      setName('')
      setType(defaultType)
      setIcon(defaultType === 'income' ? 'Briefcase' : 'Utensils')
      setColor(defaultType === 'income' ? '#43845A' : '#FF7043')
    }
  }, [categoryToEdit, defaultType, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const payload = {
      name: name.trim(),
      type,
      icon,
      color,
    }

    if (categoryToEdit) {
      updateCategory(categoryToEdit.id, payload)
    } else {
      addCategory(payload)
    }

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={categoryToEdit ? 'Edit Category' : 'Create Category'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAFBF9] border border-brand-border rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'expense' ? 'bg-forest text-white shadow-xs' : 'text-mutedgreen hover:text-forest'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'income' ? 'bg-forest text-white shadow-xs' : 'text-mutedgreen hover:text-forest'
            }`}
          >
            Income
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Category Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Groceries, Gym, Side Hustle"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
          />
        </div>

        {/* Icon Selector Grid */}
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Select Icon
          </label>
          <div className="grid grid-cols-7 gap-2 max-h-36 overflow-y-auto p-1 bg-[#FAFBF9] rounded-xl border border-brand-border">
            {availableIcons.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                  icon === ic
                    ? 'bg-forest text-white shadow-xs'
                    : 'bg-white text-mutedgreen hover:text-forest border border-brand-border/60'
                }`}
              >
                <CategoryIcon name={ic} className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1.5">
            Color Palette
          </label>
          <div className="flex flex-wrap gap-2.5 p-2 bg-[#FAFBF9] rounded-xl border border-brand-border">
            {availableColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === c ? 'scale-115 ring-2 ring-forest ring-offset-2' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 bg-mint/30 rounded-xl border border-sage/30">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xs"
            style={{ backgroundColor: color }}
          >
            <CategoryIcon name={icon} className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-mutedgreen uppercase font-bold">Preview</span>
            <p className="text-xs font-bold text-forest">{name || 'Category Name'}</p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Check className="w-5 h-5" />
          <span>{categoryToEdit ? 'Save Changes' : 'Create Category'}</span>
        </button>
      </form>
    </Modal>
  )
}

