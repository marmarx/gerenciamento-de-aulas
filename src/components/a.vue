<script setup>
import { ref } from 'vue'
import { importStorage, exportStorage } from '@/stores/importExportStore.js'

const data = ref({ user: 'Marco', settings: { darkMode: true } })

const handleImport = async (json) => data.value = json
const handleExport = async () => await exportStorage(data.value)
</script>

<template>
  <div>
    <input
      v-if="!window.Capacitor?.isNativePlatform?.()"
      type="file"
      accept="application/json"
      @change="(e) => importStorage(e, handleImport)"
    />

    <button @click="handleExport">Export Backup</button>
  </div>
</template>