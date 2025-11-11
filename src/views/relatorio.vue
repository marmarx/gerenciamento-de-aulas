<script setup>
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
const students = dataStore.sortedStudents || []

import { ref, computed } from 'vue'
import { dateISO, invertDateISO, currency } from '@/stores/utility'
const today = new Date();
const year  = today.getFullYear();
const month = today.getMonth();
const filterStart = ref(dateISO(new Date(year, month - 1, 1)))
const filterEnd   = ref(dateISO(new Date(year, month, 0)))

const listCompletedLessons = () => {
  const events = dataStore.doneEvents.filter(e => e.id_student === dataStore.selectedStudent);

  return events.map(e => ({
    type: 'aula',
    date: e.date,
    duration: e.duration || 1,
    value: e.experimental ? 0 : (-(e.duration || 1) * (e.cost || dataStore.student.cost)),
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

  // const previousEvents = events.filter(e => new Date(e.date) < startDate)
  // const previousPayments = payments.filter(p => new Date(p.date) < startDate)

  // const previousBalance = 
  //   previousEvents.reduce((total, e) => total + (e.experimental ? 0 : e.value), 0) + 
  //   previousPayments.reduce((total, p) => total + p.value, 0)

  const filteredEvents = events
    .filter(e => new Date(e.date) >= startDate && new Date(e.date) <= endDate)
    // .sort((a, b) => new Date(a.date) - new Date(b.date))

  const filteredPayments = payments
    .filter(p => new Date(p.date) >= startDate && new Date(p.date) <= endDate)
    // .sort((a, b) => new Date(a.date) - new Date(b.date))

  let balance = 0 //previousBalance
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
  else report += `Nenhuma aula dada no período<br>`

  if(filteredPayments.length){
  report += `<br><b>Pagamentos:</b><br>`
    filteredPayments.forEach(p => {
      balance += p.value
      report += `${invertDateISO(p.date)} - ${currency(p.value)}<br>`
    })
  }

  //if(previousBalance) report += `<br><b>Saldo anterior</b>: <span style="color:${previousBalance < 0 ? 'var(--money-red)' : 'var(--money-green)'}">${currency(previousBalance)}</span><br>`
  report += `<br><b>Total</b>: <span style="color:${balance < 0 ? 'var(--money-red)' : 'var(--money-green)'}">${currency(balance)}</span>`
  return report
})

const reportContent = computed(() => {
  const details = `<b>Aluno</b>: ${dataStore.student.student_name}<br><br><b>Período</b>: de ${invertDateISO(filterStart.value)} à ${invertDateISO(filterEnd.value)}<br><br>`

  return (details + report.value)
    .replace(/<\/?b>/gi, "*")       // Replace <b> tags with asterisks
    .replace(/<br\s*\/?>/gi, "\n")  // Replace <br> and <br/> with newline
    .replace(/<[^>]+>/g, "")       // Remove any other HTML tags just in case
})

const copyToClipboard = () => {
  navigator.clipboard.writeText(reportContent.value)
    .then(() => console.log('[Relatorio] Report copied to clipboard!') )
    .catch(err => {
      console.error('Failure to copy to clipboard:', err);
      alert('Erro ao copiar o relatório.');
  });
}

const sendParent = (parent, phone) => {
  const message = `Olá, ${parent},\nSegue o fechamento do pacote de aulas:\n\n${reportContent.value}`
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
}
</script>

<template>
  <div class="section">
    <h2>Relatório</h2>

    <div class="flexContainer">
      <label class="third">
        Aluno:
        <select name="aluno" style="text-align: center" v-model="dataStore.selectedStudent" required>
          <option value="" selected disabled>Selecione um aluno</option>
          <option v-for="student in students" :key="student.id_student" :value="student.id_student">{{student.student_name}}</option>
        </select>
      </label>
      <label class="third">
        Início:
        <input class="dateFilter" type="text" placeholder="Data inicial" onfocus="this.type='date'" onblur="if(!this.value) this.type='text'" v-model="filterStart" :max="filterEnd" />
      </label>
      <label class="third">
        Fim:
        <input class="dateFilter" type="text" placeholder="Data final"   onfocus="this.type='date'" onblur="if(!this.value) this.type='text'" v-model="filterEnd" :min="filterStart" />
      </label>
    </div>

    <div v-if="dataStore.selectedStudent && filterStart && filterEnd" v-html="report"></div>
    <p v-else>Selecione nos campos acima.</p>

    <div class="flexContainer">
      <button @click="copyToClipboard()" :disabled="!dataStore.selectedStudent || !filterStart || !filterEnd">Copiar</button>

      <button v-if="dataStore.student.parent && dataStore.student.parent_phone" :disabled="!dataStore.selectedStudent || !filterStart || !filterEnd"
        @click="sendParent(dataStore.student.parent, dataStore.student.parent_phone)">
        Enviar para {{ dataStore.student.parent }}
      </button>

      <button v-if="dataStore.student.parent_2 && dataStore.student.parent_2_phone" :disabled="!dataStore.selectedStudent || !filterStart || !filterEnd"
        @click="sendParent(dataStore.student.parent_2, dataStore.student.parent_2_phone)">
        Enviar para {{ dataStore.student.parent_2 }}
      </button>
    </div>
  </div>
</template>