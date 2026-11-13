import { defineStore } from 'pinia'
import { ref } from 'vue'
import { finishedProductService } from '@/services/finishedProduct.service'
import { useToast } from '@/composables/useToast'
import { useOrganization } from '@/composables/useOrganization'

export const useFinishedProductStore = defineStore('finishedProduct', () => {
  const { requireOrganization } = useOrganization()
  const items = ref([])
  const total = ref(0)
  const loading = ref(false)
  const activeOptions = ref([])

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      const result = await finishedProductService.getAll({ ...params, organization_id: orgId })
      items.value = result.data
      total.value = result.count
      return { success: true, data: result }
    } catch (err) {
      console.error('[finishedProductStore.fetchAll]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal memuat data produk jadi.')
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function fetchOptions() {
    try {
      const orgId = requireOrganization()
      activeOptions.value = await finishedProductService.getAllActive(orgId)
      return { success: true }
    } catch (err) {
      console.error('[finishedProductStore.fetchOptions]', err)
      activeOptions.value = []
      return { success: false, error: err }
    }
  }

  async function create(payload) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      const item = await finishedProductService.create({ ...payload, organization_id: orgId })
      const toast = useToast()
      toast.success('Produk jadi berhasil ditambahkan.')
      return { success: true, data: item }
    } catch (err) {
      console.error('[finishedProductStore.create]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal menambahkan produk jadi.')
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function update(id, payload) {
    loading.value = true
    try {
      const item = await finishedProductService.update(id, payload)
      const idx = items.value.findIndex(i => i.id === id)
      if (idx !== -1) items.value[idx] = item
      const toast = useToast()
      toast.success('Produk jadi berhasil diperbarui.')
      return { success: true, data: item }
    } catch (err) {
      console.error('[finishedProductStore.update]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal memperbarui produk jadi.')
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function remove(id) {
    loading.value = true
    try {
      await finishedProductService.softDelete(id)
      items.value = items.value.filter(i => i.id !== id)
      total.value--
      const toast = useToast()
      toast.success('Produk jadi berhasil dihapus.')
      return { success: true }
    } catch (err) {
      console.error('[finishedProductStore.remove]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal menghapus produk jadi.')
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }

  return { items, total, loading, activeOptions, fetchAll, fetchOptions, create, update, remove }
})
