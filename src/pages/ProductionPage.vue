<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useProductionStore } from '@/stores/production.store'
import { useFinishedProductStore } from '@/stores/finishedProduct.store'
import { useRecipeStore } from '@/stores/recipe.store'
import { useRawMaterialStore } from '@/stores/rawMaterial.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import { formatNumber } from '@/utils/formatters'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import { Factory, AlertTriangle, CheckCircle2 } from 'lucide-vue-next'

const productionStore = useProductionStore()
const productStore = useFinishedProductStore()
const recipeStore = useRecipeStore()
const rawStore = useRawMaterialStore()
const auth = useAuthStore()
const toast = useToast()

const selectedProductId = ref('')
const qty = ref('')
const notes = ref('')
const recipe = ref(null)
const loadingRecipe = ref(false)
const showConfirm = ref(false)
const submitting = ref(false)
const productError = ref('')
const qtyError = ref('')

const productOptions = computed(() =>
  productStore.activeOptions.map(p => ({ value: p.id, label: `${p.name}${p.sku ? ` (${p.sku})` : ''}` }))
)

const selectedProduct = computed(() =>
  productStore.activeOptions.find(p => p.id === selectedProductId.value) || null
)

// Material consumption preview
const materialPreview = computed(() => {
  if (!recipe.value || !qty.value || Number(qty.value) <= 0) return []
  return recipe.value.recipe_items.map(item => {
    const needed = item.qty * Number(qty.value)
    const available = item.raw_materials?.current_stock || 0
    return {
      name: item.raw_materials?.name,
      unit: item.raw_materials?.unit,
      needed,
      available,
      sufficient: available >= needed
    }
  })
})

const canProduce = computed(() =>
  materialPreview.value.length > 0 && materialPreview.value.every(m => m.sufficient)
)

const insufficientMaterials = computed(() =>
  materialPreview.value.filter(m => !m.sufficient)
)

watch(selectedProductId, async (id) => {
  if (!id) { recipe.value = null; return }
  loadingRecipe.value = true
  try {
    const found = await recipeStore.fetchByProductId(id)
    recipe.value = found
    if (!found) toast.warning('Produk ini belum memiliki resep. Buat resep terlebih dahulu.')
  } catch (err) {
    recipe.value = null
  } finally {
    loadingRecipe.value = false
  }
})

function validate() {
  productError.value = selectedProductId.value ? '' : 'Pilih produk'
  qtyError.value = (qty.value && Number(qty.value) > 0) ? '' : 'Qty harus lebih dari 0'
  return !productError.value && !qtyError.value
}

function requestConfirm() {
  if (!validate()) return
  if (!recipe.value) { toast.error('Produk ini belum memiliki resep!'); return }
  if (!canProduce.value) { toast.error('Stok bahan tidak mencukupi untuk produksi ini!'); return }
  if (!auth.user?.id) { toast.error('User belum login atau session expired!'); return }
  showConfirm.value = true
}

async function handleProduce() {
  submitting.value = true
  try {
    const payload = {
      productId: selectedProductId.value,
      qty: Number(qty.value),
      recipe: recipe.value,
      notes: notes.value || null,
      userId: auth.user?.id
    }
    
    console.log('[ProductionPage] Trigger handleProduce:', payload)
    
    await productionStore.execute(payload)
    toast.success(`Produksi ${formatNumber(qty.value)} unit berhasil dicatat!`)
    showConfirm.value = false

    // Reset
    selectedProductId.value = ''
    qty.value = ''
    notes.value = ''
    recipe.value = null

    // Refresh data
    await Promise.all([productStore.fetchOptions(), rawStore.fetchOptions()])
  } catch (err) {
    console.error('[ProductionPage] handleProduce error:', err)
    showConfirm.value = false
    toast.error(err.message || 'Produksi gagal')
  } finally {
    submitting.value = false
  }
}

onMounted(() => { productStore.fetchOptions(); rawStore.fetchOptions() })
</script>

