<script setup>
import Header from '@/components/header.vue'
import floatingMenu from '@/modules/floatingMenu/floatingMenu.vue'
import toast from '@/modules/toast/toast.vue'
import installPrompt from '@/modules/PWA/installPrompt.vue'

import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

import { useTheme } from '@/composables/color'
import { usePWA, isWeb } from '@/modules/PWA/installPWA'
import { useGestures, transitionName } from '@/modules/gesture/gestureControl'
import { useRouter } from 'vue-router'
import { useAgendaStore } from '@/stores/agendaStore'
import { useNotificationStore } from '@/modules/notifications/notificationStore'

useTheme()
usePWA()
useGestures()
useRouter().push('/agenda')
useAgendaStore()
useNotificationStore()

// update existing data sets - maybe removed in future updates
import { useEventDefaults } from '@/composables/eventDefaults'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

const studentUpdate = (student) => {
  student.cost           = student.cost ?? dataStore.data.config.cost
  student.duration       = student.duration ?? dataStore.data.config.duration
  student.variableCost   = student.variableCost ?? dataStore.data.config.variableCost

  student.chargeCancelation      = student.chargeCancelation ?? dataStore.data.config.chargeCancelation
  student.freeCancelationBefore  = student.freeCancelationBefore ?? dataStore.data.config.freeCancelationBefore
  student.cancelationFee         = student.cancelationFee ?? dataStore.data.config.cancelationFee

  student.minutesBefore  = student.minutesBefore ?? dataStore.data.config.minutesBefore
}

onMounted(async () => {
  dataStore.data.students.forEach(s => studentUpdate(s))
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
 
  <floatingMenu />

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