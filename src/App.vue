<script setup>
import { RouterView } from 'vue-router'
import Header from '@/components/header.vue'
import fab from '@/components/fab.vue'

import { updatedVisibility } from '@/stores/installPWA'
import installPrompt from '@/components/installPrompt.vue'

import { useAgendaStore } from '@/stores/agendaStore'
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
const transitionName = ref('slide-left')

let touchStart = [0, 0]
const SWIPE_THRESHOLD = 70

const handleTouchStart = (event) => touchStart = [event.touches[0].clientX, event.touches[0].clientY]
const handleTouchEnd = (event) => {
  if (!homeViews.some(v => route.path.includes(v))) return //break if current view isn't one of the home views

  const h_diff = touchStart[0] - event.changedTouches[0].clientX
  const v_diff = touchStart[1] - event.changedTouches[0].clientY

  if (Math.abs(v_diff) > Math.abs(h_diff)) return //ignore if vertical swipe

  if (h_diff > SWIPE_THRESHOLD) {
    currentIndex.value++
    transitionName.value = 'slide-left'
  }
  else if (h_diff < -SWIPE_THRESHOLD) {
    currentIndex.value--
    transitionName.value = 'slide-right'
  }

  currentIndex.value = (currentIndex.value + homeViews.length) % homeViews.length  //infinite wrap-around
}

let isNavigating = false
watch(currentIndex, async (idx) => {
  if (isNavigating) return //safe guard - if the user swipes repeatedly before navigation finishes
  isNavigating = true
  await router.push(homeViews[idx])
  isNavigating = false
})

watch(() => route.path, (newPath) => {
  if (isNavigating) return
  const idx = homeViews.findIndex(v => newPath.includes(v))
  if (idx !== -1) {
    transitionName.value = currentIndex.value > idx ? 'slide-right' : 'slide-left'
    currentIndex.value = idx
  }
}, { immediate: true })

onMounted(() => {
  updatedVisibility()
  document.addEventListener("visibilitychange", updatedVisibility)
  window.addEventListener('touchstart', handleTouchStart, { passive: true })
  window.addEventListener('touchend',   handleTouchEnd,   { passive: true })
  router.push('/agenda')
})

onUnmounted(() => {
  window.removeEventListener('touchstart', handleTouchStart)
  window.removeEventListener('touchend',   handleTouchEnd)
  document.removeEventListener("visibilitychange", updatedVisibility)
})
</script>

<template>
  <Header />

  <div class="view-container">
    <router-view v-slot="{ Component }">
      <transition :name="transitionName">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
 
  <fab />
  <installPrompt />
</template>

<style>
.section{
  display: flex; flex-direction: column; align-items: center; gap:25px;
  padding: 50px 30px 60px; border-radius: 6px; margin: 10px; width: calc(100% - 80px);
  background: var(--white);
}

.view-container {position:relative; flex:1; overflow:hidden}

/* .slide-left-enter-active, .slide-left-leave-active,
.slide-right-enter-active, .slide-right-leave-active {transition: all 1s ease} */

.slide-left-enter-active, .slide-right-enter-active {position:relative; z-index:2}
.slide-left-leave-active, .slide-right-leave-active {position:absolute; z-index:1}

.slide-left-enter-from, .slide-right-leave-to {transform:translateX(100%)}
.slide-left-leave-to,   .slide-right-enter-from {transform:translateX(-100%)}

.slide-left-enter-to,  .slide-left-leave-from,
.slide-right-enter-to, .slide-right-leave-from {transform:translateX(0)}

.slide-left-enter-from, .slide-right-enter-from,
.slide-left-leave-to,   .slide-right-leave-to{opacity:0}
</style>