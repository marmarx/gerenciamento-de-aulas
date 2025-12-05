import { ref, onMounted, onUnmounted } from "vue"
import { Capacitor } from '@capacitor/core'
import { toastShow } from '@/modules/toast/toastShow'

const isWeb = Capacitor.getPlatform() === 'web'
const deferredPrompt = ref(null)
const installButtonVisible = ref(false)
const isInstalled = ref(false)
const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())

const hideInstallButton = () => installButtonVisible.value = false
const installApp = async () => {
  if (isIOS) {
    toastShow('Instalação em iOS','Toque o ícone de "Compartilhamento" e depois "Adicionar à Tela de Início"')
    return
  }
  if (!deferredPrompt.value) return

  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice

  if (outcome === "accepted") {
    localStorage.setItem("GestãoPWAinstalled", "true")
    isInstalled.value = true
  }

  deferredPrompt.value = null
  installButtonVisible.value = false
}

const updatedVisibility = () => {
  if(!isWeb) {
    isInstalled.value = false
    installButtonVisible.value = false
    return
  }
  const modes = ['fullscreen', 'standalone', 'minimal-ui']
  const matchedDisplay = 
    modes.some(mode => window.matchMedia(`(display-mode: ${mode})`).matches) ||  // android and windows
    window.navigator.standalone // for IOs
  const wasInstalled = localStorage.getItem("GestãoPWAinstalled") === "true"

  isInstalled.value = matchedDisplay || wasInstalled
  installButtonVisible.value = !(matchedDisplay || wasInstalled)
  //console.log('[installPWA]:', {wasInstalled: wasInstalled, isInstalled: isInstalled.value, installButtonVisible: installButtonVisible.value})
}

const setupPWA = () => {
  updatedVisibility()
  document.addEventListener("visibilitychange", updatedVisibility)
}
const cleanupPWA = () => document.removeEventListener("visibilitychange", updatedVisibility)

// public composable
const usePWA = () => {
  onMounted(() => setupPWA())
  onUnmounted(() => cleanupPWA())
}


export { usePWA, deferredPrompt, isInstalled, installButtonVisible, isIOS, isWeb, installApp, hideInstallButton }