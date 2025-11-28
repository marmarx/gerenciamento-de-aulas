// import { eventValue } from '@/composables/eventValue'
import { useDataStore } from "@/stores/dataStore"
import { parseDate, fallbackNumber } from '@/composables/utility'
const dataStore = useDataStore()

// a || b -> 0, '', null and undefined are falsy and defaults to b
// a ?? b -> only null and undefined are falsy -> 0 and '' are truthy

const eventValue = (id) => {
  const e = dataStore.data.events.find(ev => ev.id_event === id)
  if (!e) return 0
  if (e.experimental) return 0

  let cancelationFee = 100
  
  const student = dataStore.data.students.find(s => s.id_student === e.id_student)
  const config = dataStore.data.config
  const fallBack = key => fallbackNumber(e, student, config, key)

  if (e.status === 'canceled') {
    if (!e.chargeCancelation) return 0    // event policy -> cancelations may not be charged
    if (!e.cancelationFee) return 0       // cancelation fee is 0% -> no charge
    if (!e.canceledAt) return 0           // buggy entry, safe guard

    const eventStart = parseDate(e.date, e.time).getTime()
    const grace = fallBack('freeCancelationBefore')
    
    const canceledEarly  = eventStart - e.canceledAt > (grace * 60 * 60 * 1000) // hours -> miliseconds
    if (canceledEarly) return 0         // within grace period

    cancelationFee = fallBack('cancelationFee')
  }

  const cost = fallBack('cost')
  if (!e.variableCost) return cost * (cancelationFee / 100)

  const duration = Number(e.duration) || Number(dataStore.data.config.duration) // 0 is not valid
  return duration * cost * (cancelationFee / 100)
}

export { eventValue }
