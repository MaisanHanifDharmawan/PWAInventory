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

export const reportService = {
  /**
   * Get paginated stock movements with optional filters.
   */
  async getStockMovements({ page = 1, perPage = 20, itemType, movementType, dateFrom, dateTo, organization_id } = {}) {
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
        console.error('[reportService.getStockMovements] Error:', error)
        throw error
      }

      return { data: data || [], count: count || 0 }
    } catch (err) {
      console.error('[reportService.getStockMovements] Unexpected error:', err)
      throw err
    }
  },

  /**
   * Get paginated production history.
   */
  async getProductionHistory({ page = 1, perPage = 20, dateFrom, dateTo, organization_id } = {}) {
    assertSupabaseClient()

    try {
      let query = supabase
        .from('production_batches')
        .select(`
          *,
          finished_products (name, sku, unit),
          profiles (full_name)
        `, { count: 'exact' })
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1)

      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

      const { data, count, error } = await query

      if (error) {
        console.error('[reportService.getProductionHistory] Error:', error)
        throw error
      }

      return { data: data || [], count: count || 0 }
    } catch (err) {
      console.error('[reportService.getProductionHistory] Unexpected error:', err)
      throw err
    }
  },

  /**
   * Get all raw materials with low stock (current_stock <= minimum_stock).
   * Filtering is done in JS for broad RLS compatibility.
   */
  async getLowStockRaw(organization_id) {
    assertSupabaseClient()

    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('is_deleted', false)
        .eq('organization_id', organization_id)

      if (error) {
        console.error('[reportService.getLowStockRaw] Error:', error)
        throw error
      }

      return (data || []).filter(m => m.current_stock <= m.minimum_stock)
    } catch (err) {
      console.error('[reportService.getLowStockRaw] Unexpected error:', err)
      throw err
    }
  },

  /**
   * Get all finished products with low stock (current_stock <= minimum_stock).
   * Filtering is done in JS for broad RLS compatibility.
   */
  async getLowStockFinished(organization_id) {
    assertSupabaseClient()

    try {
      const { data, error } = await supabase
        .from('finished_products')
        .select('*')
        .eq('is_deleted', false)
        .eq('organization_id', organization_id)

      if (error) {
        console.error('[reportService.getLowStockFinished] Error:', error)
        throw error
      }

      return (data || []).filter(p => p.current_stock <= p.minimum_stock)
    } catch (err) {
      console.error('[reportService.getLowStockFinished] Unexpected error:', err)
      throw err
    }
  },

  /**
   * Get dashboard summary statistics.
   * @returns {object} stats
   */
  async getDashboardStats(organization_id) {
    assertSupabaseClient()

    try {
      const [rawResult, finishedResult, movementsResult] = await Promise.all([
        supabase.from('raw_materials').select('id, current_stock, minimum_stock').eq('is_deleted', false).eq('organization_id', organization_id),
        supabase.from('finished_products').select('id, current_stock, minimum_stock').eq('is_deleted', false).eq('organization_id', organization_id),
        supabase.from('stock_movements').select('movement_type, qty, created_at').eq('organization_id', organization_id).order('created_at', { ascending: false }).limit(30)
      ])

      if (rawResult.error) {
        console.error('[reportService.getDashboardStats] Error fetching raw_materials:', rawResult.error)
        throw rawResult.error
      }
      if (finishedResult.error) {
        console.error('[reportService.getDashboardStats] Error fetching finished_products:', finishedResult.error)
        throw finishedResult.error
      }
      if (movementsResult.error) {
        console.error('[reportService.getDashboardStats] Error fetching stock_movements:', movementsResult.error)
        throw movementsResult.error
      }

      const rawMaterials = rawResult.data || []
      const finishedProducts = finishedResult.data || []
      const movements = movementsResult.data || []

      const lowStockRaw = rawMaterials.filter(m => m.current_stock <= m.minimum_stock).length
      const lowStockFinished = finishedProducts.filter(p => p.current_stock <= p.minimum_stock).length

      return {
        totalRawMaterials: rawMaterials.length,
        totalFinishedProducts: finishedProducts.length,
        lowStockAlerts: lowStockRaw + lowStockFinished,
        lowStockRaw,
        lowStockFinished,
        recentMovements: movements
      }
    } catch (err) {
      console.error('[reportService.getDashboardStats] Unexpected error:', err)
      throw err
    }
  },

  /**
   * Get movement chart data for the last N days.
   * @param {number} days
   * @returns {object[]}
   */
  async getMovementChartData(days = 7, organization_id) {
    assertSupabaseClient()

    try {
      const from = new Date()
      from.setDate(from.getDate() - days)

      const { data, error } = await supabase
        .from('stock_movements')
        .select('movement_type, qty, created_at')
        .eq('organization_id', organization_id)
        .gte('created_at', from.toISOString())
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[reportService.getMovementChartData] Error:', error)
        throw error
      }

      return data || []
    } catch (err) {
      console.error('[reportService.getMovementChartData] Unexpected error:', err)
      throw err
    }
  }
}
