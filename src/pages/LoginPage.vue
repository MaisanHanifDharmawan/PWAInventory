<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

// ── Mode tabs ───────────────────────────────────────────────
const mode = ref('login') // 'login' | 'register'

// ── Account type (register only) ────────────────────────────
const accountType = ref('owner') // 'owner' | 'staff'

// ── Form state ──────────────────────────────────────────────
const form = reactive({
  email: '',
  password: '',
  fullName: '',
  organizationName: '',
  inviteCode: ''
})

const errors = reactive({
  email: '',
  password: '',
  fullName: '',
  organizationName: '',
  inviteCode: ''
})

const loading = ref(false)

// ── Computed ─────────────────────────────────────────────────
const isOwner = computed(() => accountType.value === 'owner')
const isStaff = computed(() => accountType.value === 'staff')

const title = computed(() =>
  mode.value === 'login' ? 'Masuk ke akun Anda' : 'Daftar akun baru'
)
const subtitle = computed(() => {
  if (mode.value === 'login') return 'Gunakan email dan password yang terdaftar'
  if (isOwner.value) return 'Buat organisasi baru untuk UMKM Anda'
  return 'Masukkan invite code yang diberikan oleh pemilik organisasi'
})

// ── Helpers ──────────────────────────────────────────────────
function resetForm() {
  form.email = ''
  form.password = ''
  form.fullName = ''
  form.organizationName = ''
  form.inviteCode = ''
  errors.email = ''
  errors.password = ''
  errors.fullName = ''
  errors.organizationName = ''
  errors.inviteCode = ''
}

function switchMode(newMode) {
  mode.value = newMode
  resetForm()
}

// ── Validation ───────────────────────────────────────────────
function validate() {
  let valid = true
  errors.email = ''
  errors.password = ''
  errors.fullName = ''
  errors.organizationName = ''
  errors.inviteCode = ''

  if (!form.email) { errors.email = 'Email wajib diisi'; valid = false }
  if (!form.password) { errors.password = 'Password wajib diisi'; valid = false }

  if (mode.value === 'register') {
    if (!form.fullName) { errors.fullName = 'Nama lengkap wajib diisi'; valid = false }
    if (isOwner.value && !form.organizationName) {
      errors.organizationName = 'Nama organisasi wajib diisi'
      valid = false
    }
    if (isStaff.value && !form.inviteCode) {
      errors.inviteCode = 'Invite code wajib diisi'
      valid = false
    }
  }
  return valid
}

