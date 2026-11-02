import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export const BottomSheet = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-forest/40 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-card-lg shadow-float border-t border-brand-border/80 flex flex-col max-h-[88vh] z-10 transition-transform duration-300">
        {/* Grab bar */}
        <div className="w-full flex justify-center pt-3 pb-1 cursor-grab" onClick={onClose}>
          <div className="w-12 h-1.5 bg-[#D3E8D6] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-brand-border/60">
          <h3 className="text-lg font-bold text-forest">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-mutedgreen hover:text-forest hover:bg-mint/40 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto safe-bottom">
          {children}
        </div>
      </div>
    </div>
  )
}

