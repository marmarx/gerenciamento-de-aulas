import { defineStore } from "pinia"
import { ref } from "vue"

export const useClockStore = defineStore("clock", () => {
  const now = ref(Date.now())
  setInterval(() => { now.value = Date.now() }, 500) // ticks every 500 miliseconds (0.5 second)

  return { now }
})