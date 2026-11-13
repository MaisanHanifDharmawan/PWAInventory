import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import { useProfileStore } from '@/stores/profile.store'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  // Convenience getters derived from profileStore
  const userName = computed(() => {
    const profileStore = useProfileStore()
    return profileStore.full_name || user.value?.email || null
  })
  const userRole = computed(() => {
    const profileStore = useProfileStore()
    return profileStore.role || null
  })

  async function initialize() {
    loading.value = true
    try {
      const session = await authService.getSession()
      if (session?.user) {
        user.value = session.user
        const profileStore = useProfileStore()
        await profileStore.fetchProfile(session.user.id)
      }
    } catch (err) {
      console.error('Auth init error:', err)
    } finally {
      loading.value = false
      initialized.value = true
    }

    // Listen to auth state changes
    authService.onAuthStateChange(async (event, session) => {
      const profileStore = useProfileStore()
      if (event === 'SIGNED_IN' && session?.user) {
        user.value = session.user
        await profileStore.fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        profileStore.clearProfile()
      }
    })
  }

  async function login(email, password) {
    loading.value = true
    try {
      const data = await authService.signIn(email, password)
      user.value = data.user

      console.log('AUTH USER', data.user)

      if (data.user) {
        const profileStore = useProfileStore()
        await profileStore.fetchProfile(data.user.id)

        console.log('ORGANIZATION', profileStore.organization_name)
        console.log('INVITE CODE', profileStore.invite_code)
        console.log('ROLE', profileStore.role)
      }
      return true
    } catch (err) {
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(email, password, payload) {
    loading.value = true
    try {
      const data = await authService.signUp(email, password, payload)
      return data
    } catch (err) {
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    try {
      await authService.signOut()
      user.value = null
      const profileStore = useProfileStore()
      profileStore.clearProfile()
    } catch (err) {
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(updates) {
    if (!user.value) return
    const updated = await authService.updateProfile(user.value.id, updates)
    const profileStore = useProfileStore()
    profileStore.profile = updated
    return updated
  }

  async function updatePassword(newPassword) {
    return authService.updatePassword(newPassword)
  }

  return {
    user, loading, initialized,
    isAuthenticated, userName, userRole,
    initialize, login, register, logout, updateProfile, updatePassword
  }
})
