import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const visible = ref(false)
  const text = ref('')
  let timeout = null

  function show(message) {
    text.value = message
    visible.value = true

    // Reset timer if showing again quickly
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      visible.value = false
      timeout = null
    }, 2500)
  }

  return { visible, text, show }
})
