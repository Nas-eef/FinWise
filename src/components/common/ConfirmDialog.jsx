import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  isDestructive = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-mint text-forest'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-forest mb-1">{title}</h4>
        <p className="text-xs text-mutedgreen mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-brand-border text-xs font-semibold text-forest hover:bg-[#FAFBF9] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-subtle transition-all active:scale-95 ${
              isDestructive ? 'bg-[#D9534F] hover:bg-red-600' : 'bg-forest hover:bg-forest/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

