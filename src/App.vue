<script setup>
import { RouterView } from 'vue-router'
import Header from '@/components/header.vue'
import fab from '@/components/fab.vue'
import toast from '@/components/toast.vue'

import { updatedVisibility, isWeb } from '@/composables/installPWA'
import installPrompt from '@/components/installPrompt.vue'

import { useAgendaStore } from '@/stores/agendaStore'
const agendaStore = useAgendaStore()
agendaStore.initAutoFinishWatcher()
agendaStore.setupEventWatcher()

import { useNotificationStore } from '@/stores/notificationStore'
const notificationStore = useNotificationStore()
notificationStore.setupNotificationWatcher()

// setTimeout(async () => {
//   const scheduled = await notificationStore.listPendingNotifications()
//   console.log(scheduled.notifications)
// }, 6000)

import { useRouter } from 'vue-router';
const router = useRouter()

import { setBackGesture, setSwipeGesture, transitionName } from '@/composables/gestureControl'
import { useTheme } from '@/composables/color'

import { onMounted, onUnmounted } from 'vue'

onMounted(async () => {
  useTheme()
  setBackGesture()
  setSwipeGesture()
  updatedVisibility()
  document.addEventListener("visibilitychange", updatedVisibility)
  router.push('/agenda')
})

onUnmounted(() => document.removeEventListener("visibilitychange", updatedVisibility))  


// update existing data sets - maybe removed in future updates
import { useEventDefaults } from '@/composables/eventDefaults'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

const studentsUpdate = (student) => {
  student.cost           = student.cost ?? dataStore.data.config.cost
  student.duration       = student.duration ?? dataStore.data.config.duration
  student.variableCost   = student.variableCost ?? dataStore.data.config.variableCost

  student.chargeCancelation      = student.chargeCancelation ?? dataStore.data.config.chargeCancelation
  student.freeCancelationBefore  = student.freeCancelationBefore ?? dataStore.data.config.freeCancelationBefore
  student.cancelationFee         = student.cancelationFee ?? dataStore.data.config.cancelationFee

  student.minutesBefore  = student.minutesBefore ?? dataStore.data.config.minutesBefore
}

onMounted(async () => {
  dataStore.data.students.forEach(s => studentsUpdate(s))
  dataStore.data.events.forEach(ev => {
    const { initialUpdate } = useEventDefaults(ev)
    initialUpdate()
  })
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
  <template v-if="isWeb">
    <installPrompt />
  </template>
  <toast />
</template>

<style>
.section{
  display: flex; flex-direction: column; align-items: center; gap:25px;
  padding: 50px 30px 6em; border-radius: 6px; margin: 10px; width: calc(100% - 80px);
  background: var(--white);
}

@media screen and (max-width: 992px) {  .section{margin: 0; width: calc(100% - 60px)} }

.view-container {position:relative; flex:1; overflow:hidden}

.slide-left-enter-active, .slide-right-enter-active {position:relative; z-index:2}
.slide-left-leave-active, .slide-right-leave-active {position:absolute; z-index:1}

.slide-left-enter-from, .slide-right-leave-to {transform:translateX(100%)}
.slide-left-leave-to,   .slide-right-enter-from {transform:translateX(-100%)}

.slide-left-enter-to,  .slide-left-leave-from,
.slide-right-enter-to, .slide-right-leave-from {transform:translateX(0)}

.slide-left-enter-from, .slide-right-enter-from,
.slide-left-leave-to,   .slide-right-leave-to{opacity:0}
</style>