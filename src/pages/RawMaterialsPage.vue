<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRawMaterialStore } from '@/stores/rawMaterial.store'
import { useToast } from '@/composables/useToast'
import { useDebounce } from '@/composables/useDebounce'
import { usePagination } from '@/composables/usePagination'
import { formatNumber } from '@/utils/formatters'
import BaseTable from '@/components/base/BaseTable.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BasePagination from '@/components/base/BasePagination.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import { Plus, Search, Edit2, Trash2 } from 'lucide-vue-next'

const store = useRawMaterialStore()
const toast = useToast()
const { debouncedValue: search, set: setSearch } = useDebounce(350)
const pagination = usePagination(10)

const showModal = ref(false)
const showConfirm = ref(false)
const editingId = ref(null)
const deletingId = ref(null)
const saving = ref(false)
const deleting = ref(false)

const form = reactive({ name: '', sku: '', unit: '', minimum_stock: '' })
const errors = reactive({ name: '', sku: '', unit: '', minimum_stock: '' })

const columns = [
  { key: 'name', label: 'Nama Bahan' },
  { key: 'sku', label: 'SKU', width: '100px' },
  { key: 'unit', label: 'Satuan', width: '80px' },
  { key: 'current_stock', label: 'Stok', width: '100px', align: 'right' },
  { key: 'minimum_stock', label: 'Min. Stok', width: '100px', align: 'right' },
  { key: 'status', label: 'Status', width: '90px', align: 'center' },
  { key: 'actions', label: '', width: '80px', align: 'right' }
]

async function load() {
  pagination.setTotal(0)
  await store.fetchAll({ search: search.value, page: pagination.currentPage.value, perPage: pagination.perPage.value })
  pagination.setTotal(store.total)
}

watch([search, () => pagination.currentPage.value], load)
watch(search, () => pagination.reset())
onMounted(load)

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', sku: '', unit: '', minimum_stock: '' })
  Object.assign(errors, { name: '', sku: '', unit: '', minimum_stock: '' })
  showModal.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, { name: row.name, sku: row.sku || '', unit: row.unit || '', minimum_stock: row.minimum_stock || '' })
  Object.assign(errors, { name: '', sku: '', unit: '', minimum_stock: '' })
  showModal.value = true
}

function validate() {
  let ok = true
  errors.name = form.name ? '' : 'Nama wajib diisi'; if (!form.name) ok = false
  errors.unit = form.unit ? '' : 'Satuan wajib diisi'; if (!form.unit) ok = false
  return ok
}

async function handleSave() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = { name: form.name, sku: form.sku || null, unit: form.unit, minimum_stock: Number(form.minimum_stock) || 0 }
    if (editingId.value) {
      await store.update(editingId.value, payload)
      toast.success('Bahan baku berhasil diperbarui')
    } else {
      await store.create({ ...payload, current_stock: 0 })
      toast.success('Bahan baku berhasil ditambahkan')
    }
    showModal.value = false
    await load()
  } catch (err) {
    toast.error(err.message || 'Gagal menyimpan')
  } finally {
    saving.value = false
  }
}

function confirmDelete(row) {
  deletingId.value = row.id
  showConfirm.value = true
}

async function handleDelete() {
  deleting.value = true
  try {
    await store.remove(deletingId.value)
    toast.success('Bahan baku dihapus')
    showConfirm.value = false
    await load()
  } catch (err) {
    toast.error(err.message || 'Gagal menghapus')
  } finally {
    deleting.value = false
  }
}

function stockStatus(row) {
  if (row.current_stock <= 0) return { label: 'Habis', variant: 'danger' }
  if (row.current_stock <= row.minimum_stock) return { label: 'Rendah', variant: 'warning' }
  return { label: 'Normal', variant: 'success' }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Header -->
    <div class="section-header">
      <div>
        <h2 class="page-title">Bahan Baku</h2>
        <p class="page-subtitle">Kelola stok bahan baku produksi</p>
      </div>
      <BaseButton variant="primary" size="sm" @click="openCreate">
        <Plus class="w-3 h-3" />Tambah Bahan
      </BaseButton>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-2 max-w-xs">
      <div class="relative flex-1">
        <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        <input
          class="w-full h-7 pl-7 pr-3 text-xs border border-slate-300 rounded focus:outline-none focus:border-navy-900 bg-white"
          placeholder="Cari nama atau SKU..."
          @input="setSearch($event.target.value)"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrapper">
      <BaseTable :columns="columns" :rows="store.items" :loading="store.loading">
        <template #cell-current_stock="{ row }">
          <span class="font-medium">{{ formatNumber(row.current_stock) }}</span>
          <span class="text-slate-400 ml-1">{{ row.unit }}</span>
        </template>
        <template #cell-minimum_stock="{ row }">
          {{ formatNumber(row.minimum_stock) }} {{ row.unit }}
        </template>
        <template #cell-status="{ row }">
          <BaseBadge :variant="stockStatus(row).variant">{{ stockStatus(row).label }}</BaseBadge>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <button class="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600" @click="openEdit(row)">
              <Edit2 class="w-3 h-3" />
            </button>
            <button class="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500" @click="confirmDelete(row)">
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </template>
      </BaseTable>
      <BasePagination
        :current-page="pagination.currentPage.value"
        :total-pages="pagination.totalPages.value"
        :total="store.total"
        :per-page="pagination.perPage.value"
        :loading="store.loading"
        @change="pagination.setPage"
      />
    </div>
  </div>

  <!-- Modal Create/Edit -->
  <BaseModal v-model="showModal" :title="editingId ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'" size="sm">
    <form class="space-y-3" @submit.prevent="handleSave">
      <BaseInput v-model="form.name" label="Nama Bahan Baku" placeholder="Contoh: Tepung Terigu" :error="errors.name" required />
      <BaseInput v-model="form.sku" label="SKU" placeholder="Opsional" :error="errors.sku" />
      <BaseInput v-model="form.unit" label="Satuan" placeholder="Contoh: kg, liter, pcs" :error="errors.unit" required />
      <BaseInput v-model="form.minimum_stock" label="Stok Minimum" type="number" placeholder="0" :error="errors.minimum_stock" hint="Alert akan muncul jika stok di bawah nilai ini" />
    </form>
    <template #footer>
      <BaseButton variant="ghost" size="sm" @click="showModal = false">Batal</BaseButton>
      <BaseButton variant="primary" size="sm" :loading="saving" @click="handleSave">Simpan</BaseButton>
    </template>
  </BaseModal>

  <!-- Confirm Delete -->
  <ConfirmDialog
    v-model="showConfirm"
    title="Hapus Bahan Baku"
    message="Bahan baku akan dihapus (soft delete). Data stok tetap tersimpan. Lanjutkan?"
    :loading="deleting"
    @confirm="handleDelete"
    @cancel="showConfirm = false"
  />
</template>