<template>
  <div class="max-w-2xl space-y-4">
    <div>
      <h2 class="page-title">Produksi</h2>
      <p class="page-subtitle">Proses produksi: kurangi bahan baku, tambah produk jadi</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Input Form -->
      <BaseCard padding="p-5">
        <h3 class="text-xs font-semibold text-slate-700 mb-4">Detail Produksi</h3>
        <div class="space-y-3">
          <BaseSelect
            v-model="selectedProductId"
            label="Produk yang Diproduksi"
            :options="productOptions"
            placeholder="Pilih produk..."
            :error="productError"
            required
          />

          <!-- Product info -->
          <div v-if="selectedProduct" class="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Stok saat ini</span>
              <span class="font-semibold text-slate-800">{{ formatNumber(selectedProduct.current_stock) }} {{ selectedProduct.unit }}</span>
            </div>
          </div>

          <div v-if="loadingRecipe" class="text-xs text-slate-400 flex items-center gap-1.5">
            <svg class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Memuat resep...
          </div>

          <div v-if="selectedProductId && !loadingRecipe && !recipe" class="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 flex items-center gap-1.5">
            <AlertTriangle class="w-3.5 h-3.5 shrink-0" />
            Resep belum dibuat untuk produk ini
          </div>

          <BaseInput
            v-model="qty"
            label="Jumlah Produksi"
            type="number"
            placeholder="0"
            :error="qtyError"
            :disabled="!recipe"
            required
          />

          <div class="flex flex-col gap-0.5">
            <label class="form-label">Keterangan (Opsional)</label>
            <textarea v-model="notes" class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-navy-900 resize-none" rows="2" placeholder="Catatan produksi..." />
          </div>

          <BaseButton variant="primary" size="md" :disabled="!recipe || !qty" full @click="requestConfirm">
            <Factory class="w-3.5 h-3.5" />
            Mulai Produksi
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Material Preview -->
      <BaseCard padding="p-4">
        <h3 class="text-xs font-semibold text-slate-700 mb-3">Kebutuhan Bahan Baku</h3>

        <div v-if="!recipe || !qty" class="flex flex-col items-center justify-center h-32 text-slate-400">
          <Factory class="w-8 h-8 text-slate-300 mb-2" />
          <p class="text-xs">Pilih produk dan isi qty untuk melihat kebutuhan bahan</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="mat in materialPreview"
            :key="mat.name"
            :class="['p-2.5 rounded border text-xs', mat.sufficient ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200']"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium" :class="mat.sufficient ? 'text-slate-700' : 'text-red-700'">{{ mat.name }}</span>
              <BaseBadge :variant="mat.sufficient ? 'success' : 'danger'" size="xs">
                {{ mat.sufficient ? 'Cukup' : 'Kurang' }}
              </BaseBadge>
            </div>
            <div class="mt-1.5 space-y-0.5">
              <div class="flex justify-between text-slate-500">
                <span>Dibutuhkan:</span>
                <span class="font-medium" :class="!mat.sufficient && 'text-red-600'">{{ formatNumber(mat.needed) }} {{ mat.unit }}</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span>Tersedia:</span>
                <span class="font-medium">{{ formatNumber(mat.available) }} {{ mat.unit }}</span>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div v-if="materialPreview.length" class="pt-2 border-t border-slate-200">
            <div v-if="canProduce" class="flex items-center gap-1.5 text-xs text-emerald-700">
              <CheckCircle2 class="w-3.5 h-3.5" />
              Semua bahan mencukupi. Siap produksi!
            </div>
            <div v-else class="flex items-center gap-1.5 text-xs text-red-600">
              <AlertTriangle class="w-3.5 h-3.5" />
              {{ insufficientMaterials.length }} bahan tidak mencukupi
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>

  <!-- Confirm Production -->
  <ConfirmDialog
    v-model="showConfirm"
    title="Konfirmasi Produksi"
    :message="`Produksi ${formatNumber(qty)} unit ${selectedProduct?.name}? Bahan baku akan dikurangi secara otomatis.`"
    confirm-label="Ya, Produksi Sekarang"
    variant="primary"
    :loading="submitting"
    @confirm="handleProduce"
    @cancel="showConfirm = false"
  />
</template>
