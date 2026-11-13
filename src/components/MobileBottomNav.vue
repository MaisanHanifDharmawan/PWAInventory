<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { 
  LayoutDashboard, Package, ArrowDownToLine, BarChart3, Settings,
  Box, BookOpen, ArrowUpFromLine, Factory
} from 'lucide-vue-next'

const route = useRoute()
const activeMenu = ref(null) // 'bahan', 'stock', or null

const navItems = [
  { id: 'dashboard', name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { id: 'bahan', name: 'Bahan', isGroup: true, icon: Package,
    children: [
      { name: 'Bahan Baku', to: '/raw-materials', icon: Package },
      { name: 'Produk Jadi', to: '/finished-products', icon: Box },
      { name: 'Resep / BOM', to: '/recipes', icon: BookOpen },
      { name: 'Produksi', to: '/production', icon: Factory }
    ]
  },
  { id: 'stock', name: 'Stock', isGroup: true, icon: ArrowDownToLine,
    children: [
      { name: 'Stock Masuk', to: '/stock-in', icon: ArrowDownToLine },
      { name: 'Stock Keluar', to: '/stock-out', icon: ArrowUpFromLine }
    ]
  },
  { id: 'laporan', name: 'Laporan', to: '/reports', icon: BarChart3 },
  { id: 'pengaturan', name: 'Pengaturan', isGroup: true, icon: Settings,
    children: [
      { name: 'Profil & Keamanan', to: '/settings', icon: Settings },
      { name: 'Organisasi', to: '/settings/organization', icon: Box }
    ]
  }
]

function isActive(item) {
  if (item.isGroup) {
    return item.children.some(child => route.path === child.to || route.path.startsWith(child.to + '/'))
  }
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

function handleNavClick(item) {
  if (item.isGroup) {
    activeMenu.value = activeMenu.value === item.id ? null : item.id
  } else {
    activeMenu.value = null
  }
}

// Close menu when clicking outside
function handleClickOutside(e) {
  const nav = document.getElementById('mobile-bottom-nav')
  if (nav && !nav.contains(e.target)) {
    activeMenu.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <nav id="mobile-bottom-nav" class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-inset-bottom">
    
    <!-- Sub-menu Dropups -->
    <Transition name="slide-up">
      <div v-if="activeMenu" class="absolute bottom-full left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-t-xl px-4 py-3">
        <div class="grid grid-cols-2 gap-2">
          <template v-for="item in navItems" :key="item.id">
            <template v-if="item.isGroup && activeMenu === item.id">
              <RouterLink
                v-for="child in item.children"
                :key="child.to"
                :to="child.to"
                class="flex items-center gap-2 p-2.5 rounded-lg transition-colors border border-slate-100"
                :class="route.path === child.to ? 'bg-navy-50 border-navy-100 text-navy-900' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'"
                @click="activeMenu = null"
              >
                <component :is="child.icon" class="w-4 h-4 shrink-0" />
                <span class="text-xs font-medium">{{ child.name }}</span>
              </RouterLink>
            </template>
          </template>
        </div>
      </div>
    </Transition>

    <!-- Main Bottom Nav -->
    <div class="flex items-center justify-around h-14 relative z-10 bg-white">
      <template v-for="item in navItems" :key="item.id">
        <!-- Single Item -->
        <RouterLink
          v-if="!item.isGroup"
          :to="item.to"
          :class="[
            'flex flex-col items-center gap-0.5 px-2 py-1 rounded transition-colors w-16',
            isActive(item) ? 'text-navy-900' : 'text-slate-400'
          ]"
          @click="handleNavClick(item)"
        >
          <component :is="item.icon" class="w-4 h-4" />
          <span class="text-2xs font-medium">{{ item.name }}</span>
        </RouterLink>

        <!-- Group Item -->
        <button
          v-else
          :class="[
            'flex flex-col items-center gap-0.5 px-2 py-1 rounded transition-colors w-16',
            isActive(item) || activeMenu === item.id ? 'text-navy-900' : 'text-slate-400'
          ]"
          @click="handleNavClick(item)"
        >
          <component :is="item.icon" class="w-4 h-4" />
          <span class="text-2xs font-medium">{{ item.name }}</span>
        </button>
      </template>
    </div>
  </nav>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
