import { ref, watch, computed } from 'vue'
import { eventValue } from '@/composables/eventValue'
import { isValidDate, parseDate, filterRange, dateISO } from '@/composables/utility'

import { useDataStore } from '@/stores/dataStore'
const dataStore = useDataStore()

const today = new Date()
const year  = today.getFullYear()
const month = today.getMonth()

// previous month by default
const previousMonth = true
const filterStart = ref(dateISO(new Date(year, month - Number(previousMonth), 1)))
const filterEnd   = ref(dateISO(new Date(year, month - Number(previousMonth) + 1, 0)))
let updating = false

watch([filterStart, filterEnd], ([newStart, newEnd], [oldStart, oldEnd]) => {
  if (updating) return
  if (!newStart || !newEnd) return

  const start = parseDate(newStart)
  const end   = parseDate(newEnd)

  if (!isValidDate(start) || !isValidDate(end)) return
  if (start <= end) return

  updating = true
         if (newStart !== oldStart) filterEnd.value   = dateISO(start)  // start was changed → adjust end
    else if (newEnd !== oldEnd)     filterStart.value = dateISO(end)    // end was changed → adjust start
  setTimeout(() => updating = false, 50)
})

const startDate = computed(() => isValidDate(filterStart.value) ? filterStart.value : "2000-01-01")
const endDate   = computed(() => isValidDate(filterEnd.value)   ? filterEnd.value   : "3000-01-01")

// filter date range function
const filterDates = arr => filterRange(arr, startDate.value, endDate.value)

// filtered lists
const paymentsInRange  = computed(() => filterDates(dataStore.data.payments   || []))
const eventsInRange    = computed(() => filterDates(dataStore.data.events     || []))
const chargableInRange = computed(() => filterDates(dataStore.chargableEvents || []))

// number of paid events by student
const paidEvents = (cev, paymentSum) => {
  let paid = 0

  cev.forEach(e => {
    const eVal = eventValue(e.id_event)

    if (dataStore.data.config.chargeCancelations && eVal === 0) paid++
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

  dataStore.data.students.forEach(student => {
    const id = student.id_student
    const name = student.student_name

    const ev  = eventsInRange   .value.filter(e => e.id_student === id)
    const cev = chargableInRange.value.filter(e => e.id_student === id)
    const pay = paymentsInRange .value.filter(p => p.id_student === id)

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

  if(startMonth !== endMonth) return 0
  return Math.round( 100 * 100 * (currentRevenue.value - previousRevenue.value) / previousRevenue.value ) / 100
})

export {
  filterStart, filterEnd,
  eventsInRange, chargableInRange, paymentsInRange,
  studentStats, currentRevenue, revenueGrowth
}