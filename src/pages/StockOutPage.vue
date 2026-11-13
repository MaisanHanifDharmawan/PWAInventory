<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useInventoryStore } from '@/stores/inventory.store'
import { useRawMaterialStore } from '@/stores/rawMaterial.store'
import { useFinishedProductStore } from '@/stores/finishedProduct.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import { ITEM_TYPE } from '@/constants/movementTypes'
import { formatNumber } from '@/utils/formatters'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { ArrowUpFromLine, AlertTriangle } from 'lucide-vue-next'

const inventory = useInventoryStore()
const rawStore = useRawMaterialStore()
const productStore = useFinishedProductStore()
const auth = useAuthStore()
const toast = useToast()

const form = reactive({ itemType: ITEM_TYPE.RAW_MATERIAL, itemId: '', qty: '', notes: '' })
const errors = reactive({ itemId: '', qty: '' })
const submitting = ref(false)

const itemTypeOptions = [
  { value: ITEM_TYPE.RAW_MATERIAL, label: 'Bahan Baku' },
  { value: ITEM_TYPE.FINISHED_PRODUCT, label: 'Produk Jadi' }
]

const itemOptions = computed(() => {
  const items = form.itemType === ITEM_TYPE.RAW_MATERIAL ? rawStore.activeOptions : productStore.activeOptions
  return items.map(i => ({ value: i.id, label: `${i.name}${i.sku ? ` (${i.sku})` : ''}` }))
})

const selectedItem = computed(() => {
  const items = form.itemType === ITEM_TYPE.RAW_MATERIAL ? rawStore.activeOptions : productStore.activeOptions
  return items.find(i => i.id === form.itemId) || null
})

const stockAfter = computed(() => {
  if (!selectedItem.value || !form.qty) return null
  return (selectedItem.value.current_stock || 0) - Number(form.qty)
})

const stockWarning = computed(() => {
  if (stockAfter.value === null) return null
  if (stockAfter.value < 0) return 'Stok tidak mencukupi!'
  if (selectedItem.value && stockAfter.value <= selectedItem.value.minimum_stock) return 'Stok akan di bawah minimum!'
  return null
})

function validate() {
  errors.itemId = form.itemId ? '' : 'Pilih item'
  errors.qty = (form.qty && Number(form.qty) > 0) ? '' : 'Qty harus lebih dari 0'
  return !errors.itemId && !errors.qty
}

async function handleSubmit() {
  if (!validate()) return
  if (!auth.user?.id) {
    toast.error('User belum login atau sesi telah berakhir.')
    return
  }

  if (stockAfter.value !== null && stockAfter.value < 0) {
    toast.error('Stok tidak mencukupi untuk jumlah yang diminta!')
    return
  }
  submitting.value = true
  try {
    await inventory.stockOut({ itemType: form.itemType, itemId: form.itemId, qty: Number(form.qty), notes: form.notes || null, userId: auth.user.id })
    toast.success(`Stock keluar ${formatNumber(form.qty)} unit berhasil dicatat`)
    form.itemId = ''
    form.qty = ''
    form.notes = ''
    await Promise.all([rawStore.fetchOptions(), productStore.fetchOptions()])
  } catch (err) {
    toast.error(err.message || 'Gagal mencatat stock keluar')
  } finally {
    submitting.value = false
  }
}

onMounted(() => { rawStore.fetchOptions(); productStore.fetchOptions() })
</script>

<template>
  <div class="max-w-lg space-y-4">
    <div>
      <h2 class="page-title">Stock Keluar</h2>
      <p class="page-subtitle">Catat pengeluaran stok bahan baku atau produk jadi</p>
    </div>

    <BaseCard padding="p-5">
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <BaseSelect v-model="form.itemType" label="Jenis Item" :options="itemTypeOptions" required @change="form.itemId = ''" />
        <BaseSelect v-model="form.itemId" label="Pilih Item" :options="itemOptions" placeholder="Pilih item..." :error="errors.itemId" required />

        <div v-if="selectedItem" class="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200">
          <div class="flex-1">
            <p class="text-xs font-medium text-slate-700">{{ selectedItem.name }}</p>
            <p class="text-2xs text-slate-400 mt-0.5">Satuan: {{ selectedItem.unit }}</p>
          </div>
          <div class="text-right">
            <p class="text-2xs text-slate-400">Stok tersedia</p>
            <p class="text-sm font-bold" :class="(selectedItem.current_stock || 0) <= 0 ? 'text-red-600' : 'text-slate-800'">
              {{ formatNumber(selectedItem.current_stock) }} {{ selectedItem.unit }}
            </p>
          </div>
        </div>

        <BaseInput v-model="form.qty" label="Jumlah Keluar" type="number" :placeholder="`0 ${selectedItem?.unit || ''}`" :error="errors.qty" required />

        <!-- Warning -->
        <div v-if="stockWarning" :class="['flex items-center gap-2 p-3 rounded border text-xs', stockAfter < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700']">
          <AlertTriangle class="w-3.5 h-3.5 shrink-0" />
          <span>{{ stockWarning }}</span>
        </div>

        <!-- Preview -->
        <div v-if="selectedItem && form.qty && Number(form.qty) > 0 && stockAfter >= 0" class="p-3 bg-slate-50 border border-slate-200 rounded">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-600">Stok setelah keluar:</span>
            <span class="font-bold text-slate-800">{{ formatNumber(stockAfter) }} {{ selectedItem.unit }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-0.5">
          <label class="form-label">Keterangan (Opsional)</label>
          <textarea v-model="form.notes" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-navy-900 resize-none" rows="2" placeholder="Keterangan pengeluaran..." />
        </div>

        <BaseButton type="submit" variant="primary" size="md" :loading="submitting" :disabled="stockAfter !== null && stockAfter < 0" full>
          <ArrowUpFromLine class="w-3.5 h-3.5" />
          Catat Stock Keluar
        </BaseButton>
      </form>
    </BaseCard>
  </div>
</template>
