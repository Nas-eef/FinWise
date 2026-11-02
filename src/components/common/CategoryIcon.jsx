import React from 'react'
import * as Icons from 'lucide-react'

export const CategoryIcon = ({ name, className = 'w-5 h-5', style, ...props }) => {
  const IconComponent = Icons[name] || Icons.HelpCircle
  return <IconComponent className={className} style={style} {...props} />
}

