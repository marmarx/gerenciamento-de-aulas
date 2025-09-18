<script setup>
import { RouterView } from 'vue-router'
import Header from '@/components/header.vue'
import fab from '@/components/fab.vue'

import { useAgendaStore } from './stores/agendaStore'
const agendaStore = useAgendaStore()
agendaStore.initAutoFinishWatcher()
agendaStore.setupEventWatcher()

import { useRoute, useRouter } from 'vue-router';
const route = useRoute()
const router = useRouter()

//Swipe actions
import { ref, watch, onMounted, onUnmounted } from 'vue'
const homeViews = ['/agenda','/alunos','/panorama']
const currentIndex = ref(0) //agenda is the starting view

let touchStartX = 0
let touchEndX = 0

const handleTouchStart = (event) => touchStartX = event.touches[0].clientX
const handleTouchEnd = (event) => {
  if (!homeViews.some(v => route.path.includes(v))) return //break if current view isn't one of the home views

  touchEndX = event.changedTouches[0].clientX
  const diff = touchStartX - touchEndX

  if (diff > 50) currentIndex.value++
  else if (diff < -50) currentIndex.value--

  currentIndex.value = (currentIndex.value + homeViews.length) % homeViews.length  //infinite wrap-around
}

let isNavigating = false
watch(currentIndex, async (idx) => {
  if (isNavigating) return
  isNavigating = true
  await router.push(homeViews[idx])
  isNavigating = false
})

watch(() => route.path, (newPath) => {
  const idx = homeViews.findIndex(v => newPath.includes(v))
  if (idx !== -1) currentIndex.value = idx
}, { immediate: true })

onMounted(() => {
  window.addEventListener('touchstart', handleTouchStart, { passive: true })
  window.addEventListener('touchend',   handleTouchEnd,   { passive: true })
  router.push('/agenda')
})

onUnmounted(() => {
  window.removeEventListener('touchstart', handleTouchStart)
  window.removeEventListener('touchend',   handleTouchEnd)
})
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