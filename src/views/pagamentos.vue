<script setup>
import { computed } from 'vue'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

dataStore.selectedStudent = ''
const students = dataStore.sortedStudents
const payments = computed(() => dataStore.sortedPayments.filter(e => !dataStore.selectedStudent || e.id_student === dataStore.selectedStudent))

import { useRouter } from 'vue-router'
const router = useRouter()

const editEvent = (id) => {
  dataStore.selectedPayment = id
  router.push('/pagamento')
}

import { invertDateISOnoYear } from '@/stores/utility';
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
          <th>Aluno</th>
          <th>Data</th>
          <th>Valor</th>
        </tr></thead>
        <tbody><tr v-for="payment in payments" :key="payment.id_pay" @click="editEvent(payment.id_pay)">
          <td>{{ payment.student_name }}</td>
          <td>{{ invertDateISOnoYear(payment.date) }}</td>
          <td>{{ payment.value }}</td>
        </tr></tbody>
      </table>
    </div>
    <p class="tac">Clique em um pagamento para editar.</p>
  </div>
</template>

<style scoped>
tr{cursor:pointer}
</style>