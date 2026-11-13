<script setup>
import { ref, watch, onMounted } from 'vue'
import { useReportStore } from '@/stores/report.store'
import { usePagination } from '@/composables/usePagination'
import { formatNumber, formatDateTime } from '@/utils/formatters'
import { MOVEMENT_LABELS, ITEM_TYPE } from '@/constants/movementTypes'
import BaseTable from '@/components/base/BaseTable.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BasePagination from '@/components/base/BasePagination.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { Download, AlertTriangle } from 'lucide-vue-next'

const store = useReportStore()
const pagination = usePagination(20)

const activeTab = ref('movements') // movements | production | lowstock
const filters = ref({ dateFrom: '', dateTo: '', itemType: '', movementType: '' })

const movementTypeOptions = [
  { value: '', label: 'Semua Tipe' },
  { value: 'IN', label: 'Stock Masuk' },
  { value: 'OUT', label: 'Stock Keluar' },
  { value: 'PRODUCTION_IN', label: 'Hasil Produksi' },
  { value: 'PRODUCTION_OUT', label: 'Pemakaian Produksi' }
]

const itemTypeOptions = [
  { value: '', label: 'Semua Item' },
  { value: ITEM_TYPE.RAW_MATERIAL, label: 'Bahan Baku' },
  { value: ITEM_TYPE.FINISHED_PRODUCT, label: 'Produk Jadi' }
]

const movementColumns = [
  { key: 'created_at', label: 'Waktu', width: '150px' },
  { key: 'item_type', label: 'Jenis', width: '100px' },
  { key: 'item_id', label: 'Item', width: '120px' },
  { key: 'movement_type', label: 'Tipe', width: '130px' },
  { key: 'qty', label: 'Qty', width: '80px', align: 'right' },
  { key: 'notes', label: 'Keterangan' }
]

const productionColumns = [
  { key: 'created_at', label: 'Waktu', width: '150px' },
  { key: 'product', label: 'Produk' },
  { key: 'qty_produced', label: 'Qty Produksi', width: '120px', align: 'right' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'notes', label: 'Keterangan' }
]

const lowStockColumns = [
  { key: 'name', label: 'Nama Item' },
  { key: 'sku', label: 'SKU', width: '100px' },
  { key: 'current_stock', label: 'Stok Saat Ini', width: '120px', align: 'right' },
  { key: 'minimum_stock', label: 'Stok Minimum', width: '120px', align: 'right' },
  { key: 'unit', label: 'Satuan', width: '80px' },
  { key: 'status', label: 'Status', width: '90px' }
]

function movementBadgeVariant(type) {
  return { IN: 'success', OUT: 'danger', PRODUCTION_IN: 'info', PRODUCTION_OUT: 'warning', ADJUSTMENT: 'default' }[type] || 'default'
}

async function loadMovements() {
  await store.fetchMovements({ ...filters.value, page: pagination.currentPage.value, perPage: pagination.perPage.value })
  pagination.setTotal(store.total)
}

async function loadProduction() {
  await store.fetchProductionHistory({ dateFrom: filters.value.dateFrom, dateTo: filters.value.dateTo, page: pagination.currentPage.value, perPage: pagination.perPage.value })
  pagination.setTotal(store.total)
}

async function loadLowStock() {
  await store.fetchLowStock()
}

async function loadTab() {
  pagination.reset()
  if (activeTab.value === 'movements') await loadMovements()
  else if (activeTab.value === 'production') await loadProduction()
  else await loadLowStock()
}

watch(activeTab, loadTab)
watch(() => pagination.currentPage.value, () => {
  if (activeTab.value === 'movements') loadMovements()
  else if (activeTab.value === 'production') loadProduction()
})

onMounted(loadTab)

const lowStockAll = () => [...store.lowStockRaw.map(i => ({ ...i, _type: 'Bahan Baku' })), ...store.lowStockFinished.map(i => ({ ...i, _type: 'Produk Jadi' }))]
</script>

