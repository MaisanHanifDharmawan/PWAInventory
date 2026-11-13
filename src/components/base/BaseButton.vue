<script setup>
const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | danger | ghost | outline
  size: { type: String, default: 'sm' }, // xs | sm | md
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  full: { type: Boolean, default: false }
})

const variantClasses = {
  primary: 'bg-navy-900 text-white hover:bg-navy-950 border border-navy-900',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent',
  outline: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
}

const sizeClasses = {
  xs: 'h-6 px-2.5 text-xs gap-1',
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-8 px-4 text-sm gap-2'
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center font-medium rounded transition-colors duration-150 select-none',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses[variant],
      sizeClasses[size],
      full ? 'w-full' : ''
    ]"
  >
    <svg v-if="loading" class="animate-spin w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>
