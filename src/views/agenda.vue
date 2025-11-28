<script setup>
import cardEvent from '@/components/cardEvent.vue'
import { computed } from 'vue'

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
const numberOfDays = computed(() => dataStore.data.config.numberOfDays || 0)
const nextDaysTitle = computed(() => numberOfDays.value === 1 ? 'Amanhã' : `Próximos ${numberOfDays.value} dias`)

import { filterRange, dateISO, addDays } from '@/composables/utility';
const tomorrow = addDays(0, 1)
const lastDate = computed(() => addDays(0, numberOfDays.value))
const filterDates = arr => filterRange(arr, tomorrow, lastDate.value)

const eventsToday = computed(() => dataStore.undoneEvents.filter(e => e.date === dateISO(new Date())))  // events happening today
const eventsNextDays = computed(() => filterDates(dataStore.undoneEvents || []))                        // events happening in-between tomorrow and numberOfDays shown in agenda
</script>

<template>
  <div class="section">

    <template v-if="!dataStore.data.students.length">
      <div class="agenda container">
        <h2>Agenda</h2>
        <p class="tac">Nenhum aluno ainda, inicie <router-link to="/aluno/editar" title="Novo aluno" @click="dataStore.selectedStudent = null">adicionando um</router-link> para agendar aulas.</p>
      </div>
    </template>

    <template v-else-if="!dataStore.data.events.length">
      <div class="agenda container">
        <h2>Agenda</h2>
        <p class="tac">Nenhuma aula agendada, <router-link to="/aula" title="Novo aluno" @click="dataStore.selectedEvent = null">adicione uma</router-link> manualmente ou indique horário semanal dos alunos para criar os agendamentos automaticamente.</p>
      </div>
    </template>

    <template v-else>
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
    </template>

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