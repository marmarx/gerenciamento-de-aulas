import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  // create toast
  const createToast = (title, text, confirm = false, duration = 5000) => {

    const id = crypto.randomUUID()
    const toast = { id, confirm, title, text, duration, remaining: duration, paused: false, resolver: null }

    toasts.value.push(toast)
    startTicker()
    
    if(confirm) return new Promise(resolve => toast.resolver = resolve)
  }

  // timer control
  let ticker = null

  const startTicker = () => {
    if (ticker) return
    let last = Date.now()

    ticker = setInterval(() => {
      const now = Date.now()
      const delta = now - last
      last = now

      toasts.value.forEach(toast => {
        if (toast.paused) return

        toast.remaining -= delta

        if (toast.remaining <= 0) {
          if (toast.confirm) toast.resolver?.(false)
          remove(toast.id)
        }
      })

      if (toasts.value.length === 0) {
        clearInterval(ticker)
        ticker = null
      }
    }, 50)  // 20 fps -> frames = 1000ms / fps 
  }

  const pauseTimer = (id) => {
    const toast = toasts.value.find(t => t.id === id)
    if (!toast) return
    toast.paused = true
  }

  const resumeTimer = (id) => {
    const toast = toasts.value.find(t => t.id === id)
    if (!toast) return
    toast.paused = false
  }

  // toast actions
  const confirm = (id) => {
    const toast = toasts.value.find(t => t.id === id)
    if (!toast) return

    toast.resolver?.(true)
    remove(id)
  }

  const cancel = (id) => {
    const toast = toasts.value.find(t => t.id === id)
    if (!toast) return

    toast.resolver?.(false)
    remove(id)
  }

  // remove toast
  const remove = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) toasts.value.splice(index, 1)
  }
  
  return { toasts, createToast, confirm, cancel, pauseTimer, resumeTimer, remove }
})
