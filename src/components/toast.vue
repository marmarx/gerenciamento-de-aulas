<script setup>
import { useToastStore } from '@/stores/toastStore'
const toastStore = useToastStore()
</script>

<template>
  <transition name="toast-fade">
    <div v-if="toastStore.visible" class="toast-container">{{ toastStore.text }}</div>
  </transition>
</template>

<style scoped>
.toast-container {
  position: fixed; bottom: 24px; left: 50%; z-index: 999;
  font-size: .9em; color: white; line-height: 1.3em; text-align: center;
  padding: 16px 22px; border-radius: 25px;
  background: rgba(40, 40, 40, 0.9); transform: translateX(-50%);
}

.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity .3s }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0 }
</style>
