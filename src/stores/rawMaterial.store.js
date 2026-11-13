import { defineStore } from 'pinia'
import { ref } from 'vue'
import { rawMaterialService } from '@/services/rawMaterial.service'
import { useToast } from '@/composables/useToast'
import { useOrganization } from '@/composables/useOrganization'

export const useRawMaterialStore = defineStore('rawMaterial', () => {
  const { requireOrganization } = useOrganization()
  const items = ref([])
  const total = ref(0)
  const loading = ref(false)
  const activeOptions = ref([]) // for dropdown use

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      const result = await rawMaterialService.getAll({ ...params, organization_id: orgId })
      items.value = result.data
      total.value = result.count
      return { success: true, data: result }
    } catch (err) {
      console.error('[rawMaterialStore.fetchAll]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal memuat data bahan baku.')
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function fetchOptions() {
    try {
      const orgId = requireOrganization()
      activeOptions.value = await rawMaterialService.getAllActive(orgId)
      return { success: true }
    } catch (err) {
      console.error('[rawMaterialStore.fetchOptions]', err)
      activeOptions.value = []
      return { success: false, error: err }
    }
  }

  async function create(payload) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      const item = await rawMaterialService.create({ ...payload, organization_id: orgId })
      const toast = useToast()
      toast.success('Bahan baku berhasil ditambahkan.')
      return { success: true, data: item }
    } catch (err) {
      console.error('[rawMaterialStore.create]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal menambahkan bahan baku.')
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function update(id, payload) {
    loading.value = true
    try {
      const item = await rawMaterialService.update(id, payload)
      const idx = items.value.findIndex(i => i.id === id)
      if (idx !== -1) items.value[idx] = item
      const toast = useToast()
      toast.success('Bahan baku berhasil diperbarui.')
      return { success: true, data: item }
    } catch (err) {
      console.error('[rawMaterialStore.update]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal memperbarui bahan baku.')
      return { success: false, data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function remove(id) {
    loading.value = true
    try {
      await rawMaterialService.softDelete(id)
      items.value = items.value.filter(i => i.id !== id)
      total.value--
      const toast = useToast()
      toast.success('Bahan baku berhasil dihapus.')
      return { success: true }
    } catch (err) {
      console.error('[rawMaterialStore.remove]', err)
      const toast = useToast()
      toast.error(err?.message || 'Gagal menghapus bahan baku.')
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }

  return { items, total, loading, activeOptions, fetchAll, fetchOptions, create, update, remove }
})
