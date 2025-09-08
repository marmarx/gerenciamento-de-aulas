<script setup>
import { RouterView } from 'vue-router'
import Header from '@/components/header.vue'
import fab from '@/components/fab.vue'

import { useAgendaStore } from './stores/agendaStore'
const agendaStore = useAgendaStore()
agendaStore.initAutoFinishWatcher()
agendaStore.setupEventWatcher()
</script>

<template>
  <Header />
  <RouterView />
  <fab />
</template>

<style>
.section{
  display: flex; flex-direction: column; align-items: center; gap:25px;
  padding: 50px 30px 60px; border-radius: 6px; margin: 10px;
  background: var(--white); 
}
</style>