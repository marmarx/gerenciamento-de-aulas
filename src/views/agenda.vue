<script setup>
import cardEvent from '@/components/cardEvent.vue'
import { computed } from 'vue'

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
const numberOfDays = computed(() => dataStore.data.config.numberOfDays || 0)
const nextDaysTitle = computed(() => numberOfDays.value === 1 ? 'Amanhã' : `Próximos ${numberOfDays.value} dias`)
const lastDate = computed(() => new Date(new Date().setDate(new Date().getDate() + numberOfDays.value)))

import { today, dateISO } from '@/stores/utility';
const eventsToday = computed(() => dataStore.undoneEvents.filter(e => e.date === dateISO(today())))
const eventsNextDays = computed(() => dataStore.undoneEvents.filter(e => e.date > dateISO(today()) && e.date <= dateISO(lastDate.value)))
</script>

<template>
  <div class="section">
    <div class="agenda">
      <h2>Hoje</h2>
      <div v-if="eventsToday.length" class="container grid">
        <cardEvent v-for="event in eventsToday" :key="event.id_event" :id="event.id_event" :add="true" />
      </div>
      <p class="tac" v-else>Nenhuma aula para hoje :)</p>
    </div>
      
    <div class="agenda" v-if="numberOfDays>0 && eventsNextDays.length">
      <h2>{{nextDaysTitle}}</h2>
      <div class="container grid">
        <cardEvent v-for="event in eventsNextDays" :key="event.id_event" :id="event.id_event" :add="false" />
      </div>
    </div>
  </div>
</template>

<style>
.agenda{width:100%}
.agenda:nth-last-child(1){margin-top:2em}
.agenda h2{margin-bottom:1.5em}
.grid{ display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 14px ; margin-top: 1em}

@media screen and (max-width: 992px) {
  .agenda:nth-last-child(1){margin-top:0}
  .agenda h2{margin-bottom:.5em}
}
</style>