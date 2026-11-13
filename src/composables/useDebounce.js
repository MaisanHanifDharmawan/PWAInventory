import { ref } from 'vue'

/**
 * Debounce a reactive value
 * @param {number} delay - milliseconds
 */
export function useDebounce(delay = 300) {
  const debouncedValue = ref('')
  let timer = null

  function set(value) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debouncedValue.value = value
    }, delay)
  }

  return { debouncedValue, set }
}
