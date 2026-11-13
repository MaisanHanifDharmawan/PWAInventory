<script setup>
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const route = useRoute()
const isAuth = computed(() => route.meta.layout === 'auth')
</script>

<template>
  <AuthLayout v-if="isAuth" />
  <AppLayout v-else />
</template>
