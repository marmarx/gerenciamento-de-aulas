<script setup>
import { parseDate, weekLabel, dateLabel, timeISO, horaBR, formatDuration, currency, toSentenceCase } from '@/composables/utility'
import { eventValue } from '@/composables/eventValue'
import { computed } from 'vue'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
const students = dataStore.sortedStudents
const student = dataStore.student

const history = computed(() => {
  if (!dataStore.selectedStudent) return []

  const events = dataStore.chargableEvents //dataStore.sortedEvents chargableEvents
    .filter(e => e.id_student === dataStore.selectedStudent)
    .map(e => ({
      type: 'Aula',
      id: e.id_event,
      date: e.date,
      time: e.time,
      value: -eventValue(e.id_event),
      dateStamp: `${weekLabel(e.date)}, ${dateLabel(e.date)}  •  ${horaBR(e.time)}`,
      details: `${e.experimental ? 'Experimental' : currency(e.cost || student.cost)}  •  ${formatDuration(e.duration)}`,
      status: e.status
    }))

  const payments = dataStore.studentPayments
    .map(p => ({
      type: "Pagamento",
      id: p.id_pay,
      date: p.date,
      time: timeISO(p.added_on),
      value: p.value || 0,
      dateStamp: `${weekLabel(p.date)}, ${dateLabel(p.date)}  •  ${horaBR(timeISO(p.added_on))}`,
      details: null,
      status: null
    }))

  return [...payments, ...events].sort((a, b) => parseDate(a.date, a.time) - parseDate(b.date, b.time))
})

const monthlyBalance = computed(() => {
  const result = {}
  const items = [...history.value]
  let runningBalance = 0

  for (const item of items) {
    runningBalance += item.value

    const d = parseDate(item.date, item.time)
    const monthKey = d.toLocaleString('default', { month: 'long', year: 'numeric' })

    result[monthKey] = runningBalance
  }

  return result
})

const groupedByMonth = computed(() => {
  const groups = {}
  const items = [...history.value].reverse()

  for (const item of items) {
    const d = parseDate(item.date, item.time)
    const monthKey = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    if (!groups[monthKey]) groups[monthKey] = {
      month: monthKey,
      items: [],
      balance: monthlyBalance.value[monthKey] || 0
    }
    groups[monthKey].items.push(item)
  }

  return groups
})

import { useRouter } from 'vue-router'
const router = useRouter()

const editEntry = (type, id) => {
  if(type==='Aula') {
    dataStore.selectedEvent = id
    router.push('/aula')
  } else {
    dataStore.selectedPayment = id
    router.push('/pagamento')
  }
}
</script>

<template>
  <div class="section">
    <h2>Extrato</h2>
    <div class="container smallContainer">
      <select name="aluno" v-model="dataStore.selectedStudent" required>
        <option value="" selected>Selecione um aluno</option>
        <option v-for="student in students" :key="student.id_student" :value="student.id_student">{{student.student_name}}</option>
      </select>
    </div>
    <div v-if="dataStore.selectedStudent" class="container smallContainer">
      <template v-if="groupedByMonth">
        <div v-for="group in groupedByMonth" :key="group.month">
          <div class="exHead">
            <p class="exMonth">{{ toSentenceCase(group.month) }}</p>
            <p class="exText">
              Saldo:
              <span :style="{ color: group.balance < 0 ? 'var(--red)' : 'var(--green)' }">{{ currency(group.balance) }}</span>
            </p>
          </div>
          <div v-for="item in group.items" :key="item.id" class="exItem" @click="editEntry(item.type, item.id)">
            <div class="exRow">
              <div class="exCol">
                <div class="exTitle">{{ item.type }} <span class="exStatus" v-if="item.status === 'canceled'">(cancelada)</span></div>
                <div class="exText">{{ item.dateStamp }}</div>
                <div v-if="item.details" class="exText">{{ item.details }}</div>
              </div>
              <div class="exCol">
                <div class="exValue" style="margin:auto" :class="{ up: item.value > 0, down: item.value < 0 }">{{ item.value === 0 ? currency(0) : currency(item.value) }}</div>
              </div>
            </div>
          </div>
        </div>
        <br/>
      </template>
      <p v-else>Nenhum dado.</p>
    </div>
    <p v-else>Selecione um aluno acima.</p>
  </div>
</template>

<style scoped>
@import "@/assets/list.css";
</style>