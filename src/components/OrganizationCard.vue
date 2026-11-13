<script setup>
import { computed } from 'vue'
import { useProfileStore } from '@/stores/profile.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { Building2, Shield, Copy, KeyRound, AlertCircle, RefreshCw } from 'lucide-vue-next'

const profileStore = useProfileStore()
const authStore = useAuthStore()
const toast = useToast()

// Read directly from flat profileStore state
const organizationName  = computed(() => profileStore.organization_name)
const inviteCode        = computed(() => profileStore.invite_code)
const role              = computed(() => profileStore.role)
const organizationId    = computed(() => profileStore.organization_id)
const isOwner           = computed(() => profileStore.isOwner)
const loading           = computed(() => profileStore.loading)

// Has org if organization_id exists (even if name/invite_code not loaded yet)
const hasOrg = computed(() => !!organizationId.value)

// ── Copy invite code ──────────────────────────────────────────
const copyInviteCode = async () => {
  const code = inviteCode.value
  if (!code) {
    toast.error('Invite code belum tersedia')
    return
  }
  try {
    await navigator.clipboard.writeText(code)
    toast.success('Invite code berhasil disalin')
  } catch {
    toast.error('Gagal menyalin invite code')
  }
}

// ── Refresh profile data ──────────────────────────────────────
const refreshProfile = async () => {
  const userId = authStore.user?.id
  if (!userId) {
    toast.error('User tidak ditemukan')
    return
  }
  try {
    await profileStore.fetchProfile(userId)
    console.log('[OrganizationCard] After refresh:')
    console.log('  organization_name:', profileStore.organization_name)
    console.log('  invite_code:', profileStore.invite_code)
    console.log('  role:', profileStore.role)
    if (profileStore.organization_name) {
      toast.success('Data organisasi berhasil dimuat')
    } else {
      toast.error('Data organisasi masih kosong — cek console')
    }
  } catch {
    toast.error('Gagal memuat data profil')
  }
}

// ── Role badge ───────────────────────────────────────────────
const roleBadgeVariant = computed(() => {
  switch (role.value) {
    case 'owner':   return 'primary'
    case 'manager': return 'navy'
    case 'staff':   return 'slate'
    default:        return 'default'
  }
})

const roleLabel = computed(() => {
  switch (role.value) {
    case 'owner':   return 'Pemilik'
    case 'manager': return 'Manager'
    case 'staff':   return 'Staff'
    default:        return role.value ?? '—'
  }
})
</script>

<template>
  <BaseCard padding="p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-2">
        <Building2 class="w-4 h-4 text-slate-400" />
        <h3 class="text-xs font-semibold text-slate-700">Informasi Organisasi</h3>
      </div>
      <!-- Refresh icon button -->
      <button
        id="btn-refresh-org"
        class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded"
        :class="{ 'animate-spin': loading }"
        :disabled="loading"
        @click="refreshProfile"
        title="Refresh data organisasi"
      >
        <RefreshCw class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Has organization data -->
    <div v-if="organizationName" class="space-y-4">

      <!-- Organization Name -->
      <div class="flex flex-col gap-0.5">
        <span class="text-xs text-slate-400">Nama Organisasi</span>
        <span class="text-sm font-semibold text-slate-800">{{ organizationName }}</span>
      </div>

      <!-- Invite Code row -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1.5 mb-0.5">
          <KeyRound class="w-3 h-3 text-slate-400" />
          <span class="text-xs text-slate-400">Invite Code</span>
        </div>

        <!-- Invite code exists -->
        <div v-if="inviteCode" class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <span class="text-sm font-mono font-medium tracking-widest text-slate-700 select-all">
            {{ inviteCode }}
          </span>
          <!-- Copy only for owner -->
          <BaseButton
            v-if="isOwner"
            id="btn-copy-invite"
            variant="white"
            size="xs"
            class="!px-2 !py-1 gap-1 shrink-0"
            @click="copyInviteCode"
          >
            <Copy class="w-3 h-3 text-slate-500" />
            <span class="text-2xs">Salin</span>
          </BaseButton>
        </div>

        <!-- Invite code missing (org exists but no invite_code) -->
        <div v-else class="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span class="text-xs text-amber-600 italic">Invite code belum tersedia</span>
          <BaseButton
            variant="white"
            size="xs"
            class="!px-2 !py-1 shrink-0"
            :loading="loading"
            @click="refreshProfile"
          >
            <RefreshCw class="w-3 h-3" />
          </BaseButton>
        </div>
      </div>

      <!-- Role -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1.5 mb-0.5">
          <Shield class="w-3 h-3 text-slate-400" />
          <span class="text-xs text-slate-400">Role</span>
        </div>
        <div>
          <BaseBadge :variant="roleBadgeVariant" size="xs">
            {{ roleLabel }}
          </BaseBadge>
        </div>
      </div>

    </div>

    <!-- Has org_id but no name yet (data loading or RLS issue) -->
    <div v-else-if="hasOrg" class="flex flex-col items-center gap-3 py-6 text-center">
      <AlertCircle class="w-5 h-5 text-amber-300" />
      <div>
        <p class="text-xs font-medium text-slate-500">Gagal memuat data organisasi</p>
        <p class="text-2xs text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
          Organization ID tersedia tetapi data tidak terbaca. Kemungkinan RLS policy belum mengizinkan akses ke tabel <code class="font-mono">organizations</code>.
        </p>
      </div>
      <BaseButton
        id="btn-refresh-has-org"
        variant="white"
        size="sm"
        :loading="loading"
        @click="refreshProfile"
      >
        <RefreshCw class="w-3 h-3 mr-1" />
        Coba Lagi
      </BaseButton>
    </div>

    <!-- No organization at all -->
    <div v-else class="flex flex-col items-center gap-3 py-8 text-center">
      <AlertCircle class="w-5 h-5 text-slate-300" />
      <div>
        <p class="text-xs font-medium text-slate-500">Organisasi tidak ditemukan</p>
        <p class="text-2xs text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
          Data organisasi belum tersedia. Klik refresh untuk memuat ulang.
        </p>
      </div>
      <BaseButton
        id="btn-refresh-empty"
        variant="white"
        size="sm"
        :loading="loading"
        @click="refreshProfile"
      >
        <RefreshCw class="w-3 h-3 mr-1" />
        Refresh Data
      </BaseButton>
    </div>
  </BaseCard>
</template>
