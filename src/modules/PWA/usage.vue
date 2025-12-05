<script setup>
import installPrompt from '@/modules/PWA/installPrompt.vue'

import { usePWA, isWeb } from '@/modules/PWA/installPWA'
usePWA()
</script>

<template>
  <template v-if="isWeb">
    <installPrompt />
  </template>
</template>