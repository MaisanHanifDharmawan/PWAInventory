/**
 * Format angka ke format mata uang Rupiah
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format angka ke format ribuan
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return '0'
  return new Intl.NumberFormat('id-ID').format(num)
}

/**
 * Format tanggal ke format lokal Indonesia
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options
  }).format(date)
}

/**
 * Format tanggal + jam
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Format tanggal ke YYYY-MM-DD untuk input[type=date]
 */
export function toInputDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

/**
 * Format stock dengan satuan
 */
export function formatStock(qty, unit = '') {
  return `${formatNumber(qty)}${unit ? ' ' + unit : ''}`
}

/**
 * Relative time (e.g. "2 menit lalu")
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  if (diffHour < 24) return `${diffHour} jam lalu`
  if (diffDay < 7) return `${diffDay} hari lalu`
  return formatDate(dateStr)
}
