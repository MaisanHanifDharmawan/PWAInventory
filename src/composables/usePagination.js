import { ref, computed } from 'vue'

/**
 * Pagination composable
 * @param {number} defaultPerPage
 */
export function usePagination(defaultPerPage = 10) {
  const currentPage = ref(1)
  const perPage = ref(defaultPerPage)
  const total = ref(0)

  const totalPages = computed(() => Math.ceil(total.value / perPage.value))
  const offset = computed(() => (currentPage.value - 1) * perPage.value)

  const hasPrev = computed(() => currentPage.value > 1)
  const hasNext = computed(() => currentPage.value < totalPages.value)

  function setPage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  function prevPage() {
    if (hasPrev.value) currentPage.value--
  }

  function nextPage() {
    if (hasNext.value) currentPage.value++
  }

  function reset() {
    currentPage.value = 1
  }

  function setTotal(count) {
    total.value = count
  }

  return {
    currentPage,
    perPage,
    total,
    totalPages,
    offset,
    hasPrev,
    hasNext,
    setPage,
    prevPage,
    nextPage,
    reset,
    setTotal
  }
}
