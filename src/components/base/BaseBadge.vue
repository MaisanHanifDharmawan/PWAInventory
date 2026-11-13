<script setup>
const props = defineProps({
  variant: { type: String, default: 'default' }, // default | success | warning | danger | info | navy
  size: { type: String, default: 'sm' } // xs | sm
})

const variantClasses = {
  default: 'bg-slate-100 text-slate-600',
  slate: 'bg-slate-200 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  primary: 'bg-blue-900 text-white',
  navy: 'bg-slate-700 text-white'
}

const sizeClasses = {
  xs: 'px-1.5 py-0.5 text-2xs',
  sm: 'px-2 py-0.5 text-xs'
}
</script>

<template>
  <span :class="['inline-flex items-center font-medium rounded-full', variantClasses[variant], sizeClasses[size]]">
    <slot />
  </span>
</template>
