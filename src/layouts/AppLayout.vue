<script setup>
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar from '@/components/AppTopbar.vue'
import MobileBottomNav from '@/components/MobileBottomNav.vue'
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <AppSidebar />
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <AppTopbar />
      <main class="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div class="p-4 max-w-screen-xl mx-auto">
          <RouterView />
        </div>
      </main>
    </div>
    <MobileBottomNav />
  </div>
</template>
