<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

</script>

<template>
  <div class="section">
    <h2>Panorama</h2>
    <p>Em breve...</p>
    <div class="flexContainer">
      <button @click="router.push('/aulas')">Todas as Aulas</button>
    </div>
  </div>
</template>