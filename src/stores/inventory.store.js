import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stockService } from '@/services/stock.service'
import { useToast } from '@/composables/useToast'
import { useOrganization } from '@/composables/useOrganization'

export const useInventoryStore = defineStore('inventory', () => {
  const { requireOrganization } = useOrganization()
  const movements = ref([])
  const total = ref(0)
  const loading = ref(false)
  const recentMovements = ref([])

  async function fetchMovements(params = {}) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      const result = await stockService.getMovements({ ...params, organization_id: orgId })
      movements.value = result.data
      total.value = result.count
      return { success: true, data: result }
    } catch (err) {
      console.error('[inventoryStore.fetchMovements]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal memuat data mutasi stok.')
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function fetchRecent() {
    try {
      const orgId = requireOrganization()
      recentMovements.value = await stockService.getRecentMovements(10, orgId)
      return { success: true }
    } catch (err) {
      console.error('[inventoryStore.fetchRecent]', err)
      recentMovements.value = []
      return { success: false, error: err }
    }
  }

  async function stockIn(payload) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      const data = await stockService.stockIn({ ...payload, organization_id: orgId })
      const toast = useToast()
      toast.success('Stock in berhasil dicatat.')
      return { success: true, data }
    } catch (err) {
      console.error('[inventoryStore.stockIn]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal mencatat stock in.')
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function stockOut(payload) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      const data = await stockService.stockOut({ ...payload, organization_id: orgId })
      const toast = useToast()
      toast.success('Stock out berhasil dicatat.')
      return { success: true, data }
    } catch (err) {
      console.error('[inventoryStore.stockOut]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal mencatat stock out.')
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  return { movements, total, loading, recentMovements, fetchMovements, fetchRecent, stockIn, stockOut }
})
