<script setup>
import { RouterView } from 'vue-router'
import Header from '@/components/header.vue'
import fab from '@/components/fab.vue'
</script>

<template>
  <Header />
  <RouterView />
  <fab />
</template>

<style>
.section{
  display: flex; flex-direction: column; align-items: center; gap:25px;
  padding: 30px; border-radius: 6px; margin: 10px;
  background: var(--white); 
}
</style>