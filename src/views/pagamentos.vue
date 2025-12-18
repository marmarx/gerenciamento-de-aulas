<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

import { useRouter } from 'vue-router'
const router = useRouter()

import { isMob } from '@/modules/gesture/gestureControl'
import { parseDate, shortDateLabel, currency, weekLabel, dateLabel, toSentenceCase } from '@/composables/utility';

dataStore.selectedStudent = ''
const students = dataStore.sortedStudents
const payments = computed(() => dataStore.sortedPayments.filter(e => !dataStore.selectedStudent || e.id_student === dataStore.selectedStudent))

const paymentsGroupedByMonth = computed(() => {
  const groups = {}

  for (const item of payments.value.reverse()) {
    const d = parseDate(item.date)
    const monthKey = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    if (!groups[monthKey]) groups[monthKey] = []
    groups[monthKey].push(item)
  }

  return groups
})

const sortKey = ref('date')
const sortReverse = ref(true)

const sortedPayments = computed(() => {
  const sorted = [...payments.value].sort((a, b) => {
    if (sortKey.value === 'student_name') return a.student_name.toLowerCase().localeCompare(b.student_name.toLowerCase())
    if (sortKey.value === 'value') return a.value - b.value
    else return parseDate(a.date) - parseDate(b.date)
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

const editPayment = (id) => {
  dataStore.selectedPayment = id
  router.push('/pagamento')
}
</script>

<template>
  <div class="section">
    <h2>Todos os Pagamentos</h2>
    <div class="container">
      <select name="aluno" v-model="dataStore.selectedStudent" required>
        <option value="" selected>Todos os alunos</option>
        <option v-for="student in students" :key="student.id_student" :value="student.id_student">{{student.student_name}}</option>
      </select>
    </div>

    <div v-if="isMob" class="mobList">

      <div v-for="(items, month) in paymentsGroupedByMonth" :key="month">
        <div class="exHead">
          <p class="exMonth">{{ toSentenceCase(month) }}</p>
          <p class="exText">{{ currency(items.reduce((total, e) => total + e.value, 0)) }}</p>
        </div>
        <div v-for="payment in items" :key="payment.id_pay" class="exItem" @click="editPayment(payment.id_pay)">

          <div class="exRow">
            <div class="exCol">
              <div class="exTitle">{{ payment.student_name }}</div>
              <div class="exText">{{ weekLabel(payment.date) }}, {{ dateLabel(payment.date) }}</div>
            </div>
            <div class="exCol">
              <div style="margin:auto">{{ currency(payment.value) }}</div>
            </div>
          </div>
        </div>
      </div>
      <br/>
      <p class="tac">Clique em um pagamento para editar.</p>
    </div>

    <div v-else class="container">
      <table>
        <thead><tr>
          <th @click="sortBy('student_name')">Aluno   <span v-if="sortKey === 'student_name'">{{ sortReverse ? '▲' : '▼' }}</span></th>
          <th @click="sortBy('date')">        Data    <span v-if="sortKey === 'date'">        {{ sortReverse ? '▲' : '▼' }}</span></th>
          <th @click="sortBy('value')">       Valor   <span v-if="sortKey === 'value'">       {{ sortReverse ? '▲' : '▼' }}</span></th>
        </tr></thead>
        <tbody><tr v-for="payment in sortedPayments" :key="payment.id_pay" @click="editPayment(payment.id_pay)">
          <td>{{ payment.student_name }}</td>
          <td>{{ shortDateLabel(payment.date) }}</td>
          <td>{{ currency(payment.value) }}</td>
        </tr></tbody>
      </table>
      <br/>
      <p class="tac">Clique em um pagamento para editar. Clique no cabeçalho para organizar.</p>
    </div>

  </div>
</template>

<style scoped>
@import "@/assets/list.css";
</style>