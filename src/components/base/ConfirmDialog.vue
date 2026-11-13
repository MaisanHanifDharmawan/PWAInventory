<script setup>
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Konfirmasi' },
  message: { type: String, default: 'Apakah Anda yakin?' },
  confirmLabel: { type: String, default: 'Ya, Lanjutkan' },
  cancelLabel: { type: String, default: 'Batal' },
  variant: { type: String, default: 'danger' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

function onCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

function onConfirm() {
  emit('confirm')
}
</script>

<template>
  <BaseModal :model-value="modelValue" :title="title" size="sm" persistent @update:model-value="onCancel">
    <p class="text-xs text-slate-600">{{ message }}</p>
    <template #footer>
      <BaseButton variant="ghost" size="sm" :disabled="loading" @click="onCancel">
        {{ cancelLabel }}
      </BaseButton>
      <BaseButton
        :variant="variant"
        size="sm"
        :loading="loading"
        @click="onConfirm"
      >
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
