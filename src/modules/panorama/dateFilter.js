import { ref, watch, computed } from 'vue'
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
    else if (newEnd !== oldEnd)     filterStart.value = dateISO(end)    //   end was changed → adjust start
  setTimeout(() => updating = false, 50)
})

const startDate = computed(() => isValidDate(filterStart.value) ? filterStart.value : "2025-01-01")
const endDate   = computed(() => isValidDate(filterEnd.value)   ? filterEnd.value   : "2125-01-01")

// filter date range function
const filterDates = arr => filterRange(arr, startDate.value, endDate.value)

// filtered lists
const eventsInRange    = computed(() => filterDates(dataStore.sortedEvents    || []))
const chargableInRange = computed(() => filterDates(dataStore.chargableEvents || []))
const doneInRange      = computed(() => filterDates(dataStore.doneEvents      || []))
const paymentsInRange  = computed(() => filterDates(dataStore.sortedPayments  || []))

export {
  filterStart, filterEnd,
  startDate, endDate,
  eventsInRange, chargableInRange, doneInRange, paymentsInRange
}