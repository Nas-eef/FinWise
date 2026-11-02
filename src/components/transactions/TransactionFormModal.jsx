import React, { useState, useEffect } from 'react'
import { BottomSheet } from '../common/BottomSheet'
import { AmountInput } from '../common/AmountInput'
import { CategoryIcon } from '../common/CategoryIcon'
import { useFinanceStore } from '../../store/useFinanceStore'
import { ArrowDownLeft, ArrowUpRight, Check, Layers } from 'lucide-react'

export const TransactionFormModal = () => {
  const isOpen = useFinanceStore((state) => state.isAddTransactionOpen)
  const transactionToEdit = useFinanceStore((state) => state.transactionToEdit)
  const close = useFinanceStore((state) => state.closeAddTransaction)
  const addTransaction = useFinanceStore((state) => state.addTransaction)
  const updateTransaction = useFinanceStore((state) => state.updateTransaction)
  const categories = useFinanceStore((state) => state.categories)
  const expenseGroups = useFinanceStore((state) => state.expenseGroups)
  const user = useFinanceStore((state) => state.user)

  const isEditing = Boolean(transactionToEdit && transactionToEdit.id)

  const [type, setType] = useState('expense')
  const [groupId, setGroupId] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (transactionToEdit) {
      const initialType = transactionToEdit.type || 'expense'
      setType(initialType)
      setGroupId(transactionToEdit.groupId || (expenseGroups[0]?.id || ''))
      setAmount(transactionToEdit.amount ? String(transactionToEdit.amount) : '')
      const catsForType = categories.filter(c => c.type === initialType)
      setCategoryId(transactionToEdit.categoryId || catsForType[0]?.id || '')
      setDate(transactionToEdit.date || new Date().toISOString().split('T')[0])
      setDescription(transactionToEdit.description || '')
      setNotes(transactionToEdit.notes || '')
    } else {
      setType('expense')
      setGroupId(expenseGroups[0]?.id || '')
      setAmount('')
      const defaultCat = categories.find(c => c.type === 'expense')
      setCategoryId(defaultCat?.id || '')
      setDate(new Date().toISOString().split('T')[0])
      setDescription('')
      setNotes('')
    }
  }, [transactionToEdit, isOpen, categories, expenseGroups])

  const filteredCategories = categories.filter(c => c.type === type)

  const handleTypeSelect = (selectedType) => {
    setType(selectedType)
    const matchingCats = categories.filter(c => c.type === selectedType)
    if (matchingCats.length > 0) {
      setCategoryId(matchingCats[0].id)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) return

    const payload = {
      type,
      groupId: type === 'expense' ? (groupId || null) : null,
      amount: num,
      categoryId: categoryId || filteredCategories[0]?.id || (type === 'income' ? 'cat-salary' : 'cat-other-exp'),
      date,
      description: description.trim() || (type === 'expense' ? 'Expense' : 'Income'),
      notes: notes.trim(),
    }

    if (isEditing) {
      updateTransaction(transactionToEdit.id, payload)
    } else {
      addTransaction(payload)
    }

    close()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={close}
      title={isEditing ? 'Edit Transaction' : type === 'income' ? 'Record Income' : 'Record Expense'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Minimal Type Switcher: Expense vs Income */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAFBF9] border border-brand-border rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeSelect('expense')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              type === 'expense'
                ? 'bg-forest text-white shadow-xs'
                : 'text-mutedgreen hover:text-forest'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-[#FF8A80]" />
            <span>Expense</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelect('income')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              type === 'income'
                ? 'bg-forest text-white shadow-xs'
                : 'text-mutedgreen hover:text-forest'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-brand-success" />
            <span>Income</span>
          </button>
        </div>

        {/* Large Minimal Amount Input */}
        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1 text-center">
            {type === 'income' ? 'Income Amount' : 'Expense Amount'}
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={user?.currency || 'INR'}
          />
        </div>

        {/* Expense Group / Purpose Picker (when expense) */}
        {type === 'expense' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sage" /> Expense Group / Purpose
              </label>
              <span className="text-[10px] text-mutedgreen font-medium">e.g. PG, Personal, Work</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {expenseGroups.map((grp) => (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => setGroupId(grp.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    groupId === grp.id
                      ? 'bg-forest text-white border-forest shadow-xs'
                      : 'bg-white border-brand-border text-forest hover:bg-mint/30'
                  }`}
                >
                  {grp.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setGroupId('')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  !groupId
                    ? 'bg-forest text-white border-forest shadow-xs'
                    : 'bg-[#FAFBF9] border-brand-border text-mutedgreen hover:text-forest'
                }`}
              >
                None (General)
              </button>
            </div>
          </div>
        )}

        {/* Minimal Category Chips */}
        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-2">
            Category
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
            {filteredCategories.map((cat) => {
              const isSelected = categoryId === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-forest text-white border-forest shadow-xs'
                      : 'bg-white border-brand-border text-forest hover:bg-mint/30'
                  }`}
                >
                  <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Description & Date */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1">
              Description / Detail
            </label>
            <input
              type="text"
              placeholder={type === 'income' ? 'e.g. Salary, Freelance' : 'e.g. Rent, Groceries, Food'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
            />
          </div>
        </div>

        {/* Quick Note */}
        <div>
          <label className="block text-[11px] font-bold text-mutedgreen uppercase tracking-wider mb-1">
            Note (Optional)
          </label>
          <input
            type="text"
            placeholder="Add an extra note..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs text-forest outline-none focus:border-forest"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-3.5 bg-forest hover:bg-forest/95 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span>{isEditing ? 'Save Changes' : type === 'income' ? 'Add Income' : 'Record Expense'}</span>
        </button>
      </form>
    </BottomSheet>
  )
}
