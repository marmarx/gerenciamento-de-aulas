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
  //console.log(`User response: ${outcome}`)
  deferredPrompt.value = null
  installButtonVisible.value = false
}

export { deferredPrompt, isInstalled, installButtonVisible, isIOS, installApp, hideInstallButton }