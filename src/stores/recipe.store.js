import { defineStore } from 'pinia'
import { ref } from 'vue'
import { recipeService } from '@/services/recipe.service'
import { useOrganization } from '@/composables/useOrganization'

export const useRecipeStore = defineStore('recipe', () => {
  const { requireOrganization } = useOrganization()
  const items = ref([])
  const total = ref(0)
  const loading = ref(false)
  const currentRecipe = ref(null)

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      const result = await recipeService.getAll({ ...params, organization_id: orgId })
      items.value = result.data
      total.value = result.count
    } finally {
      loading.value = false
    }
  }

  async function fetchByProductId(productId) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      currentRecipe.value = await recipeService.getByProductId(productId, orgId)
      return currentRecipe.value
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      currentRecipe.value = await recipeService.getById(id, orgId)
      return currentRecipe.value
    } finally {
      loading.value = false
    }
  }

  async function create(payload, items) {
    loading.value = true
    try {
      const orgId = requireOrganization()
      return await recipeService.createWithItems({ ...payload, organization_id: orgId }, items)
    } finally {
      loading.value = false
    }
  }

  async function update(id, payload, items) {
    loading.value = true
    try {
      return await recipeService.updateWithItems(id, payload, items)
    } finally {
      loading.value = false
    }
  }

  async function remove(id) {
    loading.value = true
    try {
      await recipeService.delete(id)
      items.value = items.value.filter(i => i.id !== id)
      total.value--
    } finally {
      loading.value = false
    }
  }

  return { items, total, loading, currentRecipe, fetchAll, fetchByProductId, fetchById, create, update, remove }
})
