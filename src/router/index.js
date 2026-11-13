import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'
import { useToast } from '@/composables/useToast'

const routes = [
  // Auth
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { layout: 'auth', public: true }
  },

  // App pages (protected)
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
    meta: { title: 'Dashboard' }
  },
  {
    path: '/raw-materials',
    name: 'raw-materials',
    component: () => import('@/pages/RawMaterialsPage.vue'),
    meta: { title: 'Bahan Baku' }
  },
  {
    path: '/finished-products',
    name: 'finished-products',
    component: () => import('@/pages/FinishedProductsPage.vue'),
    meta: { title: 'Produk Jadi' }
  },
  {
    path: '/recipes',
    name: 'recipes',
    component: () => import('@/pages/RecipesPage.vue'),
    meta: { title: 'Resep / BOM' }
  },
  {
    path: '/stock-in',
    name: 'stock-in',
    component: () => import('@/pages/StockInPage.vue'),
    meta: { title: 'Stock Masuk' }
  },
  {
    path: '/stock-out',
    name: 'stock-out',
    component: () => import('@/pages/StockOutPage.vue'),
    meta: { title: 'Stock Keluar' }
  },
  {
    path: '/production',
    name: 'production',
    component: () => import('@/pages/ProductionPage.vue'),
    meta: { title: 'Produksi' }
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/pages/ReportsPage.vue'),
    meta: { title: 'Laporan' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { title: 'Pengaturan' }
  },
  {
    path: '/settings/organization',
    name: 'settings-organization',
    component: () => import('@/pages/OrganizationSettingsView.vue'),
    meta: { title: 'Pengaturan Organisasi' }
  },

  // Offline
  {
    path: '/offline',
    name: 'offline',
    component: () => import('@/pages/OfflinePage.vue'),
    meta: { public: true, layout: 'auth' }
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { public: true, layout: 'auth' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// Auth guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Initialize auth state on first navigation
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  if (to.meta.public) {
    // If already logged in, redirect to dashboard from login page
    if (to.name === 'login' && authStore.isAuthenticated) {
      return next({ name: 'dashboard' })
    }
    return next()
  }

  // Protected routes
  if (!authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  const profileStore = useProfileStore()
  
  if (!profileStore.profile) {
    const toast = useToast()
    toast.error('Profile tidak ditemukan')
    return next({ name: 'login' })
  }

  const allowedWithoutOrg = ['login', 'settings-organization']
  if (!profileStore.organizationId && !allowedWithoutOrg.includes(to.name)) {
    return next({ name: 'settings-organization' })
  }

  // Update document title
  if (to.meta.title) {
    document.title = `${to.meta.title} — Inventory UMKM`
  }

  next()
})

export default router
