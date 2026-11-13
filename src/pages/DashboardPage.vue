<script setup>
import { onMounted, computed, ref } from 'vue'
import { useReportStore } from '@/stores/report.store'
import { useInventoryStore } from '@/stores/inventory.store'
import { useProductionStore } from '@/stores/production.store'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import { formatNumber, formatDateTime, timeAgo } from '@/utils/formatters'
import { MOVEMENT_LABELS } from '@/constants/movementTypes'
import {
  Package, Box, AlertTriangle, TrendingUp,
  ArrowDownToLine, ArrowUpFromLine, Factory
} from 'lucide-vue-next'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const reportStore = useReportStore()
const inventoryStore = useInventoryStore()
const productionStore = useProductionStore()

const stats = computed(() => reportStore.dashboardStats)

// Chart data computed from raw movements
const chartData = computed(() => {
  const raw = reportStore.chartData
  const days = 7
  const labels = []
  const inData = []
  const outData = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
    const dateStr = d.toISOString().split('T')[0]
    labels.push(label)

    const dayMovements = raw.filter(m => m.created_at.startsWith(dateStr))
    inData.push(dayMovements.filter(m => m.movement_type === 'IN' || m.movement_type === 'PRODUCTION_IN').reduce((s, m) => s + (m.qty || 0), 0))
    outData.push(dayMovements.filter(m => m.movement_type === 'OUT' || m.movement_type === 'PRODUCTION_OUT').reduce((s, m) => s + (m.qty || 0), 0))
  }

  return {
    labels,
    datasets: [
      { label: 'Stock Masuk', data: inData, backgroundColor: '#1e293b', borderRadius: 3, barThickness: 10 },
      { label: 'Stock Keluar', data: outData, backgroundColor: '#e2e8f0', borderRadius: 3, barThickness: 10 }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { bodyFont: { size: 11 }, titleFont: { size: 11 } }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } }, beginAtZero: true }
  }
}

function movementBadge(type) {
  const map = {
    IN: 'success', OUT: 'danger',
    PRODUCTION_IN: 'info', PRODUCTION_OUT: 'warning', ADJUSTMENT: 'default'
  }
  return map[type] || 'default'
}

onMounted(async () => {
  await Promise.all([
    reportStore.fetchDashboardStats(),
    reportStore.fetchChartData(7),
    inventoryStore.fetchRecent(),
    productionStore.fetchRecent()
  ])
})
</script>

<template>
  <div class="space-y-4">
    <!-- Stat cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <!-- Total Raw -->
      <BaseCard padding="p-3.5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-slate-500">Bahan Baku</p>
            <p class="text-xl font-bold text-slate-900 mt-0.5">{{ stats?.totalRawMaterials ?? '—' }}</p>
          </div>
          <div class="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
            <Package class="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>
        <p class="text-xs text-slate-400 mt-2">Total jenis bahan baku aktif</p>
      </BaseCard>

      <!-- Total Finished -->
      <BaseCard padding="p-3.5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-slate-500">Produk Jadi</p>
            <p class="text-xl font-bold text-slate-900 mt-0.5">{{ stats?.totalFinishedProducts ?? '—' }}</p>
          </div>
          <div class="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
            <Box class="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>
        <p class="text-xs text-slate-400 mt-2">Total jenis produk jadi aktif</p>
      </BaseCard>

      <!-- Low Stock -->
      <BaseCard padding="p-3.5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-slate-500">Stok Rendah</p>
            <p class="text-xl font-bold mt-0.5" :class="stats?.lowStockAlerts > 0 ? 'text-red-600' : 'text-slate-900'">
              {{ stats?.lowStockAlerts ?? '—' }}
            </p>
          </div>
          <div class="w-7 h-7 rounded flex items-center justify-center" :class="stats?.lowStockAlerts > 0 ? 'bg-red-50' : 'bg-slate-100'">
            <AlertTriangle class="w-3.5 h-3.5" :class="stats?.lowStockAlerts > 0 ? 'text-red-500' : 'text-slate-500'" />
          </div>
        </div>
        <p class="text-xs text-slate-400 mt-2">Item di bawah stok minimum</p>
      </BaseCard>

      <!-- Production -->
      <BaseCard padding="p-3.5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-slate-500">Produksi</p>
            <p class="text-xl font-bold text-slate-900 mt-0.5">{{ productionStore.recentBatches.length }}</p>
          </div>
          <div class="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
            <Factory class="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>
        <p class="text-xs text-slate-400 mt-2">Batch produksi terbaru</p>
      </BaseCard>
    </div>

    <!-- Chart + Recent activity -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
      <!-- Chart -->
      <BaseCard class="md:col-span-3" padding="p-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="text-xs font-semibold text-slate-700">Pergerakan Stok</p>
            <p class="text-2xs text-slate-400">7 hari terakhir</p>
          </div>
          <div class="flex items-center gap-3 text-2xs text-slate-500">
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-navy-900 inline-block" />Masuk</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-slate-300 inline-block" />Keluar</span>
          </div>
        </div>
        <div class="h-40">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </BaseCard>

      <!-- Recent Movements -->
      <BaseCard class="md:col-span-2" padding="p-0">
        <div class="px-4 py-3 border-b border-slate-100">
          <p class="text-xs font-semibold text-slate-700">Aktivitas Terbaru</p>
        </div>
        <div class="divide-y divide-slate-100">
          <div
            v-for="mov in inventoryStore.recentMovements.slice(0, 6)"
            :key="mov.id"
            class="flex items-start gap-2 px-4 py-2.5"
          >
            <div class="mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 bg-slate-100">
              <ArrowDownToLine v-if="mov.movement_type === 'IN' || mov.movement_type === 'PRODUCTION_IN'" class="w-3 h-3 text-emerald-600" />
              <ArrowUpFromLine v-else class="w-3 h-3 text-red-500" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-slate-700 truncate">
                <BaseBadge :variant="movementBadge(mov.movement_type)" size="xs">{{ MOVEMENT_LABELS[mov.movement_type] }}</BaseBadge>
                <span class="ml-1">{{ formatNumber(mov.qty) }} unit</span>
              </p>
              <p class="text-2xs text-slate-400 mt-0.5">{{ timeAgo(mov.created_at) }}</p>
            </div>
          </div>
          <div v-if="!inventoryStore.recentMovements.length" class="px-4 py-6 text-center text-xs text-slate-400">
            Belum ada aktivitas
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Production Summary -->
    <BaseCard padding="p-0">
      <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <p class="text-xs font-semibold text-slate-700">Produksi Terbaru</p>
        <RouterLink to="/production" class="text-xs text-navy-900 hover:underline">Lihat semua</RouterLink>
      </div>
      <div class="divide-y divide-slate-100">
        <div
          v-for="batch in productionStore.recentBatches"
          :key="batch.id"
          class="flex items-center justify-between px-4 py-2.5"
        >
          <div>
            <p class="text-xs font-medium text-slate-800">{{ batch.finished_products?.name }}</p>
            <p class="text-2xs text-slate-400">{{ timeAgo(batch.created_at) }}</p>
          </div>
          <BaseBadge variant="success" size="xs">
            +{{ formatNumber(batch.qty_produced) }} {{ batch.finished_products?.unit }}
          </BaseBadge>
        </div>
        <div v-if="!productionStore.recentBatches.length" class="px-4 py-6 text-center text-xs text-slate-400">
          Belum ada produksi
        </div>
      </div>
    </BaseCard>
  </div>
</template>
