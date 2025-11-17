<script setup>
const props = defineProps({ filterStart: { type: String, required: true }, filterEnd: { type: String, required: true } }) //event id
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
const dataStore = useDataStore()

import { lang, dateISO, currency } from '@/stores/utility'

const parseDate = (d, t = "00:00") =>  new Date(`${d}T${t}`)
const eventDate = e => parseDate(e.date, e.time)
const inRange = (date, start, end) => new Date(date) >= new Date(`${start}T00:00`) && new Date(date) <= new Date(`${end}T23:59`)  //returns true or false
const filterRange = arr => arr.filter(e => inRange(eventDate(e), props.filterStart, props.filterEnd))

//filtered lists
const eventsInRange   = computed(() => filterRange(dataStore.data.events || []))
const paymentsInRange = computed(() => filterRange(dataStore.data.payments || []))


//## Card 0 - Students - most reliable, most canceled and most outstanding ##
const studentStats = computed(() => {
  const stats = {}

  for (const e of eventsInRange.value) {
    const id = e.id_student
    if (!stats[id]) stats[id] = {name: e.student_name, planned: 0, done: 0, canceled: 0, total: 0}

    if (e.status === 'done') stats[id].done++
    else if (e.status === 'canceled') stats[id].canceled++
    else stats[id].planned++
    stats[id].total++
  }
  return stats
})

const mostCompletedLessonsStudent = computed(() => {
  let best = []
  let bestDone = -1

  for (const s of Object.values(studentStats.value)) {
    if (s.done > bestDone) {
      bestDone = s.done
      best = [s.name]
    }
    else if (s.done === bestDone) best.push(s.name)
  }

  if (best.length === 0) return null
  if(best.length > 2) return null
  return best.join(', ')
})

const mostCanceledStudent = computed(() => {
  let worst = []
  let worstRate = -1

  for (const s of Object.values(studentStats.value)) {
    if (s.total === 0) continue // skips to next entry

    const rate = (s.canceled / s.total).toFixed(4)

    if (rate > worstRate) {
      worstRate = rate
      worst = [s.name]
    }
    else if (rate === worstRate) worst.push(s.name)
  }

  if (worst.length === 0) return null
  if (worst.length > 2) return null
  return worst.join(', ')
})

const outstandingByStudent = computed(() => {
  const result = []

  dataStore.data.students.forEach(student => {
    const ev  = completedEvents.value.filter(e => e.id_student === student.id_student)
    const pay = paymentsInRange.value.filter(p => p.id_student === student.id_student)

    const eventSum = ev.reduce((t, e) => t + (e.experimental ? 0 : ((e.duration || 1) * (e.cost || student.cost))), 0)
    const paymentSum = pay.reduce((t, p) => t + p.value, 0)

    const id = student.id_student
    const name = student.student_name
    const outstanding = eventSum - paymentSum
    result.push({id, name, outstanding })
  })

  return result
})

const studentWithGreatestOutstanding = computed(() => {
  if (!outstandingByStudent.value.length) return null

  let maxOutstanding = Math.max(...outstandingByStudent.value.map(s => s.outstanding))
  let names = outstandingByStudent.value.filter(s => s.outstanding === maxOutstanding).map(s => s.name)

  if (names.length === 0) return null
  if (names.length > 2) return null
  return names.join(', ')
  //return `${names.join(', ')} (${currency(maxOutstanding)})`
})


//## Card 1 - Agenda: planned, re-scheduled, and canceled appointments ##
const plannedEvents     = computed(() => eventsInRange.value.filter(e => e.status === 'scheduled'))
const rescheduledEvents = computed(() => eventsInRange.value.filter(e => e.rescheduled === true))
const canceledEvents    = computed(() => eventsInRange.value.filter(e => e.status === 'canceled'))


//## Card 2 - Lessons: completed, completed and paid, completed but unpaid ##
const completedEvents   = computed(() => eventsInRange.value.filter(e => e.status === 'done'))

