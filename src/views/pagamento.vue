<script setup>
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

const isNewPayment = ref(false)
if(!dataStore.selectedPayment) {
  const newPayment = dataStore.newPayment()
  dataStore.data.payments.push(newPayment)
  dataStore.selectedPayment = newPayment.id_pay
  isNewPayment.value = true
}

const payment = dataStore.data.payments.find(p => p.id_pay === dataStore.selectedPayment)
const students = dataStore.activeStudents

const isDisabled = () => !payment.id_student || !payment.date || !payment.value

import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const exitView = () => {
  if (router.options.history.state.back) router.back()
  else router.push('/agenda')
}

const cancelPayment = () => {
  dataStore.removePayment(payment.id_pay)
  exitView()
}

// remove payment if no student, no date or no value is given when leaving the page
onBeforeUnmount(() => { 
  if(isDisabled()) dataStore.removePayment(payment.id_pay)
  payment.student_name = students.find(s => s.id_student === payment.id_student)?.student_name || ''
})
</script>

<template>
  <div class="section">
    <h2>{{ payment.student_name ? `Editar` : 'Novo' }} Pagamento</h2>
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
      <button @click="exitView()" :disabled="isDisabled()">Salvar</button>
      <button  v-if="isNewPayment" @click="exitView()">Cancelar</button>
      <button  v-else @click="cancelPayment()">Remover</button>
    </div>
  </div>
</template>