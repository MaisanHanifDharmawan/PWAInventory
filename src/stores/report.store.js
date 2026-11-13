import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reportService } from '@/services/report.service'
import { useToast } from '@/composables/useToast'
import { useOrganization } from '@/composables/useOrganization'

export const useReportStore = defineStore('report', () => {
  const { requireOrganization } = useOrganization()
  const dashboardStats = ref(null)
  const chartData = ref([])
  const movements = ref([])
  const productionHistory = ref([])
  const lowStockRaw = ref([])
  const lowStockFinished = ref([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchDashboardStats() {
    loading.value = true
    try {
      const orgId = requireOrganization()
      dashboardStats.value = await reportService.getDashboardStats(orgId)
      return { success: true, data: dashboardStats.value }
    } catch (err) {
      console.error('[reportStore.fetchDashboardStats]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal memuat statistik dashboard.')
      dashboardStats.value = null
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function fetchChartData(days = 7) {
    try {
      const orgId = requireOrganization()
      chartData.value = await reportService.getMovementChartData(days, orgId)
      return { success: true }
    } catch (err) {
      console.error('[reportStore.fetchChartData]', err)
      chartData.value = []
      return { success: false, error: err }
    }
  }

  async function fetchMovements(params = {}) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      const result = await reportService.getStockMovements({ ...params, organization_id: orgId })
      movements.value = result.data
      total.value = result.count
      return { success: true, data: result }
    } catch (err) {
      console.error('[reportStore.fetchMovements]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal memuat data mutasi stok.')
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function fetchProductionHistory(params = {}) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      const result = await reportService.getProductionHistory({ ...params, organization_id: orgId })
      productionHistory.value = result.data
      total.value = result.count
      return { success: true, data: result }
    } catch (err) {
      console.error('[reportStore.fetchProductionHistory]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal memuat riwayat produksi.')
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function fetchLowStock() {
    loading.value = true
    try {
      const orgId = requireOrganization()
      const [raw, finished] = await Promise.all([
        reportService.getLowStockRaw(orgId),
        reportService.getLowStockFinished(orgId)
      ])
      lowStockRaw.value = raw
      lowStockFinished.value = finished
      return { success: true }
    } catch (err) {
      console.error('[reportStore.fetchLowStock]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal memuat data stok rendah.')
      lowStockRaw.value = []
      lowStockFinished.value = []
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }

  return {
    dashboardStats, chartData, movements, productionHistory,
    lowStockRaw, lowStockFinished, total, loading,
    fetchDashboardStats, fetchChartData, fetchMovements,
    fetchProductionHistory, fetchLowStock
  }
})