// ── Submit ───────────────────────────────────────────────────
async function handleSubmit() {
  if (!validate()) return
  loading.value = true

  try {
    if (mode.value === 'login') {
      await auth.login(form.email, form.password)
      toast.success('Selamat datang kembali!')
      const redirect = route.query.redirect || '/dashboard'
      router.push(redirect)
    } else {
      // Register — backend trigger handles org creation (owner) or join (staff)
      const payload = {
        fullName: form.fullName,
        accountType: accountType.value,
        organizationName: isOwner.value ? form.organizationName : undefined,
        inviteCode: isStaff.value ? form.inviteCode.trim().toUpperCase() : undefined
      }

      await auth.register(form.email, form.password, payload)
      toast.success('Akun berhasil dibuat! Silakan masuk.')
      switchMode('login')
    }
  } catch (err) {
    toast.error(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-sm">
    <!-- Logo -->
    <div class="flex items-center gap-2.5 mb-6">
      <div class="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div>
        <h1 class="text-base font-bold text-slate-900 leading-none">Inventory UMKM</h1>
        <p class="text-xs text-slate-400 mt-0.5">Sistem Manajemen Stok</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-4 mb-4 border-b border-slate-200">
      <button
        id="tab-login"
        class="pb-2 text-sm font-medium transition-colors"
        :class="mode === 'login' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'"
        @click="switchMode('login')"
      >
        Masuk
      </button>
      <button
        id="tab-register"
        class="pb-2 text-sm font-medium transition-colors"
        :class="mode === 'register' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'"
        @click="switchMode('register')"
      >
        Daftar
      </button>
    </div>

    <!-- Card -->
    <div class="bg-white border border-slate-200 rounded-xl p-6">
      <h2 class="text-sm font-semibold text-slate-800 mb-1">{{ title }}</h2>
      <p class="text-xs text-slate-400 mb-5">{{ subtitle }}</p>

      <form class="space-y-3.5" @submit.prevent="handleSubmit">

        <!-- ── Account Type Selector (register only) ── -->
        <template v-if="mode === 'register'">
          <div>
            <label class="form-label mb-1.5 block">Daftar Sebagai</label>
            <div class="grid grid-cols-2 gap-2">
              <!-- Owner card -->
              <button
                id="account-type-owner"
                type="button"
                class="relative flex flex-col gap-1 p-3 rounded-lg border text-left transition-all duration-150"
                :class="isOwner
                  ? 'border-slate-800 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
                @click="accountType = 'owner'"
              >
                <!-- radio dot -->
                <span class="flex items-center gap-1.5">
                  <span
                    class="inline-flex w-3 h-3 rounded-full border-2 items-center justify-center shrink-0"
                    :class="isOwner ? 'border-white' : 'border-slate-300'"
                  >
                    <span v-if="isOwner" class="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                  <span class="text-xs font-semibold leading-none" :class="isOwner ? 'text-white' : 'text-slate-700'">
                    Pemilik UMKM
                  </span>
                </span>
                <span class="text-2xs leading-tight pl-[18px]" :class="isOwner ? 'text-slate-300' : 'text-slate-400'">
                  Buat organisasi baru
                </span>
              </button>

              <!-- Staff card -->
              <button
                id="account-type-staff"
                type="button"
                class="relative flex flex-col gap-1 p-3 rounded-lg border text-left transition-all duration-150"
                :class="isStaff
                  ? 'border-slate-800 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
                @click="accountType = 'staff'"
              >
                <span class="flex items-center gap-1.5">
                  <span
                    class="inline-flex w-3 h-3 rounded-full border-2 items-center justify-center shrink-0"
                    :class="isStaff ? 'border-white' : 'border-slate-300'"
                  >
                    <span v-if="isStaff" class="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                  <span class="text-xs font-semibold leading-none" :class="isStaff ? 'text-white' : 'text-slate-700'">
                    Staff / Karyawan
                  </span>
                </span>
                <span class="text-2xs leading-tight pl-[18px]" :class="isStaff ? 'text-slate-300' : 'text-slate-400'">
                  Bergabung ke organisasi
                </span>
              </button>
            </div>
          </div>

          <!-- Full Name -->
          <BaseInput
            v-model="form.fullName"
            label="Nama Lengkap"
            type="text"
            placeholder="John Doe"
            :error="errors.fullName"
            required
          />

          <!-- Owner: Organization Name -->
          <BaseInput
            v-if="isOwner"
            v-model="form.organizationName"
            label="Nama Organisasi / Perusahaan"
            type="text"
            placeholder="PT Maju Bersama"
            :error="errors.organizationName"
            required
          />

          <!-- Staff: Invite Code -->
          <BaseInput
            v-if="isStaff"
            v-model="form.inviteCode"
            label="Invite Code"
            type="text"
            placeholder="A7F92K1B"
            :error="errors.inviteCode"
            hint="Minta invite code kepada pemilik organisasi"
            required
          />
        </template>

        <!-- Email -->
        <BaseInput
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="nama@perusahaan.com"
          :error="errors.email"
          required
        />

        <!-- Password -->
        <BaseInput
          v-model="form.password"
          label="Password"
          type="password"
          placeholder="••••••••"
          :error="errors.password"
          required
        />

        <BaseButton
          id="btn-submit"
          type="submit"
          variant="primary"
          size="md"
          :loading="loading"
          full
        >
          {{ mode === 'login' ? 'Masuk' : (isOwner ? 'Buat Akun' : 'Daftar & Bergabung') }}
        </BaseButton>
      </form>
    </div>

    <p class="text-center text-xs text-slate-400 mt-4">
      © {{ new Date().getFullYear() }} Inventory UMKM. Semua hak dilindungi.
    </p>
  </div>
</template>
