<script setup>
import { ref, computed } from 'vue'
import { invertDateISOnoYear, weekDay, currency, formatTime } from '@/stores/utility';
const status = { 'scheduled':'Agendada', 'done':'Finalizada', 'canceled':'Cancelada' }

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

dataStore.selectedStudent = ''
const students = dataStore.sortedStudents
const events = computed(() => dataStore.sortedEvents.filter(e => !dataStore.selectedStudent || e.id_student === dataStore.selectedStudent))

const sortKey = ref('date')
const sortReverse = ref(true)

const sortedEvents = computed(() => {
  const sorted = [...events.value].sort((a, b) => {
    if (sortKey.value === 'student_name' || sortKey.value === 'status') return a[sortKey.value].toLowerCase().localeCompare(b[sortKey.value].toLowerCase())
    if (sortKey.value === 'duration' || sortKey.value === 'cost') return a[sortKey.value] - b[sortKey.value]
    if (sortKey.value === 'day') return new Date(a.date).getDay() - new Date(b.date).getDay()
    if (sortKey.value === 'time') return new Date(`2025-01-01T${formatTime(a.time)}`) - new Date(`2025-01-01T${formatTime(b.time)}`)
    else return new Date(`${a.date}T${formatTime(a.time)}`) - new Date(`${b.date}T${formatTime(b.time)}`)
  })
  return sortReverse.value ? sorted.reverse() : sorted
})

const sortBy = (key) => {
  if (sortKey.value === key) sortReverse.value = !sortReverse.value
  else {
    sortKey.value = key
    sortReverse.value = false
  }
}

import { useRouter } from 'vue-router'
const router = useRouter()

const editEvent = (id) => {
  dataStore.selectedEvent = id
  router.push('/aula/editar')
}
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
          <th             @click="sortBy('student_name')">Aluno   <span v-if="sortKey === 'student_name'">{{ sortReverse ? '▲' : '▼' }}</span></th>
          <th             @click="sortBy('date')">        Data    <span v-if="sortKey === 'date'">        {{ sortReverse ? '▲' : '▼' }}</span></th>
          <th class="web" @click="sortBy('day')">         Dia     <span v-if="sortKey === 'day'">         {{ sortReverse ? '▲' : '▼' }}</span></th>
          <th class="web" @click="sortBy('time')">        Hora    <span v-if="sortKey === 'time'">        {{ sortReverse ? '▲' : '▼' }}</span></th>
          <th class="web" @click="sortBy('duration')">    Duração <span v-if="sortKey === 'duration'">    {{ sortReverse ? '▲' : '▼' }}</span></th>
          <th class="web" @click="sortBy('cost')">        R$/h    <span v-if="sortKey === 'cost'">        {{ sortReverse ? '▲' : '▼' }}</span></th>
          <th             @click="sortBy('status')">      Status  <span v-if="sortKey === 'status'">      {{ sortReverse ? '▲' : '▼' }}</span></th>
        </tr></thead>
        <tbody><tr v-for="event in sortedEvents" :key="event.id_event" @click="editEvent(event.id_event)">
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
    <p class="tac">Clique em uma aula para editar. Clique em um cabeçalho para organizar.</p>
  </div>
</template>

<style scoped>
tr{cursor:pointer}
</style>