<script setup>
import { weekLabel, dateLabel, monthLabel, currency, toSentenceCase } from '@/stores/utility'
import { computed } from 'vue'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
const students = dataStore.sortedStudents
const student = dataStore.student

const listCompletedLessons = () => {
  const events = dataStore.doneEvents.filter(e => e.id_student === dataStore.selectedStudent);

  return events.map(e => ({
    type: 'Aula',
    date: e.date,
    value: e.experimental ? 0 : -((e.duration || 1) * (e.cost || student.cost)),
    details: `${e.experimental ? 'Experimental' : currency(e.cost || student.cost)}  •  ${e.duration || 1} hora${e.duration != 1 ? 's' : ''}`
  }))
}

const listPayments = () => {
  const studentPayments = dataStore.studentPayments

  return studentPayments.map(p => ({
    type: "Pagamento",
    date: p.date,
    value: p.value || 0
  }))
}

const history = computed(() => {
  if (!dataStore.selectedStudent) return []

  const events = listCompletedLessons()
  const payments = listPayments()
  return [...payments, ...events].sort((a, b) => new Date(a.date) - new Date(b.date))
})

const statement = computed(() => {
  let balance = 0
  let rows = []
  let previousDate = null
  let previousMonth = null

  console.log('history', history.value)

  history.value.forEach(item => {
    if (item.date !== previousDate) {
      if (previousDate) rows.push({ type: 'Saldo', date: previousDate, value: balance, today: 1 })
      previousDate = item.date
    }

    const month = monthLabel(item.date) 
    if (month !== previousMonth) {
      if (previousMonth) rows.push({ type: 'month', details: toSentenceCase(previousMonth)})
      previousMonth = month
    }

    balance += item.value
    rows.push({ type: item.type, date: item.date, value: item.value, details: item.details })
  })

  if (previousDate)  rows.push({ type: 'Saldo', date: previousDate, value: balance }) //last balance
  if (previousMonth) rows.push({ type: 'month', details: toSentenceCase(previousMonth)})
  console.log('rows', JSON.parse(JSON.stringify(rows)))
  return rows.reverse()
})

import { useRouter } from 'vue-router'
const router = useRouter()

const editEvent = (id) => {
  dataStore.selectedEvent = id
  router.push('/aula')
}

const editPayment = (id) => {
  dataStore.selectedPayment = id
  router.push('/pagamento')
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

      <template v-if="statement.length">
        <div v-for="(row, i) in statement" :key="i" class="exCol">

          <div v-if="row.type==='month'" class="exMonth">
            {{ row.details }}
          </div>

          <div v-else-if="row.type==='Saldo'" class="exBalance">
            <div class="exRow">
              <div>{{weekLabel(row.date)}}, {{dateLabel(row.date) }}</div>
              <div>Saldo <span :style="{ color: row.value < 0 ? 'var(--red)' : 'var(--green)' }">{{ currency(row.value) }}</span></div>
            </div>
          </div>

          <div v-else-if="row.type==='Aula'" class="exItem"  @click="editEvent(row.id_event)">
            <div class="exRow">
              <div class="exCol">
                <div class="exTitle">{{ row.type }}</div>
                <div class="smallTxt">{{ row.details }}</div>
              </div>
              <div class="exValue" :style="{ color: row.value < 0 ? 'var(--red)' : 'var(--green)' }">{{ currency(row.value) }}</div>
            </div>
          </div>

          <div v-else-if="row.type==='Pagamento'" class="exItem" @click="editPayment(row.id_pay)">
            <div class="exRow">
              <div class="exTitle">{{ row.type }}</div>
              <div class="exValue" :style="{ color: row.value < 0 ? 'var(--red)' : 'var(--green)' }">{{ currency(row.value) }}</div>
            </div>
          </div>

        </div>
      </template>
      <p class="tac" v-else>Não há dados para o aluno selecionado.</p>
    </div>
    <p v-else>Selecione um aluno acima.</p>
  </div>
</template>

<style scoped>
.exCol, .exRow { width: 100%; display: flex }
.exCol { flex-direction: column; margin: 5px 0}
.exRow { flex-direction: row; justify-content: space-between }
.exGap{gap:10px}

.exMonth { font-size: 1.5em; font-weight: bold; margin: 20px 0 10px }
.exBalance { font-size: .95em; border-bottom: 1px solid currentColor; padding: 5px 0 }
.exTitle { font-weight: bold; margin: 0 0 5px}
.exValue { text-wrap: nowrap; margin: auto 0}
.exItem { margin: 5px 0 }
</style>