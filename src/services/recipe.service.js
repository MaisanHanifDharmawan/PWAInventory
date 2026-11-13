import { supabase } from '@/lib/supabase'

/**
 * Defensive check: validate supabase client is available.
 * @throws {Error} if supabase client is invalid
 */
function assertSupabaseClient() {
  if (!supabase || typeof supabase.rpc !== 'function') {
    throw new Error('Supabase client tidak valid atau belum diinisialisasi.')
  }
}

export const recipeService = {
  async getAll({ search = '', page = 1, perPage = 10, organization_id } = {}) {
    assertSupabaseClient()
    let query = supabase
      .from('recipes')
      .select(`
        *,
        finished_products (id, name, sku, unit)
      `, { count: 'exact' })
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)

    if (search) {
      query = query.ilike('finished_products.name', `%${search}%`)
    }

    const { data, count, error } = await query
    if (error) throw error
    return { data, count }
  },

  async getByProductId(productId, organization_id) {
    assertSupabaseClient()
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        finished_products (id, name, sku, unit),
        recipe_items (
          id,
          qty,
          raw_material_id,
          raw_materials (id, name, sku, unit, current_stock)
        )
      `)
      .eq('finished_product_id', productId)
      .eq('organization_id', organization_id)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getById(id, organization_id) {
    assertSupabaseClient()
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        finished_products (id, name, sku, unit),
        recipe_items (
          id,
          qty,
          raw_material_id,
          raw_materials (id, name, sku, unit, current_stock)
        )
      `)
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single()
    if (error) throw error
    return data
  },

  async createWithItems(recipePayload, items) {
    assertSupabaseClient()
    
    console.log('[recipeService.createWithItems] recipePayload:', recipePayload)
    console.log('[recipeService.createWithItems] items:', items)

    if (!recipePayload || !recipePayload.finished_product_id || recipePayload.finished_product_id === 'undefined' || recipePayload.finished_product_id === 'null' || recipePayload.finished_product_id === '') {
      throw new Error('Finished product wajib dipilih')
    }

    if (!items || items.length === 0) {
      throw new Error('Bahan baku tidak boleh kosong')
    }

    // Insert recipe
    const { data: recipe, error: recipeErr } = await supabase
      .from('recipes')
      .insert(recipePayload)
      .select()
      .single()
    if (recipeErr) {
      console.error('[recipeService.createWithItems] Error insert recipe:', recipeErr)
      throw recipeErr
    }

    // Insert recipe items
    const itemsPayload = items.map(item => {
      if (!item.raw_material_id || item.raw_material_id === 'undefined' || item.raw_material_id === 'null' || item.raw_material_id === '') {
         throw new Error('Ada raw material ID yang tidak valid pada bahan baku')
      }
      return {
        recipe_id: recipe.id,
        raw_material_id: item.raw_material_id,
        qty: item.qty
      }
    })

    console.log('[recipeService.createWithItems] Insert recipe_items:', itemsPayload)

    const { error: itemsErr } = await supabase
      .from('recipe_items')
      .insert(itemsPayload)
    
    if (itemsErr) {
      console.error('[recipeService.createWithItems] Error insert recipe_items:', itemsErr)
      throw itemsErr
    }

    return recipe
  },

  async updateWithItems(recipeId, recipePayload, items) {
    assertSupabaseClient()

    console.log('[recipeService.updateWithItems] recipeId:', recipeId)
    console.log('[recipeService.updateWithItems] recipePayload:', recipePayload)
    console.log('[recipeService.updateWithItems] items:', items)

    if (!recipeId || recipeId === 'undefined' || recipeId === 'null' || recipeId === '') {
      throw new Error('Recipe ID tidak valid')
    }

    if (!recipePayload || !recipePayload.finished_product_id || recipePayload.finished_product_id === 'undefined' || recipePayload.finished_product_id === 'null' || recipePayload.finished_product_id === '') {
      throw new Error('Finished product wajib dipilih')
    }

    if (!items || items.length === 0) {
      throw new Error('Bahan baku tidak boleh kosong')
    }

    const { data: recipe, error: recipeErr } = await supabase
      .from('recipes')
      .update(recipePayload)
      .eq('id', recipeId)
      .select()
      .single()
    
    if (recipeErr) {
      console.error('[recipeService.updateWithItems] Error update recipe:', recipeErr)
      throw recipeErr
    }

    // Delete old items
    const { error: deleteErr } = await supabase
      .from('recipe_items')
      .delete()
      .eq('recipe_id', recipeId)
    
    if (deleteErr) {
      console.error('[recipeService.updateWithItems] Error delete old recipe_items:', deleteErr)
      throw deleteErr
    }

    // Insert new items
    const itemsPayload = items.map(item => {
      if (!item.raw_material_id || item.raw_material_id === 'undefined' || item.raw_material_id === 'null' || item.raw_material_id === '') {
        throw new Error('Ada raw material ID yang tidak valid pada bahan baku')
      }
      return {
        recipe_id: recipeId,
        raw_material_id: item.raw_material_id,
        qty: item.qty
      }
    })

    console.log('[recipeService.updateWithItems] Insert new recipe_items:', itemsPayload)

    const { error: insertErr } = await supabase
      .from('recipe_items')
      .insert(itemsPayload)
    
    if (insertErr) {
      console.error('[recipeService.updateWithItems] Error insert new recipe_items:', insertErr)
      throw insertErr
    }

    return recipe
  },

  async delete(id) {
    assertSupabaseClient()
    if (!id || id === 'undefined' || id === 'null' || id === '') {
      throw new Error('Recipe ID tidak valid')
    }
    // Delete recipe items first (FK constraint)
    await supabase.from('recipe_items').delete().eq('recipe_id', id)
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) throw error
  }
}
