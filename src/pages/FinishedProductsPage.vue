<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useFinishedProductStore } from '@/stores/finishedProduct.store'
import { useToast } from '@/composables/useToast'
import { useDebounce } from '@/composables/useDebounce'
import { usePagination } from '@/composables/usePagination'
import { formatNumber, formatCurrency } from '@/utils/formatters'
import BaseTable from '@/components/base/BaseTable.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BasePagination from '@/components/base/BasePagination.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import { Plus, Search, Edit2, Trash2 } from 'lucide-vue-next'

const store = useFinishedProductStore()
const toast = useToast()
const { debouncedValue: search, set: setSearch } = useDebounce(350)
const pagination = usePagination(10)

const showModal = ref(false)
const showConfirm = ref(false)
const editingId = ref(null)
const deletingId = ref(null)
const saving = ref(false)
const deleting = ref(false)

const form = reactive({ name: '', sku: '', unit: '', selling_price: '', minimum_stock: '' })
const errors = reactive({ name: '', sku: '', unit: '', selling_price: '', minimum_stock: '' })

const columns = [
  { key: 'name', label: 'Nama Produk' },
  { key: 'sku', label: 'SKU', width: '100px' },
  { key: 'unit', label: 'Satuan', width: '80px' },
  { key: 'selling_price', label: 'Harga Jual', width: '120px', align: 'right' },
  { key: 'current_stock', label: 'Stok', width: '100px', align: 'right' },
  { key: 'status', label: 'Status', width: '90px', align: 'center' },
  { key: 'actions', label: '', width: '80px', align: 'right' }
]

async function load() {
  await store.fetchAll({ search: search.value, page: pagination.currentPage.value, perPage: pagination.perPage.value })
  pagination.setTotal(store.total)
}

watch([search, () => pagination.currentPage.value], load)
watch(search, () => pagination.reset())
onMounted(load)

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', sku: '', unit: '', selling_price: '', minimum_stock: '' })
  Object.assign(errors, { name: '', sku: '', unit: '', selling_price: '', minimum_stock: '' })
  showModal.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, { name: row.name, sku: row.sku || '', unit: row.unit || '', selling_price: row.selling_price || '', minimum_stock: row.minimum_stock || '' })
  Object.assign(errors, { name: '', sku: '', unit: '', selling_price: '', minimum_stock: '' })
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
    const payload = { name: form.name, sku: form.sku || null, unit: form.unit, selling_price: Number(form.selling_price) || 0, minimum_stock: Number(form.minimum_stock) || 0 }
    if (editingId.value) {
      await store.update(editingId.value, payload)
      toast.success('Produk berhasil diperbarui')
    } else {
      await store.create({ ...payload, current_stock: 0 })
      toast.success('Produk berhasil ditambahkan')
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
    toast.success('Produk dihapus')
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
    <div class="section-header">
      <div>
        <h2 class="page-title">Produk Jadi</h2>
        <p class="page-subtitle">Kelola produk jadi dan harga jual</p>
      </div>
      <BaseButton variant="primary" size="sm" @click="openCreate">
        <Plus class="w-3 h-3" />Tambah Produk
      </BaseButton>
    </div>

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

    <div class="table-wrapper">
      <BaseTable :columns="columns" :rows="store.items" :loading="store.loading">
        <template #cell-selling_price="{ row }">
          {{ formatCurrency(row.selling_price) }}
        </template>
        <template #cell-current_stock="{ row }">
          <span class="font-medium">{{ formatNumber(row.current_stock) }}</span>
          <span class="text-slate-400 ml-1">{{ row.unit }}</span>
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
        @change="pagination.setPage"
      />
    </div>
  </div>

  <BaseModal v-model="showModal" :title="editingId ? 'Edit Produk Jadi' : 'Tambah Produk Jadi'" size="sm">
    <form class="space-y-3" @submit.prevent="handleSave">
      <BaseInput v-model="form.name" label="Nama Produk" placeholder="Contoh: Kue Brownies" :error="errors.name" required />
      <BaseInput v-model="form.sku" label="SKU" placeholder="Opsional" />
      <BaseInput v-model="form.unit" label="Satuan" placeholder="Contoh: pcs, kotak" :error="errors.unit" required />
      <BaseInput v-model="form.selling_price" label="Harga Jual (Rp)" type="number" placeholder="0" hint="Harga per satuan unit" />
      <BaseInput v-model="form.minimum_stock" label="Stok Minimum" type="number" placeholder="0" />
    </form>
    <template #footer>
      <BaseButton variant="ghost" size="sm" @click="showModal = false">Batal</BaseButton>
      <BaseButton variant="primary" size="sm" :loading="saving" @click="handleSave">Simpan</BaseButton>
    </template>
  </BaseModal>

  <ConfirmDialog
    v-model="showConfirm"
    title="Hapus Produk"
    message="Produk jadi akan dihapus. Lanjutkan?"
    :loading="deleting"
    @confirm="handleDelete"
    @cancel="showConfirm = false"
  />
</template>
