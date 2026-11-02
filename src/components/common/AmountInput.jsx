import React from 'react'

export const AmountInput = ({ value, onChange, currency = 'INR', placeholder = '0.00' }) => {
  const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', CAD: 'CA$' }
  const symbol = currencySymbols[currency] || '₹'

  const quickIncrements = currency === 'INR' ? [100, 500, 1000, 5000] : [10, 50, 100, 500]

  const handleQuickAdd = (amount) => {
    const current = parseFloat(value) || 0
    onChange((current + amount).toFixed(2))
  }

  return (
    <div className="space-y-3">
      <div className="relative flex items-center justify-center bg-[#FAFBF9] border border-brand-border rounded-card p-4 transition-all focus-within:border-forest focus-within:ring-2 focus-within:ring-mint">
        <span className="text-3xl font-black text-forest mr-1 select-none">{symbol}</span>
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="w-full text-center text-3xl font-black text-forest bg-transparent outline-none placeholder:text-mutedgreen/40"
        />
      </div>

      {/* Quick Add Pills */}
      <div className="flex items-center justify-center gap-2">
        {quickIncrements.map((quick) => (
          <button
            key={quick}
            type="button"
            onClick={() => handleQuickAdd(quick)}
            className="px-3 py-1 text-xs font-bold text-forest bg-mint/50 hover:bg-mint border border-sage/30 rounded-full transition-colors active:scale-95"
          >
            +{symbol}{quick.toLocaleString('en-IN')}
          </button>
        ))}
      </div>
    </div>
  )
}
