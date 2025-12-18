import { computed } from 'vue'
import { eventValue } from '@/composables/eventValue'
import { shortDateLabel, formatDuration, currency } from '@/composables/utility'
import { chargableInRange, doneInRange, paymentsInRange } from '@/modules/panorama/dateFilter'

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

const listChargableLessons = () => {
  const ev = dataStore.sortedConfig.canceledOnReport ? chargableInRange.value : doneInRange.value
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
  const studentPayments = paymentsInRange.value.filter(e => e.id_student === dataStore.selectedStudent)

  return studentPayments.map(p => ({
      type: "payment",
      date: p.date,
      value: p.value || 0
  }))
}

const report = computed(() => {
  if (!dataStore.selectedStudent) return "Nenhum aluno selecionado."

  // const previousEv = dataStore.sortedConfig.canceledOnReport ? dataStore.chargableEvents : dataStore.doneEvents
  // const previousEvents = previousEv.filter(e => parseDate(e.date) < startDate && e.id_student === dataStore.selectedStudent)
  // const previousPayments = payments.filter(p => parseDate(p.date) < startDate && e.id_student === dataStore.selectedStudent)

  // const previousBalance = 
  //     previousEvents.reduce((total, e) => total + (e.experimental ? 0 : e.value), 0) + 
  //   previousPayments.reduce((total, p) => total + p.value, 0)

  const filteredEvents = listChargableLessons()
  const filteredPayments = listPayments()

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

export { report }