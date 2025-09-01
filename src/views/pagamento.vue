<script setup>
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

if(!dataStore.selectedPayment) {
  dataStore.data.payments.push(dataStore.newPayment())
  dataStore.selectedPayment = dataStore.data.payments.at(-1).id_pay
}

const payment = dataStore.data.payments.find(l => l.id_pay === dataStore.selectedPayment)
const students = dataStore.data.students.filter(s => !s.paused)

const isDisabled = () => !payment.id_student || !payment.date || !payment.value

import { onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const cancelPayment = () => {
  dataStore.removePayment(payment.id_pay)
  router.push('/alunos')
}

// remove payment if no student, no date or no value is given when leaving the page
onBeforeUnmount(() => { 
  if(isDisabled()) dataStore.removePayment(payment.id_pay)
  payment.student_name = students.find(s => s.id_student === payment.id_student)?.student_name || ''
})
</script>

<template>
  <div class="section">
    <h2>Novo Pagamento</h2>
    <div class="container">
      <label>Nome do aluno
      <select name="aluno" v-model="payment.id_student" required>
        <option value="" selected>Nome do aluno</option>
        <option v-for="student in students" :key="student" :value="student.id_student">{{student.student_name}}</option>
      </select>
      </label>
      <label>Data<input name="data" type="date" v-model="payment.date" required></label>
      <label>Valor<input name="valor" type="number" placeholder="Valor da hora aula" step="0.1" v-model="payment.value"></label>
      <label>Observações<textarea name="obs" placeholder="Observações" v-model="payment.obs"></textarea></label>
    </div>
    <div class="flexContainer">
      <button @click="router.push('/alunos')" :disabled="isDisabled()">Salvar</button>
      <button @click="cancelPayment()">Cancelar</button>
    </div>
  </div>
</template>