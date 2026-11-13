<script setup>
const props = defineProps({
  columns: { type: Array, required: true }, // [{ key, label, width?, align? }]
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  rowKey: { type: String, default: 'id' }
})

const emit = defineEmits(['row-click'])
</script>

<template>
  <div class="table-wrapper overflow-x-auto">
    <table class="min-w-full text-xs">
      <thead>
        <tr class="border-b border-slate-200 bg-slate-50">
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              'px-3 py-2 font-medium text-slate-500 text-left whitespace-nowrap',
              col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
            ]"
            :style="col.width ? { width: col.width } : {}"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- Loading skeleton -->
        <template v-if="loading">
          <tr v-for="i in 5" :key="`sk-${i}`" class="border-b border-slate-100">
            <td v-for="col in columns" :key="col.key" class="px-3 py-2">
              <div class="h-3 bg-slate-200 rounded animate-pulse" :style="{ width: Math.random() > 0.5 ? '70%' : '50%' }" />
            </td>
          </tr>
        </template>

        <!-- Empty state -->
        <template v-else-if="!rows.length">
          <tr>
            <td :colspan="columns.length" class="px-3 py-10 text-center text-slate-400">
              <slot name="empty">
                <div class="flex flex-col items-center gap-1.5">
                  <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span class="text-xs">Tidak ada data</span>
                </div>
              </slot>
            </td>
          </tr>
        </template>

        <!-- Data rows -->
        <template v-else>
          <tr
            v-for="row in rows"
            :key="row[rowKey]"
            class="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-100 cursor-default"
            @click="emit('row-click', row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="[
                'px-3 py-2 text-slate-700 whitespace-nowrap',
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
              ]"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] ?? '-' }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
