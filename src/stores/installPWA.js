import { ref } from "vue"

const deferredPrompt = ref(null)
const installButtonVisible = ref(false)
const isInstalled = ref(false)
const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())

const hideInstallButton = () => installButtonVisible.value = false
const installApp = async () => {
  if (isIOS) {
    alert('Para instalar, toque o ícone de "Compartilhamento" e depois "Adicionar à Tela de Início"')
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
  const modes = ['fullscreen', 'standalone', 'minimal-ui']
  const matchedDisplay = 
    modes.some(mode => window.matchMedia(`(display-mode: ${mode})`).matches) ||  // android and windows
    window.navigator.standalone // for IOs
  const wasInstalled = localStorage.getItem("GestãoPWAinstalled") === "true"

  isInstalled.value = matchedDisplay || wasInstalled
  installButtonVisible.value = !(matchedDisplay || wasInstalled)
}

export { deferredPrompt, isInstalled, installButtonVisible, isIOS, installApp, hideInstallButton, updatedVisibility }