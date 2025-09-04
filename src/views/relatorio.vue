<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
const students = dataStore.sortedStudents || []
const student = dataStore.student

import { ref, computed } from 'vue'
import { dateISO, invertDateISO, currency } from '@/stores/utility'
const today = new Date();
const year  = today.getFullYear();
const month = today.getMonth();
const filterStart = ref(dateISO(new Date(year, month, 1)))
const filterEnd   = ref(dateISO(new Date(year, month + 1, 0)))

const listCompletedLessons = () => {
  const events = dataStore.doneEvents.filter(e => e.id_student === dataStore.selectedStudent);

  return events.map(e => ({
    type: 'aula',
    date: e.date,
    duration: e.duration || 1,
    value: e.experimental ? 0 : (-(e.duration || 1) * (e.cost || student.cost)),
    experimental: e.experimental || false
  }));
};

const listPayments = () => {
  const studentPayments = dataStore.studentPayments
    .map(payment => ({
      type: "payment",
      date: payment.date,
      value: payment.value || 0
  }));
  return studentPayments;
}

const report = computed(() => {
  if (!dataStore.selectedStudent) return "Nenhum aluno selecionado."

  const startDate = new Date(filterStart.value) 
  const endDate   = new Date(filterEnd.value)

  const events = listCompletedLessons()
  const payments = listPayments()

  const filteredEvents = events
    .filter(e => new Date(e.date) >= startDate && new Date(e.date) <= endDate)
    // .sort((a, b) => new Date(a.date) - new Date(b.date))

  const filteredPayments = payments
    .filter(p => new Date(p.date) >= startDate && new Date(p.date) <= endDate)
    // .sort((a, b) => new Date(a.date) - new Date(b.date))

  let balance = 0
  let report = ''
  let count = 0

  report += `<b>Aulas:</b><br>`
  if(filteredEvents.length){
    filteredEvents.forEach(e => {
      if (!e.experimental) count++
      balance += e.experimental ? 0 : e.value
      report += `${invertDateISO(e.date)} (${e.experimental ? "experimental" : (count + 'ª aula')}) - ${e.duration} hora${e.duration > 1 ? 's' : ''} - ${currency(e.experimental ? 0 : Math.abs(e.value))}<br>`
    })
  }
  else report += `Nenhuma aula dada<br>`

  report += `<br><b>Pagamentos:</b><br>`
  if(filteredPayments.length){
    filteredPayments.forEach(p => {
      balance += p.value
      report += `${invertDateISO(p.date)} - ${currency(p.value)}<br>`
    })
  }
  else report += `Nenhum pagamento<br>`

  report += `<br><b>Saldo total</b>: <span style="color:${balance < 0 ? 'var(--money-red)' : 'var(--money-green)'}">${currency(balance)}</span> (${balance >= 0 ? "crédito" : "débito"})`
  return report
})

const copyToClipboard = () => {
  const details = `<b>Aluno</b>: ${student.student_name}<br><br><b>Período</b>:<br>de ${invertDateISO(filterStart.value)} à ${invertDateISO(filterEnd.value)}<br><br>`

  const reportContent = (details + report.value)
    .replace(/<\/?b>/gi, "*") // Replace <b> tags with asterisks
    .replace(/<br\s*\/?>/gi, "\n") // Replace <br> and <br/> with newline
    .replace(/<[^>]+>/g, ""); // Remove any other HTML tags just in case

  navigator.clipboard.writeText(reportContent)
    .then(() => console.log('Report copied to clipboard!') )
    .catch(err => {
      console.error('Failure to copy to clipboard:', err);
      alert('Erro ao copiar o relatório.');
  });
}
</script>

<template>
  <div class="section">
    <h2>Relatório</h2>

    <div class="flexContainer">
      <label class="third">
        Aluno:
        <select name="aluno" v-model="dataStore.selectedStudent" required>
          <option value="" selected>Selecione um aluno</option>
          <option v-for="student in students" :key="student.id_student" :value="student.id_student">{{student.student_name}}</option>
        </select>
      </label>
      <label class="third">
        Início:
        <input class="dateFilter" type="text" placeholder="Data inicial" onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" v-model="filterStart" :max="filterEnd" />
      </label>
      <label class="third">
        Fim:
        <input class="dateFilter" type="text" placeholder="Data final"   onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" v-model="filterEnd" :min="filterStart" />
      </label>
    </div>

    <div v-if="dataStore.selectedStudent && filterStart && filterEnd" v-html="report"></div>
    <p v-else>Selecione nos campos acima.</p>

    <div class="flexContainer">
      <button @click="copyToClipboard()" :disabled="!dataStore.selectedStudent || !filterStart || !filterEnd">Copiar</button>
    </div>
  </div>
</template>