<script setup>
import { computed, watch } from 'vue'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

dataStore.selectedStudent = ''
const students = dataStore.sortedStudents
const events = computed(() => dataStore.sortedEvents.filter(e => !dataStore.selectedStudent || e.id_student === dataStore.selectedStudent))

import { useRouter } from 'vue-router'
const router = useRouter()

const editEvent = (id) => {
  dataStore.selectedEvent = id
  router.push('/aula/editar')
}

const status = { 'scheduled':'Agendada', 'done':'Finalizada', 'canceled':'Cancelada' }
import { invertDateISOnoYear, weekDay, horaBR, currency } from '@/stores/utility';
</script>

<template>
  <div class="section">
    <h2>Todas as Aulas</h2>
    <div class="container">
      <select name="aluno" v-model="dataStore.selectedStudent" required>
        <option value="" selected>Todos os alunos</option>
        <option v-for="student in students" :key="student.id_student" :value="student.id_student">{{student.student_name}}</option>
      </select>
    </div>
    <div class="container">
      <table>
        <thead><tr>
          <th>Aluno</th>
          <th>Data</th>
          <th class="web">Dia</th>
          <th class="web">Hora</th>
          <th class="web">Duração</th>
          <th class="web">R$/h</th>
          <th>Status</th>
        </tr></thead>
      <tbody><tr v-for="event in events" :key="event.id_event" @click="editEvent(event.id_event)">
        <td>{{ event.student_name }}</td>
        <td>{{ invertDateISOnoYear(event.date) }}</td>
        <td class="web">{{ weekDay(event.date) }}</td>
        <td class="web">{{ event.time }}</td>
        <td class="web">{{ `${event.duration} hora${event.duration>1?'s':''}` }}</td>
        <td class="web">{{ event.experimental ? currency(0) : currency(event.cost) }}</td>
        <td>{{ status[event.status] }}</td>
      </tr></tbody>
    </table>
    </div>
  </div>
</template>

<style scoped>
tr{cursor:pointer}
</style>