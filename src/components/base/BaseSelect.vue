<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  options: { type: Array, default: () => [] }, // [{ value, label }] or plain strings
  placeholder: { type: String, default: 'Pilih...' },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  id: { type: String, default: () => `select-${Math.random().toString(36).slice(2, 7)}` }
})

const emit = defineEmits(['update:modelValue'])

const selectClasses = computed(() => [
  'w-full h-7 px-2.5 text-xs rounded border outline-none transition-colors duration-150 bg-white',
  props.error
    ? 'border-red-400 focus:border-red-500'
    : 'border-slate-300 focus:border-navy-900 hover:border-slate-400'
])

function normalizeOption(opt) {
  if (typeof opt === 'string') return { value: opt, label: opt }
  return opt
}
</script>

<template>
  <div class="flex flex-col gap-0.5">
    <label v-if="label" :for="id" class="form-label">
      {{ label }}<span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue"
      :disabled="disabled"
      :class="selectClasses"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option
        v-for="opt in options.map(normalizeOption)"
        :key="opt.value"
        :value="opt.value"
      >{{ opt.label }}</option>
    </select>
    <p v-if="error" class="text-xs text-red-500 mt-0.5">{{ error }}</p>
  </div>
</template>
