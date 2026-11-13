<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRecipeStore } from '@/stores/recipe.store'
import { useRawMaterialStore } from '@/stores/rawMaterial.store'
import { useFinishedProductStore } from '@/stores/finishedProduct.store'
import { useToast } from '@/composables/useToast'
import { usePagination } from '@/composables/usePagination'
import { formatNumber } from '@/utils/formatters'
import BaseTable from '@/components/base/BaseTable.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BasePagination from '@/components/base/BasePagination.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import { Plus, Trash2, Edit2, X } from 'lucide-vue-next'

const recipeStore = useRecipeStore()
const rawStore = useRawMaterialStore()
const productStore = useFinishedProductStore()
const toast = useToast()
const pagination = usePagination(10)

const showModal = ref(false)
const showConfirm = ref(false)
const editingId = ref(null)
const deletingId = ref(null)
const saving = ref(false)
const deleting = ref(false)

const selectedProductId = ref('')
const recipeItems = ref([]) // [{ raw_material_id, qty }]
const productError = ref('')

const productOptions = computed(() =>
  productStore.activeOptions.map(p => ({ value: p.id, label: `${p.name} (${p.sku || p.id.slice(0, 6)})` }))
)
const rawOptions = computed(() =>
  rawStore.activeOptions.map(r => ({ value: r.id, label: `${r.name} (${r.unit})` }))
)

const columns = [
  { key: 'product', label: 'Produk Jadi' },
  { key: 'items_count', label: 'Jumlah Bahan', width: '120px', align: 'center' },
  { key: 'actions', label: '', width: '80px', align: 'right' }
]

async function load() {
  await recipeStore.fetchAll({ page: pagination.currentPage.value, perPage: pagination.perPage.value })
  pagination.setTotal(recipeStore.total)
}

watch(() => pagination.currentPage.value, load)
onMounted(async () => {
  await Promise.all([load(), rawStore.fetchOptions(), productStore.fetchOptions()])
})

function openCreate() {
  editingId.value = null
  selectedProductId.value = ''
  recipeItems.value = [{ raw_material_id: '', qty: '' }]
  productError.value = ''
  showModal.value = true
}

async function openEdit(row) {
  const recipe = await recipeStore.fetchById(row.id)
  editingId.value = recipe.id
  selectedProductId.value = recipe.finished_product_id
  recipeItems.value = recipe.recipe_items.map(i => ({ raw_material_id: i.raw_material_id, qty: i.qty }))
  productError.value = ''
  showModal.value = true
}

function addItem() {
  recipeItems.value.push({ raw_material_id: '', qty: '' })
}

function removeItem(idx) {
  recipeItems.value.splice(idx, 1)
}

function getRawUnit(id) {
  return rawStore.activeOptions.find(r => r.id === id)?.unit || ''
}

function validate() {
  productError.value = selectedProductId.value ? '' : 'Pilih produk jadi'
  if (!selectedProductId.value) return false
  const hasInvalid = recipeItems.value.some(i => !i.raw_material_id || !i.qty || Number(i.qty) <= 0)
  if (hasInvalid) { toast.warning('Lengkapi semua bahan dan qty'); return false }
  return true
}

async function handleSave() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = { finished_product_id: selectedProductId.value }
    const items = recipeItems.value.map(i => ({ raw_material_id: i.raw_material_id, qty: Number(i.qty) }))
    if (editingId.value) {
      await recipeStore.update(editingId.value, payload, items)
      toast.success('Resep berhasil diperbarui')
    } else {
      await recipeStore.create(payload, items)
      toast.success('Resep berhasil dibuat')
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
    await recipeStore.remove(deletingId.value)
    toast.success('Resep dihapus')
    showConfirm.value = false
    await load()
  } catch (err) {
    toast.error(err.message || 'Gagal menghapus')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="section-header">
      <div>
        <h2 class="page-title">Resep / BOM</h2>
        <p class="page-subtitle">Bill of Materials — komposisi bahan baku per produk</p>
      </div>
      <BaseButton variant="primary" size="sm" @click="openCreate">
        <Plus class="w-3 h-3" />Tambah Resep
      </BaseButton>
    </div>

    <div class="table-wrapper">
      <BaseTable :columns="columns" :rows="recipeStore.items" :loading="recipeStore.loading">
        <template #cell-product="{ row }">
          <span class="font-medium text-slate-800">{{ row.finished_products?.name }}</span>
          <span class="text-slate-400 ml-1 text-2xs">{{ row.finished_products?.sku }}</span>
        </template>
        <template #cell-items_count="{ row }">
          <span>{{ row.recipe_items?.length ?? '—' }} bahan</span>
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
        :total="recipeStore.total"
        :per-page="pagination.perPage.value"
        @change="pagination.setPage"
      />
    </div>
  </div>

  <!-- Recipe Modal -->
  <BaseModal v-model="showModal" :title="editingId ? 'Edit Resep' : 'Buat Resep Baru'" size="lg">
    <div class="space-y-4">
      <BaseSelect
        v-model="selectedProductId"
        label="Produk Jadi"
        :options="productOptions"
        placeholder="Pilih produk jadi..."
        :error="productError"
        required
      />

      <!-- Recipe items -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="form-label mb-0">Komposisi Bahan Baku</label>
          <BaseButton variant="outline" size="xs" @click="addItem">
            <Plus class="w-3 h-3" />Tambah Bahan
          </BaseButton>
        </div>

        <div class="space-y-2">
          <div
            v-for="(item, idx) in recipeItems"
            :key="idx"
            class="flex items-end gap-2 p-2.5 bg-slate-50 rounded border border-slate-200"
          >
            <div class="flex-1">
              <BaseSelect
                v-model="item.raw_material_id"
                label="Bahan Baku"
                :options="rawOptions"
                placeholder="Pilih bahan..."
              />
            </div>
            <div class="w-28">
              <BaseInput
                v-model="item.qty"
                :label="`Qty (${getRawUnit(item.raw_material_id) || 'satuan'})`"
                type="number"
                placeholder="0"
              />
            </div>
            <button
              v-if="recipeItems.length > 1"
              class="mb-0.5 p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
              @click="removeItem(idx)"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <BaseButton variant="ghost" size="sm" @click="showModal = false">Batal</BaseButton>
      <BaseButton variant="primary" size="sm" :loading="saving" @click="handleSave">Simpan Resep</BaseButton>
    </template>
  </BaseModal>

  <ConfirmDialog
    v-model="showConfirm"
    title="Hapus Resep"
    message="Resep ini akan dihapus permanen. Lanjutkan?"
    :loading="deleting"
    @confirm="handleDelete"
    @cancel="showConfirm = false"
  />
</template>
