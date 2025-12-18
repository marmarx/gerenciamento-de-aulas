import { computed } from 'vue'
import { eventValue } from '@/composables/eventValue'
import { parseDate, filterRange, dateISO } from '@/composables/utility'
import { startDate, endDate, eventsInRange, chargableInRange, paymentsInRange } from '@/modules/panorama/dateFilter'

import { useDataStore } from '@/stores/dataStore'
const dataStore = useDataStore()

// number of paid events by student
const paidEvents = (cev, paymentSum) => {
  let paid = 0

  cev.forEach(e => {
    const eVal = eventValue(e.id_event)

    if (dataStore.sortedConfig.chargeCancelations && eVal === 0) paid++
    else {
      paymentSum -= eVal
      if (paymentSum >= 0) paid++
    }
  })
  return paid
}

// stats by student
const studentStats = computed(() => {
  const stats = []

  dataStore.sortedStudents.forEach(student => {
    const id = student.id_student
    const name = student.student_name

    const ev  =    eventsInRange.value.filter(e => e.id_student === id)
    const cev = chargableInRange.value.filter(e => e.id_student === id)
    const pay =  paymentsInRange.value.filter(p => p.id_student === id)

    const scheduled   = ev.filter(e => e.status === 'scheduled').length
    const rescheduled = ev.filter(e => e.rescheduled === true).length
    const done        = ev.filter(e => e.status === 'done').length
    const canceled    = ev.filter(e => e.status === 'canceled').length
    const total = ev.length

    const eventSum    = cev.reduce((t, e) => t + eventValue(e.id_event), 0)
    const paymentSum  = pay.reduce((t, p) => t + p.value, 0)
    const outstanding = eventSum - paymentSum

    const chargable = cev.length
    const paid = paidEvents(cev, paymentSum)
    const unpaid = chargable - paid

    stats.push({
      id, name,
      scheduled, rescheduled, canceled, done, total,
      chargable, paid, unpaid,
      eventSum, paymentSum, outstanding
    })
  })

  return stats
})

// total revenue for current and previous month
const datePryer = (str) => {
  const year  = parseDate(str).getFullYear()
  const month = parseDate(str).getMonth()
  return [ year, month ]
}

const monthRange = (offset) => {
  const [ yearStart, monthStart ] = datePryer(startDate.value)
  const [ yearEnd, monthEnd ]     = datePryer(endDate.value)

  const start = dateISO(new Date(yearStart, monthStart + offset, 1))  // day 1 of monthStart
  const end   = dateISO(new Date(yearEnd, monthEnd + offset + 1, 0))  // last day of previous month (month = monthEnd + 1)
  return { start, end }
}

const revenueFor = (offset) => {
  const { start, end } = monthRange(offset)
  const filterDates = arr => filterRange(arr, start, end)

  const filteredEvents = filterDates(dataStore.chargableEvents || [])
  return filteredEvents.reduce((t, e) => t + eventValue(e.id_event), 0)
}

const currentRevenue  = computed(() => revenueFor(0))
const previousRevenue = computed(() => revenueFor(-1))

const revenueGrowth = computed(() => {
  const startMonth = parseDate(startDate.value).getMonth()
  const endMonth   = parseDate(endDate.value).getMonth()

  if(startMonth !== endMonth) return null

  const growth = Math.round( 100 * 100 * (currentRevenue.value - previousRevenue.value) / previousRevenue.value ) / 100
  if (growth === Infinity || growth === -Infinity) return null
  return growth
})

export { studentStats, currentRevenue, revenueGrowth }