<template>
  <div class="space-y-3">
    <div class="section-header">
      <div>
        <h2 class="page-title">Laporan</h2>
        <p class="page-subtitle">Riwayat pergerakan stok dan produksi</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg w-fit">
      <button
        v-for="tab in [{ id: 'movements', label: 'Pergerakan Stok' }, { id: 'production', label: 'Riwayat Produksi' }, { id: 'lowstock', label: 'Stok Rendah' }]"
        :key="tab.id"
        :class="['px-3 py-1.5 text-xs font-medium rounded transition-colors', activeTab === tab.id ? 'bg-white text-slate-800 shadow-card' : 'text-slate-500 hover:text-slate-700']"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <BaseBadge v-if="tab.id === 'lowstock' && (store.lowStockRaw.length + store.lowStockFinished.length) > 0" variant="danger" size="xs" class="ml-1">
          {{ store.lowStockRaw.length + store.lowStockFinished.length }}
        </BaseBadge>
      </button>
    </div>

    <!-- Filters for movements/production -->
    <div v-if="activeTab !== 'lowstock'" class="flex flex-wrap items-end gap-2">
      <BaseInput v-model="filters.dateFrom" label="Dari Tanggal" type="date" />
      <BaseInput v-model="filters.dateTo" label="Sampai Tanggal" type="date" />
      <template v-if="activeTab === 'movements'">
        <BaseSelect v-model="filters.movementType" label="Tipe Movement" :options="movementTypeOptions" />
        <BaseSelect v-model="filters.itemType" label="Jenis Item" :options="itemTypeOptions" />
      </template>
      <BaseButton variant="secondary" size="sm" class="mt-auto" @click="loadTab">Terapkan Filter</BaseButton>
    </div>

    <!-- Stock Movements Table -->
    <div v-if="activeTab === 'movements'" class="table-wrapper">
      <BaseTable :columns="movementColumns" :rows="store.movements" :loading="store.loading">
        <template #cell-created_at="{ row }">{{ formatDateTime(row.created_at) }}</template>
        <template #cell-item_type="{ row }">
          <BaseBadge variant="default" size="xs">{{ row.item_type === ITEM_TYPE.RAW_MATERIAL ? 'Bahan' : 'Produk' }}</BaseBadge>
        </template>
        <template #cell-item_id="{ row }"><span class="font-mono text-2xs text-slate-500">{{ row.item_id?.slice(0, 8) }}</span></template>
        <template #cell-movement_type="{ row }">
          <BaseBadge :variant="movementBadgeVariant(row.movement_type)" size="xs">{{ MOVEMENT_LABELS[row.movement_type] }}</BaseBadge>
        </template>
        <template #cell-qty="{ row }"><span class="font-medium">{{ formatNumber(row.qty) }}</span></template>
        <template #cell-notes="{ row }"><span class="text-slate-500">{{ row.notes || '-' }}</span></template>
      </BaseTable>
      <BasePagination :current-page="pagination.currentPage.value" :total-pages="pagination.totalPages.value" :total="store.total" :per-page="pagination.perPage.value" @change="pagination.setPage" />
    </div>

    <!-- Production History -->
    <div v-else-if="activeTab === 'production'" class="table-wrapper">
      <BaseTable :columns="productionColumns" :rows="store.productionHistory" :loading="store.loading">
        <template #cell-created_at="{ row }">{{ formatDateTime(row.created_at) }}</template>
        <template #cell-product="{ row }">{{ row.finished_products?.name || '-' }}</template>
        <template #cell-qty_produced="{ row }"><span class="font-medium">{{ formatNumber(row.qty_produced) }} {{ row.finished_products?.unit }}</span></template>
        <template #cell-status><BaseBadge variant="success" size="xs">Selesai</BaseBadge></template>
        <template #cell-notes="{ row }"><span class="text-slate-500">{{ row.notes || '-' }}</span></template>
      </BaseTable>
      <BasePagination :current-page="pagination.currentPage.value" :total-pages="pagination.totalPages.value" :total="store.total" :per-page="pagination.perPage.value" @change="pagination.setPage" />
    </div>

    <!-- Low Stock -->
    <div v-else class="table-wrapper">
      <BaseTable :columns="lowStockColumns" :rows="lowStockAll()" :loading="store.loading">
        <template #cell-current_stock="{ row }">
          <span class="font-medium text-red-600">{{ formatNumber(row.current_stock) }}</span>
        </template>
        <template #cell-minimum_stock="{ row }">{{ formatNumber(row.minimum_stock) }}</template>
        <template #cell-status="{ row }">
          <BaseBadge :variant="row.current_stock <= 0 ? 'danger' : 'warning'" size="xs">
            {{ row.current_stock <= 0 ? 'Habis' : 'Rendah' }}
          </BaseBadge>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
