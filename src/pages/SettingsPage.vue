<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'
import { storeToRefs } from 'pinia'
import { useToast } from '@/composables/useToast'
import OrganizationCard from '@/components/OrganizationCard.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import { User, Lock } from 'lucide-vue-next'

const auth = useAuthStore()
const profileStore = useProfileStore()
const { full_name, role } = storeToRefs(profileStore)
const toast = useToast()

const profileForm = reactive({ full_name: full_name.value || '', phone: '' })
const savingProfile = ref(false)

const passwordForm = reactive({ current: '', newPass: '', confirm: '' })
const passwordErrors = reactive({ newPass: '', confirm: '' })
const savingPassword = ref(false)

async function saveProfile() {
  savingProfile.value = true
  try {
    await auth.updateProfile({ full_name: profileForm.full_name, phone: profileForm.phone })
    toast.success('Profil berhasil diperbarui')
  } catch (err) {
    toast.error(err.message || 'Gagal memperbarui profil')
  } finally {
    savingProfile.value = false
  }
}

async function savePassword() {
  passwordErrors.newPass = ''
  passwordErrors.confirm = ''
  if (passwordForm.newPass.length < 6) { passwordErrors.newPass = 'Minimal 6 karakter'; return }
  if (passwordForm.newPass !== passwordForm.confirm) { passwordErrors.confirm = 'Password tidak cocok'; return }
  savingPassword.value = true
  try {
    await auth.updatePassword(passwordForm.newPass)
    toast.success('Password berhasil diperbarui')
    Object.assign(passwordForm, { current: '', newPass: '', confirm: '' })
  } catch (err) {
    toast.error(err.message || 'Gagal mengubah password')
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div class="max-w-xl space-y-4">
    <div>
      <h2 class="page-title">Pengaturan</h2>
      <p class="page-subtitle">Kelola profil dan keamanan akun</p>
    </div>

    <!-- Organization card -->
    <OrganizationCard />

    <!-- Profile info -->
    <BaseCard padding="p-5">
      <div class="flex items-center gap-3 mb-4">
        <User class="w-4 h-4 text-slate-400" />
        <h3 class="text-xs font-semibold text-slate-700">Informasi Profil</h3>
      </div>

      <div class="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded border border-slate-200">
        <div class="w-9 h-9 rounded-full bg-navy-900 flex items-center justify-center text-white font-bold text-sm">
          {{ (full_name || auth.user?.email)?.charAt(0)?.toUpperCase() }}
        </div>
        <div>
          <p class="text-sm font-medium text-slate-800">{{ full_name || auth.user?.email }}</p>
          <p class="text-xs text-slate-400">{{ auth.user?.email }}</p>
          <BaseBadge variant="navy" size="xs" class="mt-0.5 capitalize">{{ role || 'user' }}</BaseBadge>
        </div>
      </div>

      <form class="space-y-3" @submit.prevent="saveProfile">
        <BaseInput v-model="profileForm.full_name" label="Nama Lengkap" placeholder="Nama lengkap" />
        <BaseInput v-model="profileForm.phone" label="No. Telepon" placeholder="+62..." />
        <BaseInput :model-value="auth.user?.email" label="Email" disabled hint="Email tidak bisa diubah" />
        <div class="flex justify-end">
          <BaseButton type="submit" variant="primary" size="sm" :loading="savingProfile">Simpan Profil</BaseButton>
        </div>
      </form>
    </BaseCard>

    <!-- Password change -->
    <BaseCard padding="p-5">
      <div class="flex items-center gap-3 mb-4">
        <Lock class="w-4 h-4 text-slate-400" />
        <h3 class="text-xs font-semibold text-slate-700">Ubah Password</h3>
      </div>
      <form class="space-y-3" @submit.prevent="savePassword">
        <BaseInput v-model="passwordForm.newPass" label="Password Baru" type="password" placeholder="••••••••" :error="passwordErrors.newPass" />
        <BaseInput v-model="passwordForm.confirm" label="Konfirmasi Password" type="password" placeholder="••••••••" :error="passwordErrors.confirm" />
        <div class="flex justify-end">
          <BaseButton type="submit" variant="primary" size="sm" :loading="savingPassword">Ubah Password</BaseButton>
        </div>
      </form>
    </BaseCard>

    <!-- App info -->
    <BaseCard padding="p-4">
      <div class="flex items-center gap-3 mb-3">
        <Shield class="w-4 h-4 text-slate-400" />
        <h3 class="text-xs font-semibold text-slate-700">Informasi Aplikasi</h3>
      </div>
      <div class="space-y-1.5 text-xs">
        <div class="flex items-center justify-between">
          <span class="text-slate-500">Versi</span>
          <span class="font-medium text-slate-700">1.0.0</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-slate-500">Backend</span>
          <span class="font-medium text-slate-700">Supabase</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-slate-500">Mode</span>
          <BaseBadge variant="success" size="xs">PWA</BaseBadge>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