const lessonsCompletedAndPaid = computed(() => {
  let total = 0

  dataStore.data.students.forEach(student => {
    const ev  = completedEvents.value.filter(e => e.id_student === student.id_student)
    const pay = paymentsInRange.value.filter(p => p.id_student === student.id_student)

    let paymentSum = pay.reduce((t, p) => t + p.value, 0)

    ev.forEach(e => {
      paymentSum -= e.experimental ? 0 : ((e.duration || 1) * (e.cost || student.cost))
      if(paymentSum > 0) total++
    })
  })

  return total
})

const lessonsCompletedUnpaid = computed(() => completedEvents.value.length - lessonsCompletedAndPaid.value)

//## Card 3 - Totals: revenue (vs previous month), earned, outstanding balance
const totalRevenue     = computed(() => completedEvents.value.reduce((t, e) => t + (e.experimental ? 0 : ((e.duration || 1) * e.cost)), 0))
const totalEarned      = computed(() => paymentsInRange.value.reduce((t, p) => t + p.value, 0))
const totalOutstanding = computed(() => outstandingByStudent.value.filter(s => s.outstanding > 0).reduce((t, s) => t + s.outstanding, 0))

//Previous month
const month = computed(() => new Date(props.filterStart).getMonth())
const year  = computed(() => new Date(props.filterStart).getFullYear())

const startPM = computed(() => dateISO(new Date(year.value, month.value, 1)))
const endPM   = computed(() => dateISO(new Date(year.value, month.value + 1, 0)))

const filterRangePM = arr => arr.filter(e => inRange(eventDate(e), startPM.value, endPM.value))
const eventsInRangePM   = computed(() => filterRangePM(dataStore.data.events || []))
const completedEventsPM   = computed(() => eventsInRangePM.value.filter(e => e.status === 'done'))

const totalRevenuePM = computed(() => completedEventsPM.value.reduce((t, e) => t + (e.experimental ? 0 : ((e.duration || 1) * e.cost)), 0))
const revenueGrowth = computed(() => Math.round(10000*(totalRevenue.value - totalRevenuePM.value)/totalRevenuePM.value)/100)
const growth = computed(() => {
  if (revenueGrowth.value > 100) return null
  return `(${revenueGrowth.value > 0 ? '+' : ''}${revenueGrowth.value.toLocaleString(lang)}%)`
})
</script>

<template>
  <div class="grid">

    <div class="indicard">
      <h3>Aluno</h3>
      <p v-if="mostCompletedLessonsStudent">Assíduo: {{ mostCompletedLessonsStudent }}</p>
      <p v-if="mostCanceledStudent">Ausente: {{ mostCanceledStudent }}</p>
      <p v-if="studentWithGreatestOutstanding">Devedor: {{ studentWithGreatestOutstanding }}</p>
    </div>

    <div class="indicard">
      <h3>Agenda</h3>
      <p>Agendadas: {{ plannedEvents.length }}</p>
      <p>Remarcadas: {{ rescheduledEvents.length }}</p>
      <p>Canceladas: {{ canceledEvents.length }}</p>
    </div>

    <div class="indicard">
      <h3>Aulas</h3>
      <p>Finalizadas: {{ completedEvents.length }}</p>
      <p>Pagas: {{ lessonsCompletedAndPaid }}</p>
      <p>Não pagas: {{ lessonsCompletedUnpaid }}</p>
    </div>

    <div class="indicard">
      <h3>Renda</h3>
      <p>Faturado: {{ currency(totalRevenue) }} <span v-if="revenueGrowth" :class="{ up: revenueGrowth > 0, down: revenueGrowth < 0 }">{{ growth }}</span></p>
      <p>Recebido: <span class="up">{{ currency(totalEarned) }}</span></p>
      <p>Devedor: <span class="down">{{ currency(totalOutstanding) }}</span></p>
    </div>

  </div>
</template>

<style scoped>
.grid {
  display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  width: 100%; padding: 1rem 1.2rem; box-sizing: border-box
}
.indicard {
  display: flex; flex-direction: column; justify-content: center;
  padding: 1rem; border: none; border-radius: 14px;
  background: var(--table-odd); box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.indicard p, .indicard h3 { font-size: 1rem; margin: .5em 0; text-align: center }
.indicard.alert { border-left: 4px solid #e74c3c }

.up { color: var(--green) }
.down { color: var(--red) }
</style>
