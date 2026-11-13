import { supabase } from '@/lib/supabase'

export const finishedProductService = {
  async getAll({ search = '', page = 1, perPage = 10, organization_id } = {}) {
    let query = supabase
      .from('finished_products')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('organization_id', organization_id)
      .order('name', { ascending: true })
      .range((page - 1) * perPage, page * perPage - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    const { data, count, error } = await query
    if (error) throw error
    return { data, count }
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('finished_products')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getAllActive(organization_id) {
    const { data, error } = await supabase
      .from('finished_products')
      .select('id, name, sku, selling_price, current_stock, minimum_stock, unit')
      .eq('is_deleted', false)
      .eq('organization_id', organization_id)
      .order('name')
    if (error) throw error
    return data
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('finished_products')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from('finished_products')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async softDelete(id) {
    const { data, error } = await supabase
      .from('finished_products')
      .update({ is_deleted: true })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getLowStock(organization_id) {
    const { data, error } = await supabase
      .from('finished_products')
      .select('*')
      .eq('is_deleted', false)
      .eq('organization_id', organization_id)
    if (error) throw error
    // Filter in JS for broad compatibility with different Supabase RLS setups
    return data?.filter(p => p.current_stock <= p.minimum_stock) ?? []
  }
}
