<script setup>
import inputToggle from '@/components/inputToggle.vue'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

import { computed } from 'vue'
const autoFinishOffset = computed(() => !isNaN(dataStore.data.config.autoFinishOffset) ? Number(dataStore.data.config.autoFinishOffset) : 30)

if(!dataStore.selectedEvent) {
  const newEvent = dataStore.newEvent()
  dataStore.data.events.push(newEvent)
  dataStore.selectedEvent = newEvent.id_event//sortedEvents
}

const event = dataStore.sortedEvents.find(l => l.id_event === dataStore.selectedEvent)
const currentEventDate = event.date
const currentEventTime = event.time

// restore to the last instance
const restoreEvent = () => {
  if(event.originalDate) event.date = currentEventDate || event.originalDate
  if(event.originalTime) event.time = currentEventTime || event.originalTime
  saveEvent()
}

const students = dataStore.activeStudents
const isDisabled = () => !event.id_student || !event.date || !event.time

import { useRouter } from 'vue-router'
const router = useRouter()

import { dateISO, timeISO, formatTime } from '@/stores/utility';
const saveEvent = () => {
  if(dataStore.data.config.autoFinishEvents) {
    const now = new Date();
    const eventDateTime = new Date(`${event.date}T${formatTime(event.time)}`);
    const finishThreshold = new Date(eventDateTime.getTime() + autoFinishOffset * 60 * 1000)
    event.status = finishThreshold <= now ? 'done' : 'scheduled'
  }
  event.duration = event.duration || dataStore.data.config.defaultClassDuration
  event.student_name = students.find(s => s.id_student === event.id_student)?.student_name || ''
  router.push('/agenda')
}

const cancelEvent = () => {
  event.status = event.status === 'canceled' ? 'scheduled' : 'canceled'
  router.push('/agenda')
}

const doEventNow = () => {
  event.status = 'done'
  event.originalDate = event.date
  event.originalTime = event.time
  const now = new Date();
  event.date = dateISO(now); // YYYY-MM-DD format
  event.time = timeISO(now); // HH:mm
  router.push('/agenda')
}
</script>

<template>
  <div class="section">
    <h2>Editar Aula</h2>
    <div class="container">
      <label>Nome do aluno
      <select name="aluno" v-model="event.id_student" disabled>
        <option value="" selected>Nome do aluno</option>
        <option v-for="student in students" :key="student" :value="student.id_student">{{student.student_name}}</option>
      </select>
      </label>
      <div class="flexContainer">
        <label class="half">Data original<input name="data" type="date" v-model="event.originalDate" readonly></label>
        <label class="half">Nova data<input name="data" type="date" v-model="event.date" required></label>
      </div>
      <div class="flexContainer ">
        <label class="half">Horário original<input name="horario" type="text" placeholder="Hora de início (hh:mm)" v-model="event.originalTime" readonly></label>
        <label class="half">Novo horário<input name="horario" type="text" placeholder="Hora de início (hh:mm)" onfocus="this.type='time'" onblur="if(!this.value)this.type='text'" v-model="event.time" required></label>
      </div>
      <label>Duração<input name="duração" type="number" placeholder="Duração (horas)" step="0.1" v-model="event.duration"></label>
      <!-- <label>Valor da hora aula<input name="valor" type="number" placeholder="Valor da hora aula" step="0.5" v-model="event.cost"></label> -->
      <label>Observações<textarea name="obs" placeholder="Observações" v-model="event.obs"></textarea></label>

      <inputToggle v-model="event.experimental">
        <template #title>Aula experimental</template>
        <template #helpText>Aulas experimentais não tem custo e não são consideradas nos cálculos</template>
      </inputToggle>

    </div>
    <div class="flexContainer">
      <button @click="saveEvent()" :disabled="isDisabled()">Salvar</button>
      <button @click="doEventNow()">Finalizar Agora</button>
      <button @click="cancelEvent()">{{event.status === 'canceled' ? 'Restaurar Aula' : 'Cancelar Aula'}}</button>
      <button @click="restoreEvent()">Cancelar Edição</button>
    </div>
  </div>
</template>