<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import { LogOut } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

async function handleLogout() {
  try {
    await auth.logout()
    toast.success('Berhasil logout')
    router.push('/login')
  } catch {
    toast.error('Gagal logout')
  }
}
</script>

<template>
  <header class="h-11 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30">
    <!-- Page title -->
    <div class="flex items-center gap-2">
      <h1 class="text-sm font-semibold text-slate-800">
        {{ route.meta.title || 'Dashboard' }}
      </h1>
    </div>

    <!-- Right actions -->
    <div class="flex items-center gap-2">
      <span class="hidden sm:block text-xs text-slate-400">{{ auth.userName }}</span>
      <button
        class="h-7 w-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 hover:text-red-500 transition-colors"
        title="Logout"
        @click="handleLogout"
      >
        <LogOut class="w-3.5 h-3.5" />
      </button>
    </div>
  </header>
</template>
