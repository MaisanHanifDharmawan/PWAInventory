<script setup>
const props = defineProps({
  padding: { type: String, default: 'p-4' },
  noBorder: { type: Boolean, default: false }
})
</script>

<template>
  <div :class="['bg-white rounded-lg shadow-card', !noBorder ? 'border border-slate-200' : '', padding]">
    <slot />
  </div>
</template>
