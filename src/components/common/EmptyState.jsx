import React from 'react'
import { FolderOpen } from 'lucide-react'

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No items found',
  description = 'There is nothing here yet. Try adjusting your filters or create a new entry.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center my-6 bg-white/60 border border-brand-border/80 border-dashed rounded-card-lg">
      <div className="w-14 h-14 rounded-full bg-mint/50 flex items-center justify-center text-forest mb-3">
        <Icon className="w-7 h-7 text-forest" />
      </div>
      <h4 className="text-base font-bold text-forest mb-1">{title}</h4>
      <p className="text-xs text-mutedgreen max-w-xs mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-forest text-white text-xs font-semibold rounded-full shadow-subtle hover:bg-forest/90 active:scale-95 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

