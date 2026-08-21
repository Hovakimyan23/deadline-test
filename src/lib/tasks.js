export const PRIORITIES = {
  low: { label: 'Low', color: '#3b9e6f', order: 0 },
  medium: { label: 'Medium', color: '#e0a52e', order: 1 },
  high: { label: 'High', color: '#e5484d', order: 2 },
}

export function priorityOrder(priority) {
  return PRIORITIES[priority]?.order ?? 1
}

export function daysUntilDeadline(deadlineStr) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const deadline = new Date(deadlineStr + 'T00:00:00')
  const diff = deadline - now
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function deadlineStatus(deadlineStr) {
  const days = daysUntilDeadline(deadlineStr)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 3) return 'soon'
  return 'future'
}

export function formatDeadline(deadlineStr) {
  const days = daysUntilDeadline(deadlineStr)
  const date = new Date(deadlineStr + 'T00:00:00')
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  if (days < 0) return { text: `${formatted} (${Math.abs(days)}d overdue)`, status: 'overdue' }
  if (days === 0) return { text: `${formatted} (today)`, status: 'today' }
  if (days === 1) return { text: `${formatted} (tomorrow)`, status: 'soon' }
  if (days <= 3) return { text: `${formatted} (in ${days}d)`, status: 'soon' }
  return { text: formatted, status: 'future' }
}

export function todayISO() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}
