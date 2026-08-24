import { defineStore } from "pinia"
import { ref } from "vue"
import { temporal } from "@/composables/helpers/helpers.temporal"

export const useClockStore = defineStore("clock", () => {
  const now = ref(temporal.now())
  setInterval(() => { now.value = temporal.now() }, 500) // ticks every 500 miliseconds (0.5 second)

  return { now }
})