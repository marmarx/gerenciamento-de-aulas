<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

dataStore.selectedStudent = ''
const students = dataStore.sortedStudents
const payments = computed(() => dataStore.sortedPayments.filter(e => !dataStore.selectedStudent || e.id_student === dataStore.selectedStudent))

const sortKey = ref('date')
const sortReverse = ref(true)

const sortedPayments = computed(() => {
  const sorted = [...payments.value].sort((a, b) => {
    if (sortKey.value === 'student_name') return a.student_name.toLowerCase().localeCompare(b.student_name.toLowerCase())
    if (sortKey.value === 'value') return a.value - b.value
    else return new Date(a.date) - new Date(b.date)
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

const editPayment = (id) => {
  dataStore.selectedPayment = id
  router.push('/pagamento')
}

import { invertDateISOnoYear, currency } from '@/stores/utility';
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
    <div class="container">
      <table>
        <thead><tr>
          <th @click="sortBy('student_name')">Aluno   <span v-if="sortKey === 'student_name'">{{ sortReverse ? '▲' : '▼' }}</span></th>
          <th @click="sortBy('date')">        Data    <span v-if="sortKey === 'date'">        {{ sortReverse ? '▲' : '▼' }}</span></th>
          <th @click="sortBy('value')">       Valor   <span v-if="sortKey === 'value'">       {{ sortReverse ? '▲' : '▼' }}</span></th>
        </tr></thead>
        <tbody><tr v-for="payment in sortedPayments" :key="payment.id_pay" @click="editPayment(payment.id_pay)">
          <td>{{ payment.student_name }}</td>
          <td>{{ invertDateISOnoYear(payment.date) }}</td>
          <td>{{ currency(payment.value) }}</td>
        </tr></tbody>
      </table>
    </div>
    <p class="tac">Clique em um pagamento para editar.</p>
  </div>
</template>

<style scoped>
tr{cursor:pointer}
</style>