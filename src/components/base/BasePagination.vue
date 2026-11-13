<script setup>
const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  total: { type: Number, default: 0 },
  perPage: { type: Number, default: 10 },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['change'])

function pages() {
  const arr = []
  const max = props.totalPages
  if (max <= 7) {
    for (let i = 1; i <= max; i++) arr.push(i)
    return arr
  }
  arr.push(1)
  if (props.currentPage > 3) arr.push('...')
  for (let i = Math.max(2, props.currentPage - 1); i <= Math.min(max - 1, props.currentPage + 1); i++) {
    arr.push(i)
  }
  if (props.currentPage < max - 2) arr.push('...')
  arr.push(max)
  return arr
}
</script>

<template>
  <div class="flex items-center justify-between px-3 py-2 border-t border-slate-200 bg-white text-xs text-slate-500">
    <span>
      {{ ((currentPage - 1) * perPage) + 1 }}–{{ Math.min(currentPage * perPage, total) }} dari {{ total }}
    </span>
    <div class="flex items-center gap-0.5">
      <button
        class="h-6 w-6 flex items-center justify-center rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="currentPage <= 1 || loading"
        @click="emit('change', currentPage - 1)"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        v-for="page in pages()"
        :key="page"
        :disabled="page === '...' || loading"
        :class="[
          'h-6 min-w-[1.5rem] px-1 flex items-center justify-center rounded text-xs transition-colors',
          page === currentPage ? 'bg-navy-900 text-white' : 'hover:bg-slate-100',
          page === '...' ? 'cursor-default' : ''
        ]"
        @click="page !== '...' && emit('change', page)"
      >
        {{ page }}
      </button>

      <button
        class="h-6 w-6 flex items-center justify-center rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="currentPage >= totalPages || loading"
        @click="emit('change', currentPage + 1)"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>
