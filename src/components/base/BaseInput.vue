<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  id: { type: String, default: () => `input-${Math.random().toString(36).slice(2, 7)}` }
})

const emit = defineEmits(['update:modelValue'])

const inputClasses = computed(() => [
  'w-full h-7 px-2.5 text-xs rounded border outline-none transition-colors duration-150',
  'placeholder:text-slate-400',
  props.error
    ? 'border-red-400 focus:border-red-500 bg-red-50'
    : 'border-slate-300 focus:border-navy-900 bg-white hover:border-slate-400'
])
</script>

<template>
  <div class="flex flex-col gap-0.5">
    <label v-if="label" :for="id" class="form-label">
      {{ label }}<span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="inputClasses"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="text-xs text-red-500 mt-0.5">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-slate-400 mt-0.5">{{ hint }}</p>
  </div>
</template>
