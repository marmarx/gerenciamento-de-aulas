<script setup>
import inputToggle from '@/components/inputToggle.vue'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
const students = dataStore.sortedStudents || []

import { ref, computed } from 'vue'
import { showToast } from '@/composables/showToast'
import { filterRange, dateISO, shortDateLabel, formatDuration, currency } from '@/composables/utility'
import { eventValue } from '@/composables/eventValue'

const today = new Date()
const year  = today.getFullYear()
const month = today.getMonth()
const showCanceled = ref(true)

const filterStart = ref(dateISO(new Date(year, month - 1, 1)))
const filterEnd   = ref(dateISO(new Date(year, month, 0)))

const listChargableLessons = () => {
  const ev = showCanceled.value ? dataStore.chargableEvents : dataStore.doneEvents
  const events = ev.filter(e => e.id_student === dataStore.selectedStudent)

  return events.map(e => ({
    type: 'aula',
    date: e.date,
    duration: e.duration || 1,
    value: -eventValue(e.id_event),
    experimental: e.experimental || false,
    status: e.status
  }))
}

const listPayments = () => {
  const studentPayments = dataStore.studentPayments
    .map(payment => ({
      type: "payment",
      date: payment.date,
      value: payment.value || 0
  }))
  return studentPayments
}

const report = computed(() => {
  if (!dataStore.selectedStudent) return "Nenhum aluno selecionado."

  const events = listChargableLessons()
  const payments = listPayments()

  // const previousEvents = events.filter(e => parseDate(e.date) < startDate)
  // const previousPayments = payments.filter(p => parseDate(p.date) < startDate)

  // const previousBalance = 
  //   previousEvents.reduce((total, e) => total + (e.experimental ? 0 : e.value), 0) + 
  //   previousPayments.reduce((total, p) => total + p.value, 0)

  const filterDates = arr => filterRange(arr, filterStart.value, filterEnd.value)

  const filteredEvents = filterDates(events)
  const filteredPayments = filterDates(payments)

  let balance = 0 //previousBalance
  let report = ''
  let count = 0

  report += `<b>Aulas:</b><br>`
  if(filteredEvents.length){
    filteredEvents.forEach(e => {
      let text = ''

      if (e.status === 'canceled') text = '(cancelada)'
      else {
        if (e.experimental) text = '(experimental'
        else {
          count++
          text = `(${count}ª aula`
        }
        text += `, ${formatDuration(e.duration)})`
      }

      balance += e.experimental ? 0 : e.value
      report += `${shortDateLabel(e.date)} ${text} - ${currency(e.experimental ? 0 : Math.abs(e.value))}<br>`
    })
  }
  else report += `Nenhuma aula dada no período<br>`

  if(filteredPayments.length){
  report += `<br><b>Pagamentos:</b><br>`
    filteredPayments.forEach(p => {
      balance += p.value
      report += `${shortDateLabel(p.date)} - ${currency(p.value)}<br>`
    })
  }

  //if(previousBalance) report += `<br><b>Saldo anterior</b>: <span style="color:${previousBalance < 0 ? 'var(--red)' : 'var(--green)'}">${currency(previousBalance)}</span><br>`
  report += `<br><b>Total</b>: <span style="color:${balance < 0 ? 'var(--red)' : 'var(--green)'}">${currency(balance)}</span>`
  return report
})

const reportContent = computed(() => {
  const details = `<b>Aluno(a)</b>: ${dataStore.student.student_name}<br><br><b>Período</b>: de ${(filterStart.value)} à ${shortDateLabel(filterEnd.value)}<br><br>`

  return (details + report.value)
    .replace(/<\/?b>/gi, "*")       // Replace <b> tags with asterisks
    .replace(/<br\s*\/?>/gi, "\n")  // Replace <br> and <br/> with newline
    .replace(/<[^>]+>/g, "")       // Remove any other HTML tags just in case
})

const copyToClipboard = () => {
  navigator.clipboard.writeText(reportContent.value)
    .then(() => showToast('Relatório copiado para a área de transferência!') )
    .catch(err => {
      console.error('Failure to copy to clipboard:', err);
      showToast('Erro ao copiar o relatório.');
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

    <div class="container">
      <label>
        Aluno:
        <select name="aluno" v-model="dataStore.selectedStudent" required>
          <option value="" selected disabled>Selecione um aluno</option>
          <option v-for="student in students" :key="student.id_student" :value="student.id_student">{{student.student_name}}</option>
        </select>
      </label>

      <div class="flexContainer">
        <label class="half">
          Início:
          <input class="dateFilter" type="text" placeholder="Data inicial" onfocus="this.type='date'" onblur="if(!this.value) this.type='text'" v-model="filterStart" :max="filterEnd" />
        </label>
        <label class="half">
          Fim:
          <input class="dateFilter" type="text" placeholder="Data final"   onfocus="this.type='date'" onblur="if(!this.value) this.type='text'" v-model="filterEnd" :min="filterStart" />
        </label>
      </div>
    </div>

    <div class="container">
      <inputToggle v-model="dataStore.data.config.canceledOnReport">
        <template #title>{{ dataStore.data.config.canceledOnReport ? 'M' : 'Não m' }}ostrar aulas canceladas</template>
        <template #helpText>Aulas canceladas {{ dataStore.data.config.canceledOnReport ? '' : 'não ' }} serão mostradas no relatório.</template>
      </inputToggle>
      <hr/>
    </div>

    <div v-if="dataStore.selectedStudent && filterStart && filterEnd" v-html="report" style="line-height: 2em;"></div>
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