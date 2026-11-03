export const formatCurrency = (amount, currency = 'INR') => {
  const num = Number(amount) || 0
  const symbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '¥',
  }
  const symbol = symbols[currency] || '₹'
  const locale = currency === 'INR' ? 'en-IN' : 'en-US'
  const sign = num < 0 ? '-' : ''

  return `${sign}${symbol}${Math.abs(num).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const formatDate = (dateString, formatStr = 'medium') => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  if (formatStr === 'short') {
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }
  if (formatStr === 'relative') {
    const today = new Date()
    today.setHours(0,0,0,0)
    const target = new Date(date)
    target.setHours(0,0,0,0)
    const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays === -1) return 'Tomorrow'
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

import { downloadFile } from './fileDownloader'

export const exportToCSV = async (data, filename = 'transactions.csv') => {
  if (!data || !data.length) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(obj => 
    Object.values(obj).map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
  )
  const csvText = [headers, ...rows].join('\n')
  await downloadFile({
    fileName: filename,
    textContent: csvText,
    mimeType: 'text/csv;charset=utf-8',
  })
}
