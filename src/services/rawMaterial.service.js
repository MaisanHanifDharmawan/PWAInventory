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

export const rawMaterialService = {
  async getAll({ search = '', page = 1, perPage = 10, organization_id } = {}) {
    assertSupabaseClient()

    try {
      let query = supabase
        .from('raw_materials')
        .select('*', { count: 'exact' })
        .eq('is_deleted', false)
        .eq('organization_id', organization_id)
        .order('name', { ascending: true })
        .range((page - 1) * perPage, page * perPage - 1)

      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
      }

      const { data, count, error } = await query

      if (error) {
        console.error('[rawMaterialService.getAll] Error:', error)
        throw error
      }

      return { data: data || [], count: count || 0 }
    } catch (err) {
      console.error('[rawMaterialService.getAll] Unexpected error:', err)
      throw err
    }
  },

  async getById(id) {
    assertSupabaseClient()

    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('[rawMaterialService.getById] Error:', error)
        throw error
      }

      return data
    } catch (err) {
      console.error('[rawMaterialService.getById] Unexpected error:', err)
      throw err
    }
  },

  async getAllActive(organization_id) {
    assertSupabaseClient()

    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('id, name, sku, unit, current_stock, minimum_stock')
        .eq('is_deleted', false)
        .eq('organization_id', organization_id)
        .order('name')

      if (error) {
        console.error('[rawMaterialService.getAllActive] Error:', error)
        throw error
      }

      return data || []
    } catch (err) {
      console.error('[rawMaterialService.getAllActive] Unexpected error:', err)
      throw err
    }
  },

  async create(payload) {
    assertSupabaseClient()

    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload create raw material tidak valid.')
    }

    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error('[rawMaterialService.create] Error:', error)
        throw error
      }

      return data
    } catch (err) {
      console.error('[rawMaterialService.create] Unexpected error:', err)
      throw err
    }
  },

  async update(id, payload) {
    assertSupabaseClient()

    if (!id || !payload || typeof payload !== 'object') {
      throw new Error('Parameter update raw material tidak valid.')
    }

    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[rawMaterialService.update] Error:', error)
        throw error
      }

      return data
    } catch (err) {
      console.error('[rawMaterialService.update] Unexpected error:', err)
      throw err
    }
  },

  async softDelete(id) {
    assertSupabaseClient()

    if (!id) throw new Error('ID raw material wajib diisi untuk soft delete.')

    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .update({ is_deleted: true })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[rawMaterialService.softDelete] Error:', error)
        throw error
      }

      return data
    } catch (err) {
      console.error('[rawMaterialService.softDelete] Unexpected error:', err)
      throw err
    }
  },

  /**
   * Get raw materials with low stock (current_stock <= minimum_stock).
   * Note: supabase.raw() is NOT available in Supabase JS v2.
   * Filtering is done in JavaScript for compatibility.
   */
  async getLowStock(organization_id) {
    assertSupabaseClient()

    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('is_deleted', false)
        .eq('organization_id', organization_id)

      if (error) {
        console.error('[rawMaterialService.getLowStock] Error:', error)
        throw error
      }

      return (data || []).filter(m => m.current_stock <= m.minimum_stock)
    } catch (err) {
      console.error('[rawMaterialService.getLowStock] Unexpected error:', err)
      throw err
    }
  }
}
