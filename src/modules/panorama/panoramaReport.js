import { computed } from 'vue'
import { eventValue } from '@/composables/eventValue'
import { shortDateLabel } from '@/composables/helpers/helpers.date'
import { formatDuration } from '@/composables/helpers/helpers.time'
import { currency } from '@/composables/helpers/helpers.text'
import { chargableInRange, doneInRange, paymentsInRange, previousChargable, previousDone, previousPayments } from '@/modules/panorama/dateFilter'

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

const previousBalance = () => {
  if (!dataStore.sortedConfig.paymentsOnReport) return 0  

  const prevEv  = dataStore.sortedConfig.canceledOnReport ? previousChargable.value : previousDone.value
  const prevPay = previousPayments.value

  const prevEvents   =  prevEv.filter(e => e.id_student === dataStore.selectedStudent)
  const prevPayments = prevPay.filter(p => p.id_student === dataStore.selectedStudent)

  const sumEv  =   prevEvents.reduce((total, e) => total + (e.experimental ? 0 : eventValue(e.id_event)), 0)
  const sumPay = prevPayments.reduce((total, p) => total + p.value, 0)

  return sumPay - sumEv
}

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
  const studentPayments = paymentsInRange.value.filter(p => p.id_student === dataStore.selectedStudent)

  return studentPayments.map(p => ({
      type: "payment",
      date: p.date,
      value: p.value || 0
  }))
}

const report = computed(() => {
  if (!dataStore.selectedStudent) return "Nenhum aluno selecionado."

  const filteredEvents = listChargableLessons()
  const filteredPayments = listPayments()

  let balance = previousBalance()
  let report = ''
  let count = 0

  if (dataStore.sortedConfig.paymentsOnReport) report += 
    `<b>Saldo anterior</b>: <span style="color:${balance < 0 ? 'var(--red)' : 'var(--green)'}">${currency(balance)}</span><br/><br/>`

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

  if(dataStore.sortedConfig.paymentsOnReport && filteredPayments.length){
  report += `<br><b>Pagamentos:</b><br>`
    filteredPayments.forEach(p => {
      balance += p.value
      report += `${shortDateLabel(p.date)} - ${currency(p.value)}<br>`
    })
  }

  report += `<br><b>Total</b>: <span style="color:${balance < 0 ? 'var(--red)' : 'var(--green)'}">${currency(balance)}</span>`
  return report
})

export { report }