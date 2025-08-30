import { useDataStore } from "@/stores/datastore"
import { computed, watchEffect } from 'vue'

const dataStore = useDataStore()

const color1 = computed(() => dataStore.data.config.color1)
const color2 = computed(() => dataStore.data.config.color2)

const hexToRgba = (hex) => {
  let r = parseInt(hex.slice(1, 3), 16)
  let g = parseInt(hex.slice(3, 5), 16)
  let b = parseInt(hex.slice(5, 7), 16)
  let a = parseInt(hex.slice(7, 9), 16) / 255 || 1
  return { r, g, b, a }
}

const mixColors = (color1Hex, color2Hex, a) => {
  const rgb1 = hexToRgba(color1Hex)
  const rgb2 = hexToRgba(color2Hex)

  const mixedR = Math.round((rgb1.r + rgb2.r) / 2)
  const mixedG = Math.round((rgb1.g + rgb2.g) / 2)
  const mixedB = Math.round((rgb1.b + rgb2.b) / 2)
  const mixedA = Math.round((rgb1.a + rgb2.a) / 2)

  return `rgba(${mixedR}, ${mixedG}, ${mixedB}, ${a})`
}

const nav_main  = computed(() => mixColors(color1.value, color2.value, 1))
const nav_back  = computed(() => mixColors(color1.value, color2.value, 0.7))
const nav_hover = computed(() => mixColors(color1.value, color2.value, 0.85))
const nav_focus = computed(() => mixColors(color1.value, color2.value, 0.95))

watchEffect(() => {
  document.documentElement.style.setProperty('--header-left', color1.value)
  document.documentElement.style.setProperty('--header-right', color2.value)
  document.documentElement.style.setProperty('--nav-main', nav_main.value)
  document.documentElement.style.setProperty('--nav-back', nav_back.value)
  document.documentElement.style.setProperty('--nav-hover', nav_hover.value)
  document.documentElement.style.setProperty('--nav-focus', nav_focus.value)
})

export { color1, color2, nav_main, nav_back, nav_hover, nav_focus }
