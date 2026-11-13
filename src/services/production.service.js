import { supabase } from '@/lib/supabase'
import { MOVEMENT_TYPE, ITEM_TYPE } from '@/constants/movementTypes'

/**
 * Defensive check: validate supabase client is available.
 * @throws {Error} if supabase client is invalid
 */
function assertSupabaseClient() {
  if (!supabase || typeof supabase.rpc !== 'function') {
    throw new Error('Supabase client tidak valid atau belum diinisialisasi.')
  }
}

export const productionService = {
  /**
   * Execute production batch:
   * 1. Validate raw material stock
   * 2. Deduct raw materials (PRODUCTION_OUT)
   * 3. Add finished product (PRODUCTION_IN)
   * 4. Insert production_batch record
   *
   * @param {object} params
   * @param {string} params.productId
   * @param {number} params.qty
   * @param {object} params.recipe - must include recipe_items[].qty, recipe_items[].raw_materials, etc.
   * @param {string} [params.notes]
   * @param {string} [params.userId]
   * @returns {{ batch: object, movements: object[] }}
   */
  async execute(payload) {
    assertSupabaseClient()

    console.log('[productionService.execute] Payload:', payload)

    const { productId, qty, recipe, notes, userId, organization_id } = payload

    if (!productId) {
      throw new Error('Finished product wajib dipilih')
    }
    if (!qty || qty <= 0) {
      throw new Error('Qty produksi harus lebih dari 0')
    }
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') {
      throw new Error('User belum login')
    }
    if (!recipe || !Array.isArray(recipe.recipe_items) || recipe.recipe_items.length === 0) {
      throw new Error('Recipe tidak valid atau tidak memiliki recipe_items.')
    }
    if (!recipe.id || recipe.id === 'undefined' || recipe.id === 'null' || recipe.id === '') {
      throw new Error('Recipe ID tidak valid')
    }

    // 1. Validate all material stock before any mutations
    for (const item of recipe.recipe_items) {
      if (!item.raw_material_id || item.raw_material_id === 'undefined' || item.raw_material_id === 'null' || item.raw_material_id === '') {
        throw new Error('Ada raw material ID yang tidak valid pada resep')
      }
      const required = item.qty * qty
      const available = item.raw_materials?.current_stock || 0
      if (available < required) {
        throw new Error(
          `Stok ${item.raw_materials?.name || 'bahan baku'} tidak cukup. ` +
          `Dibutuhkan: ${required} ${item.raw_materials?.unit || ''}, ` +
          `Tersedia: ${available} ${item.raw_materials?.unit || ''}`
        )
      }
    }

    const movements = []

    // 2. Deduct raw materials
    for (const item of recipe.recipe_items) {
      const required = item.qty * qty

      // Fetch latest current_stock for accuracy
      const { data: rawItem, error: rawFetchErr } = await supabase
        .from('raw_materials')
        .select('current_stock')
        .eq('id', item.raw_material_id)
        .single()

      if (rawFetchErr) {
        console.error('[productionService.execute] Gagal fetch raw_material current_stock:', rawFetchErr)
        throw rawFetchErr
      }

      const outMovementPayload = {
        item_type: ITEM_TYPE.RAW_MATERIAL,
        item_id: item.raw_material_id,
        movement_type: MOVEMENT_TYPE.PRODUCTION_OUT,
        qty: required,
        notes: `Produksi ${qty} unit ${recipe.finished_products?.name || ''}`,
        created_by: userId,
        organization_id
      }

      console.log('[productionService.execute] Insert PRODUCTION_OUT:', outMovementPayload)

      // Insert PRODUCTION_OUT movement
      const { data: mov, error: movErr } = await supabase
        .from('stock_movements')
        .insert(outMovementPayload)
        .select()
        .single()

      if (movErr) {
        console.error('[productionService.execute] Gagal insert PRODUCTION_OUT movement:', movErr)
        throw movErr
      }
      movements.push(mov)

      // Update raw material stock
      const { error: updateErr } = await supabase
        .from('raw_materials')
        .update({ current_stock: (rawItem?.current_stock || 0) - required })
        .eq('id', item.raw_material_id)

      if (updateErr) {
        console.error('[productionService.execute] Gagal update raw_material current_stock:', updateErr)
        throw updateErr
      }
    }

    // 3. Add finished product stock
    const { data: product, error: productFetchErr } = await supabase
      .from('finished_products')
      .select('current_stock')
      .eq('id', productId)
      .single()

    if (productFetchErr) {
      console.error('[productionService.execute] Gagal fetch finished_product current_stock:', productFetchErr)
      throw productFetchErr
    }

    const inMovementPayload = {
      item_type: ITEM_TYPE.FINISHED_PRODUCT,
      item_id: productId,
      movement_type: MOVEMENT_TYPE.PRODUCTION_IN,
      qty: qty,
      notes: notes || `Hasil produksi ${qty} unit`,
      created_by: userId,
      organization_id
    }

    console.log('[productionService.execute] Insert PRODUCTION_IN:', inMovementPayload)

    const { data: prodMov, error: prodMovErr } = await supabase
      .from('stock_movements')
      .insert(inMovementPayload)
      .select()
      .single()

    if (prodMovErr) {
      console.error('[productionService.execute] Gagal insert PRODUCTION_IN movement:', prodMovErr)
      throw prodMovErr
    }
    movements.push(prodMov)

    const { error: finishUpdateErr } = await supabase
      .from('finished_products')
      .update({ current_stock: (product?.current_stock || 0) + qty })
      .eq('id', productId)

    if (finishUpdateErr) {
      console.error('[productionService.execute] Gagal update finished_product current_stock:', finishUpdateErr)
      throw finishUpdateErr
    }

    // 4. Insert production batch record
    const batchPayload = {
      finished_product_id: productId,
      recipe_id: recipe.id,
      qty_produced: qty,
      notes: notes || null,
      created_by: userId,
      organization_id,
      status: 'completed'
    }

    console.log('[productionService.execute] Insert production_batch:', batchPayload)

    const { data: batch, error: batchErr } = await supabase
      .from('production_batches')
      .insert(batchPayload)
      .select()
      .single()

    if (batchErr) {
      console.error('[productionService.execute] Gagal insert production_batch:', batchErr)
      throw batchErr
    }

    return { batch, movements }
  },

  /**
   * Get paginated production history.
   */
  async getHistory({ page = 1, perPage = 20, dateFrom, dateTo, organization_id } = {}) {
    assertSupabaseClient()

    try {
      let query = supabase
        .from('production_batches')
        .select(`
          *,
          finished_products (id, name, sku, unit),
          profiles (full_name)
        `, { count: 'exact' })
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1)

      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

      const { data, count, error } = await query

      if (error) {
        console.error('[productionService.getHistory] Error:', error)
        throw error
      }

      return { data: data || [], count: count || 0 }
    } catch (err) {
      console.error('[productionService.getHistory] Unexpected error:', err)
      throw err
    }
  },

  /**
   * Get recent production batches.
   */
  async getRecentBatches(limit = 5, organization_id) {
    assertSupabaseClient()

    try {
      const { data, error } = await supabase
        .from('production_batches')
        .select('*, finished_products(name, unit)')
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('[productionService.getRecentBatches] Error:', error)
        throw error
      }

      return data || []
    } catch (err) {
      console.error('[productionService.getRecentBatches] Unexpected error:', err)
      throw err
    }
  }
}
