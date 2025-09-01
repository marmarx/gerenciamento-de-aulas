<script setup>
import inputToggle from '@/components/inputToggle.vue'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

if(!dataStore.selectedEvent) {
  dataStore.data.events.push(dataStore.newEvent())
  dataStore.selectedEvent = dataStore.data.events.at(-1).id_event
}

const event = dataStore.data.events.find(l => l.id_event === dataStore.selectedEvent)
const students = dataStore.data.students.filter(s => !s.paused)

const isDisabled = () => !event.id_student || !event.date || !event.time

import { onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const saveEvent = () => {
  event.originalDate = event.originalDate || event.date
  event.originalTime = event.originalTime || event.time
  event.duration = event.duration || dataStore.data.config.defaultClassDuration
  event.cost = students.find(s => s.id_student === event.id_student).cost || dataStore.data.config.defaultClassCost
  event.status = 'scheduled'
  event.student_name = students.find(s => s.id_student === event.id_student)?.student_name || ''
  if(dataStore.data.config.autoFinishEvents) event.status = `${event.date}T${event.time}` < new Date().toISOString().split('.')[0].slice(0,-3) ? 'done' : 'scheduled'
  router.push('/agenda')
}

const cancelEvent = () => {
  dataStore.removeEvent(event.id_event)
  router.push('/agenda')
}

// remove event if no student, no date or no time is given when leaving the page
onBeforeUnmount(() => { if(isDisabled()) dataStore.removeEvent(event.id_event) })
</script>

<template>
  <div class="section">
    <h2>Nova Aula</h2>
    <div class="container">
      <label>Nome do aluno
      <select name="aluno" v-model="event.id_student" required> <!-- :readonly="event.id_student" -->
        <option value="" selected>Nome do aluno</option>
        <option v-for="student in students" :key="student" :value="student.id_student">{{student.student_name}}</option>
      </select>
      </label>
      <label>Data<input name="data" type="date" v-model="event.date" required></label>
      <label>Horário<input name="horario" type="text" placeholder="Hora de início (hh:mm)" onfocus="this.type='time'" onblur="if(!this.value)this.type='text'" v-model="event.time" required></label>
      <label>Duração<input name="duração" type="number" placeholder="Duração (horas)" step="0.1" v-model="event.duration"></label>
      <!-- <label>Valor da hora aula<input name="valor" type="number" placeholder="Valor da hora aula" step="0.1" v-model="event.cost"></label> -->
      <label>Observações<textarea name="obs" placeholder="Observações" v-model="event.obs"></textarea></label>

      <inputToggle v-model="event.experimental">
        <template #title>Aula experimental</template>
        <template #helpText>Aulas experimentais não tem custo e não são consideradas nos cálculos</template>
      </inputToggle>

    </div>
    <div class="flexContainer">
      <button @click="saveEvent()" :disabled="isDisabled()">Salvar</button>
      <button @click="cancelEvent()">Cancelar</button>
    </div>
  </div>
</template>