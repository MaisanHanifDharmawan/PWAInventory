import { ref } from 'vue'

/**
 * Confirm dialog composable
 * Usage: const { confirm, isOpen, message, resolve } = useConfirm()
 */
export function useConfirm() {
  const isOpen = ref(false)
  const message = ref('')
  const title = ref('')
  const confirmLabel = ref('Konfirmasi')
  const cancelLabel = ref('Batal')
  const variant = ref('danger')
  let resolveCallback = null

  function confirm(options = {}) {
    title.value = options.title || 'Konfirmasi'
    message.value = options.message || 'Apakah Anda yakin?'
    confirmLabel.value = options.confirmLabel || 'Konfirmasi'
    cancelLabel.value = options.cancelLabel || 'Batal'
    variant.value = options.variant || 'danger'
    isOpen.value = true

    return new Promise((resolve) => {
      resolveCallback = resolve
    })
  }

  function onConfirm() {
    isOpen.value = false
    if (resolveCallback) resolveCallback(true)
  }

  function onCancel() {
    isOpen.value = false
    if (resolveCallback) resolveCallback(false)
  }

  return {
    isOpen,
    message,
    title,
    confirmLabel,
    cancelLabel,
    variant,
    confirm,
    onConfirm,
    onCancel
  }
}
