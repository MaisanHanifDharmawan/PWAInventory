<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'
import { storeToRefs } from 'pinia'
import {
  LayoutDashboard, Package, Box, BookOpen,
  ArrowDownToLine, ArrowUpFromLine, Factory,
  BarChart3, Settings, Building2, ChevronDown
} from 'lucide-vue-next'

const route = useRoute()
const auth = useAuthStore()
const profileStore = useProfileStore()
const { full_name, role } = storeToRefs(profileStore)

// Settings sub-menu open state
const settingsOpen = ref(false)

const mainNav = [
  { name: 'Dashboard',     to: '/dashboard',         icon: LayoutDashboard },
  { name: 'Bahan Baku',    to: '/raw-materials',      icon: Package },
  { name: 'Produk Jadi',   to: '/finished-products',  icon: Box },
  { name: 'Resep / BOM',   to: '/recipes',            icon: BookOpen },
  { name: 'Stock Masuk',   to: '/stock-in',           icon: ArrowDownToLine },
  { name: 'Stock Keluar',  to: '/stock-out',          icon: ArrowUpFromLine },
  { name: 'Produksi',      to: '/production',         icon: Factory },
  { name: 'Laporan',       to: '/reports',            icon: BarChart3 },
]

const settingsNav = [
  { name: 'Profil & Keamanan', to: '/settings',              icon: Settings },
  { name: 'Organisasi',         to: '/settings/organization', icon: Building2 },
]

function isActive(path, exact = false) {
  if (exact) return route.path === path
  return route.path === path || route.path.startsWith(path + '/')
}

function isSettingsActive() {
  return settingsNav.some(item => route.path === item.to || route.path.startsWith(item.to + '/'))
}

// Auto-open settings group if current route is under settings
import { onMounted, watch } from 'vue'
onMounted(() => {
  if (isSettingsActive()) settingsOpen.value = true
})
watch(() => route.path, () => {
  if (isSettingsActive()) settingsOpen.value = true
})
</script>

<template>
  <aside class="hidden md:flex flex-col w-52 shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0">
    <!-- Logo -->
    <div class="flex items-center gap-2 px-4 py-3.5 border-b border-slate-200">
      <div class="w-6 h-6 rounded bg-navy-900 flex items-center justify-center">
        <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div>
        <p class="text-xs font-bold text-slate-900 leading-none">Inventory</p>
        <p class="text-2xs text-slate-400 mt-0.5">UMKM App</p>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-2 px-2">
      <div class="space-y-0.5">
        <!-- Main nav items -->
        <RouterLink
          v-for="item in mainNav"
          :key="item.to"
          :to="item.to"
          :class="['sidebar-link', isActive(item.to) ? 'active' : '']"
        >
          <component :is="item.icon" class="w-3.5 h-3.5 shrink-0" />
          <span>{{ item.name }}</span>
        </RouterLink>

        <!-- Settings group -->
        <div class="pt-1">
          <!-- Settings group header -->
          <button
            class="sidebar-link w-full"
            :class="isSettingsActive() ? 'active' : ''"
            @click="settingsOpen = !settingsOpen"
          >
            <Settings class="w-3.5 h-3.5 shrink-0" />
            <span class="flex-1 text-left">Pengaturan</span>
            <ChevronDown
              class="w-3 h-3 text-slate-400 transition-transform duration-200"
              :class="settingsOpen ? 'rotate-180' : ''"
            />
          </button>

          <!-- Settings sub-items -->
          <div v-if="settingsOpen" class="ml-3 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
            <RouterLink
              v-for="item in settingsNav"
              :key="item.to"
              :to="item.to"
              :class="['sidebar-link', isActive(item.to, item.to === '/settings') ? 'active' : '']"
            >
              <component :is="item.icon" class="w-3.5 h-3.5 shrink-0" />
              <span>{{ item.name }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- User info -->
    <div class="px-3 py-3 border-t border-slate-200">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-2xs font-bold text-slate-600 shrink-0">
          {{ (full_name || auth.user?.email)?.charAt(0)?.toUpperCase() || '?' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-slate-800 truncate">{{ full_name || auth.user?.email }}</p>
          <p class="text-2xs text-slate-400 capitalize">{{ role || 'User' }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
