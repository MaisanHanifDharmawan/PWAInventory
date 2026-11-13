import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    // Raw profile
    id: null,
    full_name: null,
    role: null,
    organization_id: null,
    // Flattened from organizations join
    organization_name: null,
    invite_code: null,
    // Meta
    loading: false,
    error: null,
    // Keep raw for backward compat
    profile: null
  }),

  getters: {
    // Profile convenience
    fullName: (state) => state.full_name || null,
    // Organization convenience
    organizationId: (state) => state.organization_id || null,
    organizationName: (state) => state.organization_name || null,
    inviteCode: (state) => state.invite_code || null,
    // Role booleans (note: 'role' itself is a raw state field, not a getter)
    isOwner: (state) => state.role === 'owner',
    isManager: (state) => state.role === 'manager',
    isStaff: (state) => state.role === 'staff',
    hasOrganization: (state) => !!state.organization_id,
    // Legacy shape for backward compat
    organization: (state) => state.organization_name
      ? { name: state.organization_name, invite_code: state.invite_code }
      : null
  },

  actions: {
    async fetchProfile(userId) {
      if (!userId) return

      this.loading = true
      this.error = null

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            role,
            organization_id,
            organizations (
              id,
              name,
              invite_code
            )
          `)
          .eq('id', userId)
          .single()

        if (error) throw error

        // ── Debug: verify raw Supabase response ──────────────
        console.log('[ProfileStore] PROFILE RESPONSE:', data)
        console.log('[ProfileStore] ORGANIZATION:', data?.organizations)
        console.log('[ProfileStore] INVITE CODE:', data?.organizations?.invite_code)
        console.log('[ProfileStore] ORGANIZATION_ID:', data?.organization_id)

        // Flatten state
        this.id = data.id
        this.full_name = data.full_name
        this.role = data.role
        this.organization_id = data.organization_id
        this.organization_name = data.organizations?.name ?? null
        this.invite_code = data.organizations?.invite_code ?? null

        // Keep raw profile for any legacy consumers
        this.profile = {
          ...data,
          organizations: data.organizations ?? null
        }
      } catch (err) {
        console.error('[ProfileStore] Error fetching profile:', err.message)
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    clearProfile() {
      this.id = null
      this.full_name = null
      this.role = null
      this.organization_id = null
      this.organization_name = null
      this.invite_code = null
      this.profile = null
      this.error = null
    }
  }
})
