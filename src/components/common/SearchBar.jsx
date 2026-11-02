import React from 'react'
import { Search, X } from 'lucide-react'

export const SearchBar = ({ value, onChange, placeholder = 'Search transactions, merchants...' }) => {
  return (
    <div className="relative flex items-center w-full">
      <Search className="absolute left-3.5 w-4 h-4 text-mutedgreen" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 bg-white border border-brand-border rounded-full text-sm text-forest placeholder:text-mutedgreen/60 outline-none focus:border-forest focus:ring-1 focus:ring-sage/40 transition-all shadow-subtle"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 p-0.5 text-mutedgreen hover:text-forest"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

