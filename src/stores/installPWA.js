import { ref } from "vue"
import { Capacitor } from '@capacitor/core'
import { showToast } from '@/stores/showToast'

const isWeb = Capacitor.getPlatform() === 'web'
const deferredPrompt = ref(null)
const installButtonVisible = ref(false)
const isInstalled = ref(false)
const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())

const hideInstallButton = () => installButtonVisible.value = false
const installApp = async () => {
  if (isIOS) {
    showToast('Para instalar, toque o ícone de "Compartilhamento" e depois "Adicionar à Tela de Início"')
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

export { deferredPrompt, isInstalled, installButtonVisible, isIOS, isWeb, installApp, hideInstallButton, updatedVisibility }