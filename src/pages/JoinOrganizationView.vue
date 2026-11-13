<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useProfileStore } from '@/stores/profile.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { KeyRound } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const profileStore = useProfileStore()
const authStore = useAuthStore()
const toast = useToast()

const inviteCode = ref('')
const loading = ref(false)

// ── Prefill from query string ─────────────────────────────────
onMounted(() => {
  const code = route.query.inviteCode
  if (code) {
    inviteCode.value = String(code).trim().toUpperCase()
  }
})

const formatInviteCode = () => {
  inviteCode.value = inviteCode.value.trim().toUpperCase()
}

// ── Join organization ─────────────────────────────────────────
const joinOrganization = async () => {
  formatInviteCode()

  if (!inviteCode.value) {
    toast.error('Invite code wajib diisi')
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase.rpc('join_organization', {
      p_invite_code: inviteCode.value
    })

    if (error) throw error

    if (data && data.success === false) {
      toast.error(data.message || 'Invite code tidak ditemukan')
      return
    }

    toast.success(data?.message || 'Berhasil bergabung ke organisasi')

    // Refresh profile to get the new organization_id and role
    await profileStore.fetchProfile(authStore.user?.id)

    // Redirect to dashboard
    router.push('/dashboard')
  } catch (err) {
    console.error('[joinOrganization] Error:', err)
    toast.error(err.message || 'Terjadi kesalahan jaringan')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto space-y-4">
    <div>
      <h2 class="page-title">Join Organization</h2>
      <p class="page-subtitle">Masukkan invite code untuk bergabung dengan organisasi</p>
    </div>

    <BaseCard padding="p-5">
      <div class="flex items-center gap-3 mb-4">
        <KeyRound class="w-4 h-4 text-slate-400" />
        <h3 class="text-xs font-semibold text-slate-700">Kode Undangan</h3>
      </div>

      <form class="space-y-4" @submit.prevent="joinOrganization">
        <BaseInput
          v-model="inviteCode"
          id="invite-code-input"
          @input="formatInviteCode"
          label="Invite Code"
          placeholder="Contoh: A7F92K1B"
          hint="Kode akan diformat otomatis menjadi huruf kapital"
          required
        />

        <div class="flex gap-2">
          <BaseButton
            to="/settings/organization"
            variant="white"
            class="flex-1"
            :disabled="loading"
          >
            Batal
          </BaseButton>
          <BaseButton
            id="btn-join-org"
            type="submit"
            variant="primary"
            class="flex-1"
            :loading="loading"
            :disabled="loading"
          >
            {{ loading ? 'Memproses...' : 'Join Organization' }}
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </div>
</template>
