import { supabase } from '@/lib/supabase'
import { MOVEMENT_TYPE, ITEM_TYPE } from '@/constants/movementTypes'

/**
 * Defensive check: validate supabase client is available and has rpc method.
 * @throws {Error} if supabase client is invalid
 */
function assertSupabaseClient() {
  if (!supabase || typeof supabase.rpc !== 'function') {
    throw new Error('Supabase client tidak valid atau belum diinisialisasi.')
  }
}

export const stockService = {
  /**
   * Stock In: insert movement and update current_stock via RPC (with JS fallback).
   * @param {object} params
   * @param {string} params.itemType
   * @param {string} params.itemId
   * @param {number} params.qty
   * @param {string} [params.notes]
   * @param {string} [params.userId]
   * @returns {object} movement record
   */
  async stockIn({ itemType, itemId, qty, notes, userId, organization_id }) {
    assertSupabaseClient()

    console.log('[stockService.stockIn] Payload:', { itemType, itemId, qty, notes, userId })

    if (!itemType || !itemId || !qty || qty <= 0) {
      throw new Error('Parameter stockIn tidak valid: itemType, itemId, dan qty (> 0) wajib diisi.')
    }
    
    if (itemId === 'undefined' || itemId === 'null' || itemId === '') {
      throw new Error('Item ID tidak valid.')
    }

    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') {
      throw new Error('User belum login')
    }

    const table = itemType === ITEM_TYPE.RAW_MATERIAL ? 'raw_materials' : 'finished_products'

    const movementPayload = {
      item_type: itemType,
      item_id: itemId,
      movement_type: MOVEMENT_TYPE.IN,
      qty: qty,
      notes: notes || null,
      created_by: userId,
      organization_id
    }

    console.log('[stockService.stockIn] Insert movement:', movementPayload)

    // 1. Insert stock movement
    const { data: movement, error: movErr } = await supabase
      .from('stock_movements')
      .insert(movementPayload)
      .select()
      .single()

    if (movErr) {
      console.error('[stockService.stockIn] Gagal insert stock_movements:', movErr)
      throw movErr
    }

    // 2. Update current_stock via RPC with JS fallback
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('increment_stock', {
        p_table: table,
        p_id: itemId,
        p_qty: qty
      })

      if (rpcErr) {
        // RPC function belum dibuat atau gagal — gunakan fallback manual update
        console.warn('[stockService.stockIn] RPC increment_stock tidak tersedia, menggunakan fallback manual:', rpcErr.message)

        const { data: currentItem, error: fetchErr } = await supabase
          .from(table)
          .select('current_stock')
          .eq('id', itemId)
          .single()

        if (fetchErr) {
          console.error('[stockService.stockIn] Gagal fetch current_stock untuk fallback:', fetchErr)
          throw fetchErr
        }

        const { error: updateErr } = await supabase
          .from(table)
          .update({ current_stock: (currentItem?.current_stock || 0) + qty })
          .eq('id', itemId)

        if (updateErr) {
          console.error('[stockService.stockIn] Gagal update stock (fallback):', updateErr)
          throw updateErr
        }
      }
      // rpcData is ignored — only care about error
      void rpcData
    } catch (err) {
      // If it's already a thrown error from above, re-throw
      if (err?.code || err?.message) {
        console.error('[stockService.stockIn] Error update stock:', err)
        throw err
      }
      // Network/timeout error
      console.error('[stockService.stockIn] Network/timeout error saat update stock:', err)
      throw new Error('Gagal mengupdate stok karena masalah jaringan atau timeout.')
    }

    return movement
  },

  /**
   * Stock Out: validate stock, insert movement, decrease current_stock.
   * @param {object} params
   * @param {string} params.itemType
   * @param {string} params.itemId
   * @param {number} params.qty
   * @param {string} [params.notes]
   * @param {string} [params.userId]
   * @returns {object} movement record
   */
  async stockOut({ itemType, itemId, qty, notes, userId, organization_id }) {
    assertSupabaseClient()

    console.log('[stockService.stockOut] Payload:', { itemType, itemId, qty, notes, userId })

    if (!itemType || !itemId || !qty || qty <= 0) {
      throw new Error('Parameter stockOut tidak valid: itemType, itemId, dan qty (> 0) wajib diisi.')
    }

    if (itemId === 'undefined' || itemId === 'null' || itemId === '') {
      throw new Error('Item ID tidak valid.')
    }

    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') {
      throw new Error('User belum login')
    }

    const table = itemType === ITEM_TYPE.RAW_MATERIAL ? 'raw_materials' : 'finished_products'

    // 1. Check stock availability
    const { data: item, error: checkErr } = await supabase
      .from(table)
      .select('current_stock, name')
      .eq('id', itemId)
      .single()

    if (checkErr) {
      console.error('[stockService.stockOut] Gagal fetch item untuk validasi stok:', checkErr)
      throw checkErr
    }

    if ((item.current_stock || 0) < qty) {
      throw new Error(
        `Stok ${item.name} tidak mencukupi. Stok tersedia: ${item.current_stock}, dibutuhkan: ${qty}`
      )
    }

    const movementPayload = {
      item_type: itemType,
      item_id: itemId,
      movement_type: MOVEMENT_TYPE.OUT,
      qty: qty,
      notes: notes || null,
      created_by: userId,
      organization_id
    }

    console.log('[stockService.stockOut] Insert movement:', movementPayload)

    // 2. Insert stock movement
    const { data: movement, error: movErr } = await supabase
      .from('stock_movements')
      .insert(movementPayload)
      .select()
      .single()

    if (movErr) {
      console.error('[stockService.stockOut] Gagal insert stock_movements:', movErr)
      throw movErr
    }

    // 3. Decrease current_stock
    const { error: stockErr } = await supabase
      .from(table)
      .update({ current_stock: item.current_stock - qty })
      .eq('id', itemId)

    if (stockErr) {
      console.error('[stockService.stockOut] Gagal update current_stock:', stockErr)
      throw stockErr
    }

    return movement
  },

  /**
   * Get paginated stock movements with optional filters.
   */
  async getMovements({ page = 1, perPage = 20, itemType, movementType, dateFrom, dateTo, organization_id } = {}) {
    assertSupabaseClient()

    try {
      let query = supabase
        .from('stock_movements')
        .select('*, profiles(full_name)', { count: 'exact' })
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1)

      if (itemType) query = query.eq('item_type', itemType)
      if (movementType) query = query.eq('movement_type', movementType)
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

      const { data, count, error } = await query

      if (error) {
        console.error('[stockService.getMovements] Error:', error)
        throw error
      }

      return { data: data || [], count: count || 0 }
    } catch (err) {
      console.error('[stockService.getMovements] Unexpected error:', err)
      throw err
    }
  },

  /**
   * Get recent stock movements.
   */
  async getRecentMovements(limit = 10, organization_id) {
    assertSupabaseClient()

    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, profiles(full_name)')
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('[stockService.getRecentMovements] Error:', error)
        throw error
      }

      return data || []
    } catch (err) {
      console.error('[stockService.getRecentMovements] Unexpected error:', err)
      throw err
    }
  }
}
