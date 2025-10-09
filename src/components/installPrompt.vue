<script setup>
import { onMounted } from "vue"
import { deferredPrompt, isInstalled, installButtonVisible, isIOS, installApp, hideInstallButton, updatedVisibility } from "@/stores/installPWA.js"

onMounted(() => { 
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault() // Prevents the mini-infobar from appearing on mobile
    deferredPrompt.value = e
    installButtonVisible.value = true
  })

  window.addEventListener("appinstalled", () => {
    //console.log("PWA installed")
    installButtonVisible.value = false
    isInstalled.value = true
  })
})

</script>

<template>
  <div v-if="installButtonVisible" class="installPrompt">
    <div class="installWrapper">
      <div class="pwaicon info"></div>
      <p>Instale este App para usar offline</p>
    </div>
    <div class="installWrapper">
      <div class="pwabtn" @click="installApp">
        <div class="pwaicon install"></div>
        <span v-if="isIOS">INSTRUÇÕES</span>
        <span v-else>INSTALAR</span>
      </div>
      <div class="pwabtn" @click="hideInstallButton">DISPENSAR</div>
    </div>
  </div>
</template>

<style scoped>
.installPrompt, .installWrapper, .pwabtn{display:flex; flex-direction: row; align-items: center;}
.installPrompt, .installWrapper{gap: 10px}
.installPrompt{
  position: fixed; top: 15px; left: 50%; transform: translateX(-50%);
  padding: 6px 16px; border-radius: 4px;
  background: aliceblue;
  z-index: 1000;
}
.installPrompt *{color:#014361}
.pwabtn{
  gap: 5px; padding: 5px 10px;
  color: currentColor;
  cursor: pointer
}
.pwaicon{
  width: 22px; height: 22px;
  background-size: cover; background-position: center; background-repeat: no-repeat;
}
.pwaicon.install {background-image:url('@/svg/PWAinstall.svg')}
.pwaicon.info {background-image:url('@/svg/PWAinfo.svg')}
@media screen and (max-width: 992px) {
  .installPrompt{top: auto; bottom: 15px; flex-direction: column; gap: 5px}
}
</style>