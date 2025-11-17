<script setup>
import { ref, computed } from 'vue'

import { useRouter } from 'vue-router'
const router = useRouter()

import { isMob } from '@/stores/gestureControl'
import { invertDateISOnoYear, shortWeekday, currency, formatTime, formatDuration, weekLabel, dateLabel, horaBR, toSentenceCase } from '@/stores/utility';
const status = { 'scheduled':'Agendada', 'done':'Finalizada', 'canceled':'Cancelada' }

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

dataStore.selectedStudent = ''
const students = dataStore.sortedStudents
const events = computed(() => dataStore.sortedEvents.filter(e => !dataStore.selectedStudent || e.id_student === dataStore.selectedStudent))

const eventsGroupedByMonth = computed(() => {
  const groups = {}

  for (const item of events.value.reverse()) {
    const d = new Date(`${item.date}T00:00`)
    const monthKey = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    if (!groups[monthKey]) groups[monthKey] = []
    groups[monthKey].push(item)
  }

  return groups
})

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

const editEvent = (id) => {
  dataStore.selectedEvent = id
  router.push('/aula') //'/aula/editar'
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
    
    <div v-if="isMob" class="mobList">
      <div v-for="(items, month) in eventsGroupedByMonth" :key="month">
        <div class="exHead">
          <p class="exMonth">{{ toSentenceCase(month) }}</p>
          <p class="exText">{{ currency(items.reduce((total, e) => total + (e.experimental ? 0 : (e.status !== 'canceled' ? e.cost * e.duration : 0)), 0)) }}</p>
        </div>
        <div v-for="event in items" :key="event.id" class="exItem" @click="editEvent(event.id_event)">
          <div class="exRow">
            <div class="exCol">
              <div class="exTitle">{{ event.student_name }}</div>
              <div class="exText">{{ weekLabel(event.date) }}, {{ dateLabel(event.date) }}  •  {{ horaBR(event.time) }}</div>
              <div class="exText">{{ event.experimental ? 'Experimental' : currency(event.cost) }}  •  {{ formatDuration(event.duration) }}</div> 
            </div>
            <div class="icon-wrapper">
              <div v-if="event.status === 'scheduled'" class="icon icon-event" :style="{'--today-day': `'${new Date(event.date).getDate()+1}'`}"></div>
              <div v-else-if="event.status === 'canceled'" class="icon icon-canceled"></div>
              <div v-else-if="event.status === 'done'" class="icon icon-done"></div>
            </div>
          </div>
        </div>
      </div>
      <br/>
      <p class="tac">Clique em uma aula para editar.</p>
    </div>

    <div v-else class="container">
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
          <td class="web">{{ shortWeekday(event.date) }}</td>
          <td class="web">{{ event.time }}</td>
          <td class="web">{{ `${event.duration} hora${event.duration>1?'s':''}` }}</td>
          <td class="web">{{ event.experimental ? currency(0) : currency(event.cost) }}</td>
          <td>{{ status[event.status] }}</td>
        </tr></tbody>
      </table>
      <br/>
      <p class="tac">Clique em uma aula para editar. Clique no cabeçalho para organizar.</p>
    </div>
  </div>
</template>

<style scoped>
@import "@/assets/list.css";
</style>