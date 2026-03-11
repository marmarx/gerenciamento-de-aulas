import { defineStore } from "pinia"
import { ref } from "vue"

export const useClockStore = defineStore("clock", () => {
  const now = ref(Date.now())
  setInterval(() => { now.value = Date.now() }, 500) // ticks every 1 second -> miliseconds

  return { now }
})