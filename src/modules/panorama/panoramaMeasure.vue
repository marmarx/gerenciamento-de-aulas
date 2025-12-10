<script setup>
import { computed } from 'vue'
import { lang, currency } from '@/composables/utility'
import { eventsInRange, chargableInRange, paymentsInRange }  from '@/modules/panorama/dateFilter'
import { studentStats, currentRevenue, revenueGrowth } from '@/modules/panorama/panoramaStats'

//## Card 0 - Students - most reliable, most canceled and most outstanding ##
function findTopStudents(getValue) {
  if (!studentStats.value.length) return null

  let max = Math.max(...studentStats.value.map(s => getValue(s)))
  let names = studentStats.value.filter(s => getValue(s) === max).map(s => s.name)

  if (names.length === 0) return null
  if (names.length > 2) return null
  return names.join(', ')
}

const mostReliableStudent = computed(() => findTopStudents(s => s.done))
const mostSkippingStudent = computed(() => findTopStudents(s => s.total === 0 ? null : Number((s.canceled / s.total).toFixed(4))))
const mostOutstandingStud = computed(() => findTopStudents(s => s.outstanding))   // student with the greatest outstanding

//## Card 1 - Agenda: scheduled, re-scheduled, canceled and done appointments ##
const plannedEvents     = computed(() => eventsInRange.value.filter(e => e.status === 'scheduled'))
const rescheduledEvents = computed(() => eventsInRange.value.filter(e => e.rescheduled === true))
const canceledEvents    = computed(() => eventsInRange.value.filter(e => e.status === 'canceled'))
const completedEvents   = computed(() => eventsInRange.value.filter(e => e.status === 'done'))

//## Card 2 - Lessons: chargable, chargable and paid, chargable but unpaid ##
const chargable        = computed(() => chargableInRange.value.length)
const chargableAndPaid = computed(() => studentStats.value.reduce((sum, s) => sum + s.paid, 0))
const chargableUnpaid  = computed(() => studentStats.value.reduce((sum, s) => sum + s.unpaid, 0))

//## Card 3 - Totals: revenue (vs previous month), earned, outstanding balance
const totalEarned      = computed(() => paymentsInRange.value.reduce((t, p) => t + p.value, 0))
const totalOutstanding = computed(() => studentStats.value.filter(s => s.outstanding > 0).reduce((t, s) => t + s.outstanding, 0))

const growth = computed(() => `(${revenueGrowth.value > 0 ? '+' : ''}${revenueGrowth.value.toLocaleString(lang)}%)`)
</script>

<template>
  <div class="grid">

    <div class="indicard">
      <h3>Aluno</h3>
      <p v-if="mostReliableStudent">Assíduo: {{ mostReliableStudent }}</p>
      <p v-if="mostSkippingStudent">Ausente: {{ mostSkippingStudent }}</p>
      <p v-if="mostOutstandingStud && totalOutstanding">Devedor: {{ mostOutstandingStud }}</p>
      <p v-if="!mostReliableStudent && !mostSkippingStudent && !mostOutstandingStud">Nenhum insight</p>
    </div>

    <div class="indicard">
      <h3>Agenda</h3>
      <p>Agendadas: {{ plannedEvents.length }}</p>
      <!-- <p>Remarcadas: {{ rescheduledEvents.length }}</p> -->
      <p>Canceladas: {{ canceledEvents.length }}</p>
      <p>Finalizadas: {{ completedEvents.length }}</p>
    </div>

    <div class="indicard">
      <h3>Aulas</h3>
      <p>Total: {{ chargable }}</p>
      <p>Pagas: {{ chargableAndPaid }}</p>
      <p>Não pagas: {{ chargableUnpaid }}</p>
    </div>

    <div class="indicard">
      <h3>Renda</h3>
      <p>Faturado: {{ currency(currentRevenue) }} <span v-if="revenueGrowth" :class="{ up: revenueGrowth > 0, down: revenueGrowth < 0 }">{{ growth }}</span></p>
      <p>Recebido: <span class="up">{{ currency(totalEarned) }}</span></p>
      <p>Devido: <span class="down">{{ currency(totalOutstanding) }}</span></p>
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
.indicard. { border-left: 4px solid #e74c3c }

.up { color: var(--green) }
.down { color: var(--red) }
</style>
