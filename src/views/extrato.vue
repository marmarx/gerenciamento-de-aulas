<script setup>
import { computed } from 'vue'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
const students = dataStore.sortedStudents

const listCompletedLessons = () => {
  const events = dataStore.doneEvents.filter(e => e.id_student === dataStore.selectedStudent);

  return events.map(e => ({
    type: 'aula',
    date: e.date,
    duration: e.duration || 1,
    value: e.experimental ? 0 : (-(e.duration || 1) * (e.cost || students.find(s => s.id_student === dataStore.selectedStudent).cost)),
    experimental: e.experimental || false
  }));
};

const listPayments = () => {
  const studentPayments = dataStore.sortedPayments
    .filter(p => p.id_student === dataStore.selectedStudent)
    .map(payment => ({
      type: "payment",
      date: payment.date,
      value: payment.value || 0
  }));
  return studentPayments;
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

  history.value.forEach(item => {
    if (item.date !== previousDate) {
      if (previousDate) rows.push({ type: 'saldo', date: previousDate, balance })
      previousDate = item.date
    }

    balance += item.value

    rows.push({
      type: item.type,
      date: item.date,
      value: item.experimental ? 0 : item.value,
      description: item.type === "payment" ? 'Pagamento' : `Aula ${item.experimental ? 'experimental' : `(${item.duration} hora${item.duration > 1 ? 's' : ''})`}`
    })
  })

  if (previousDate) rows.push({ type: 'saldo', date: previousDate, balance }) //last balance
  return rows.reverse()
})
import { invertDateISO, currency } from '@/stores/utility'
</script>

<template>
  <div class="section">
    <h2>Extrato</h2>
    <div class="container">
      <select name="aluno" v-model="dataStore.selectedStudent" required>
        <option value="" selected>Selecione um aluno</option>
        <option v-for="student in students" :key="student.id_student" :value="student.id_student">{{student.student_name}}</option>
      </select>
    </div>
    <div v-if="dataStore.selectedStudent" class="container">
      <table v-if="statement.length">
        <thead>
          <tr class="table-balance">
            <th>Item</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in statement" :key="i" class="table-balance">
            <template v-if="row.type === 'saldo'">
              <td><b>{{ invertDateISO(row.date) }}</b></td>
              <td>Saldo: <span :style="{ color: row.balance < 0 ? 'var(--money-red)' : 'var(--money-green)' }">{{ currency(row.balance) }}</span></td>
            </template>

            <template v-else>
              <td>{{ row.description }}</td>
              <td>{{ currency(row.value) }}</td>
            </template>
          </tr>
        </tbody>
      </table>
      <p class="tac" v-else>Não há dados para o aluno selecionado.</p>
    </div>
    <p v-else>Selecione um aluno acima.</p>
  </div>
</template>
