/**
 * Validate required field
 */
export function required(value, label = 'Field') {
  if (value === null || value === undefined || value === '') {
    return `${label} wajib diisi`
  }
  return null
}

/**
 * Validate minimum number
 */
export function minValue(value, min, label = 'Nilai') {
  const num = Number(value)
  if (isNaN(num) || num < min) {
    return `${label} minimal ${min}`
  }
  return null
}

/**
 * Validate positive number
 */
export function positiveNumber(value, label = 'Nilai') {
  return minValue(value, 0.01, label)
}

/**
 * Validate email format
 */
export function email(value) {
  if (!value) return 'Email wajib diisi'
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(value)) return 'Format email tidak valid'
  return null
}

/**
 * Validate minimum string length
 */
export function minLength(value, min, label = 'Field') {
  if (!value || value.length < min) {
    return `${label} minimal ${min} karakter`
  }
  return null
}

/**
 * Run multiple validators and return first error
 */
export function validate(value, validators) {
  for (const validator of validators) {
    const error = validator(value)
    if (error) return error
  }
  return null
}
