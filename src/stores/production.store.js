import { defineStore } from 'pinia'
import { ref } from 'vue'
import { productionService } from '@/services/production.service'
import { useToast } from '@/composables/useToast'
import { useOrganization } from '@/composables/useOrganization'

export const useProductionStore = defineStore('production', () => {
  const { requireOrganization } = useOrganization()
  const batches = ref([])
  const total = ref(0)
  const loading = ref(false)
  const recentBatches = ref([])

  async function fetchHistory(params = {}) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      const result = await productionService.getHistory({ ...params, organization_id: orgId })
      batches.value = result.data
      total.value = result.count
      return { success: true, data: result }
    } catch (err) {
      console.error('[productionStore.fetchHistory]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal memuat riwayat produksi.')
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function fetchRecent() {
    try {
      const orgId = requireOrganization()
      recentBatches.value = await productionService.getRecentBatches(5, orgId)
      return { success: true }
    } catch (err) {
      console.error('[productionStore.fetchRecent]', err)
      recentBatches.value = []
      return { success: false, error: err }
    }
  }

  async function execute(payload) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      const data = await productionService.execute({ ...payload, organization_id: orgId })
      const toast = useToast()
      toast.success('Produksi berhasil dieksekusi.')
      return { success: true, data }
    } catch (err) {
      console.error('[productionStore.execute]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal mengeksekusi produksi.')
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  return { batches, total, loading, recentBatches, fetchHistory, fetchRecent, execute }
})
