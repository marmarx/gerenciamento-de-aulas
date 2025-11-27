import { watch } from 'vue'
import { parseDate, dateISO, timeISO, isValidDate, fallbackNumber, fallbackBool } from '@/composables/utility'
import { useDataStore } from '@/stores/dataStore'

export function useEventDefaults(event) {
  const dataStore = useDataStore()
  const config = dataStore.data.config
  let updating = false

  // update minutesBefore, cost, duration upon changing student
  watch(() => event.id_student, (newId, oldId) => {
    const oldStudent = dataStore.data.students.find(s => s.id_student === oldId)
    const newStudent = dataStore.data.students.find(s => s.id_student === newId)

    if (!newStudent) return

    const fallBackNum = key => fallbackNumber(event, newStudent, config, key)
    const fallBackBol = key =>   fallbackBool(event, newStudent, config, key)

    // Use the old student’s values to detect if user changed them manually -> true: keep unchanged
    const check = key => event[key] === oldStudent?.[key] || event[key] == null
    const numKeys = ['cost', 'duration', 'freeCancelationBefore', 'cancelationFee', 'minutesBefore']

    numKeys.forEach(key => {if(check(key)) event[key] = fallBackNum(key)})

    if (check('variableCost')) event.variableCost = fallBackBol('variableCost')
    if (check('chargeCancelation')) event.chargeCancelation = fallBackBol('chargeCancelation')
  })

  // change dateEnd and timeEnd upon changing start date, preserves duration
  watch(() => event.date, (newVal, oldVal) => {
    if (updating) return
    if (!newVal || !oldVal || !event.dateEnd) return
    if (!isValidDate(newVal) || !isValidDate(oldVal)) return

    updating = true
    const oldStart = parseDate(oldVal, event.time)

    let oldEnd
    if (event.timeEnd) oldEnd = parseDate(event.dateEnd, event.timeEnd)
    else if (event.duration) oldEnd = new Date(oldStart.getTime() + event.duration * 60 * 60 * 1000)
    else oldEnd = parseDate(event.dateEnd, event.time)

    const diff = oldEnd.getTime() - oldStart.getTime()
    const newStart = parseDate(newVal, event.time)
    const newEnd = new Date(newStart.getTime() + diff)

    event.dateEnd = dateISO(newEnd)
    event.timeEnd = timeISO(newEnd)

    setTimeout(() => updating = false, 50) // to avoid immediate retriggering
  })

  // change dateEnd and timeEnd upon changing start time, preserves duration
  watch(() => event.time, (newVal, _) => {
    if (updating) return
    if (!newVal) return
    updating = true

    const start = parseDate(event.date, newVal)
    if (!isValidDate(start)) return
    const end = new Date(start.getTime() + event.duration * 60 * 60 * 1000)

    event.dateEnd = dateISO(end)
    event.timeEnd = timeISO(end)

    setTimeout(() => updating = false, 50) // to avoid immediate retriggering
  })

  // change dateEnd and timeEnd upon changing duration, preserves date and time
  watch(() => event.duration, (newVal, _) => {
    if (updating) return
    if (!newVal) return
    updating = true

    const start = parseDate(event.date, event.time)
    if (!isValidDate(start)) return
    const end = new Date(start.getTime() + newVal * 60 * 60 * 1000)

    event.dateEnd = dateISO(end)
    event.timeEnd = timeISO(end)

    setTimeout(() => updating = false, 50) // to avoid immediate retriggering
  })

  // change duration upon changing dateEnd or timeEnd
  watch([() => event.dateEnd, () => event.timeEnd], ([newDateEnd, newTimeEnd], [_, __]) => {
    if (updating) return
    updating = true
    
    const start = parseDate(event.date, event.time)
    const end = parseDate(newDateEnd, newTimeEnd)
    if (!isValidDate(start) || !isValidDate(end)) return

    const diffMinutes = (end.getTime() - start.getTime()) / (60 * 1000)
    event.duration = diffMinutes / 60

    setTimeout(() => updating = false, 50) // to avoid immediate retriggering
  })

  // finish event at the current moment (date and time), preserves duration
  const finishEvent = () => {
    updating = true
    const now = new Date()
    event.date = dateISO(now) // YYYY-MM-DD format
    event.time = timeISO(now) // HH:mm

    const end = new Date(now.getTime() + event.duration * 60 * 60 * 1000)
    event.dateEnd = dateISO(end)
    event.timeEnd = timeISO(end)

    event.status = 'done'
    setTimeout(() => updating = false, 50)
  }

  // added due to the recent changes in the data structure - added properties: dateEnd, timeEnd, etc - maybe removed on future updates
  const initialUpdate = () => {
    const student = dataStore.data.students.find(s => s.id_student === event.id_student)
    const config = dataStore.data.config

    const fallBackNum = key => fallbackNumber(event, student, config, key)
    const fallBackBol = key =>   fallbackBool(event, student, config, key)

    updating = true
      event.cost           = fallBackNum('cost')
      event.duration       = fallBackNum('duration')
      event.variableCost   = fallBackBol('variableCost')

      event.chargeCancelation      = fallBackBol('chargeCancelation')
      event.freeCancelationBefore  = fallBackNum('freeCancelationBefore')
      event.cancelationFee         = fallBackNum('cancelationFee')

      event.minutesBefore  = fallBackNum('minutesBefore')

      const start = parseDate(event.date, event.time)
      const end = new Date(start.getTime() + event.duration * 60 * 60 * 1000)
      event.dateEnd = event.dateEnd || dateISO(end)
      event.timeEnd = event.timeEnd || timeISO(end)
    setTimeout(() => updating = false, 50)
  }

  return { finishEvent, initialUpdate }
}