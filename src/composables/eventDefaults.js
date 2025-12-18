import { watch, computed } from 'vue'
import { parseDate, dateISO, timeISO, isValidDate, fallbackNumber, fallbackBool } from '@/composables/utility'
import { useDataStore } from '@/stores/dataStore'

export function useEventDefaults(event) {
  const dataStore = useDataStore()
  const config = dataStore.sortedConfig
  let updating = false

  // BACKUP AND RESTORE CONTROL
  const backupEvent = {
    date: event.date,
    time: event.time,
    dateEnd: event.dateEnd,
    timeEnd: event.timeEnd,
  }

  const restoreEvent = () => {
    event.date    = backupEvent.date ?? event.originalDate ?? event.date
    event.time    = backupEvent.time ?? event.originalTime ?? event.time
    event.dateEnd = backupEvent.dateEnd ?? event.dateEnd
    event.timeEnd = backupEvent.timeEnd ?? event.timeEnd

    if (event.date === event.originalDate && event.time === event.originalTime) event.rescheduled = false
  }

  // FINISH EVENT
  const finishEvent = () => {
    updating = true
      const now = new Date()
      event.date = dateISO(now)
      event.time = timeISO(now)

      const end = new Date(now.getTime() + event.duration * 60 * 60 * 1000)
      event.dateEnd = dateISO(end)
      event.timeEnd = timeISO(end)

      event.status = 'done'
    setTimeout(() => updating = false, 50)
  }

  // INITIAL LOAD CORRECTION
  const initialUpdate = () => {
    const student = dataStore.sortedStudents.find(s => s.id_student === event.id_student)

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
      const end = parseDate(event.dateEnd || event.date, event.timeEnd || event.time)
      const duration = (end.getTime() - start.getTime()) / (60 * 60 * 1000)

      if (end <= start || event.duration !== duration ) {
        const newEnd = new Date(start.getTime() + event.duration * 60 * 60 * 1000)
        event.dateEnd = dateISO(newEnd)
        event.timeEnd = timeISO(newEnd)
      }
    setTimeout(() => updating = false, 50)
  }

  // OVERLAP DETECTION
  const overlapWarning = computed(() => {
    if (!event.date || !event.time || !event.dateEnd || !event.timeEnd) return false

    const startA = parseDate(event.date, event.time)
    const endA   = parseDate(event.dateEnd, event.timeEnd)

    if (startA.getTime() === endA.getTime()) endA = new Date(startA.getTime() + 60 * 1000) //edge case: event has 0 duration -> treat as 1 minute event

    return dataStore.sortedEvents.find(ev => {
      if (ev.id_event === event.id_event) return false            // ignore itself
      if (ev.status === 'canceled' || ev.deleted) return false     // ignore canceled or deleted events
      if (ev.date !== event.date) return false                    // must match same day to be considered overlapping
      if (!ev.date || !ev.time) return false                      // avoids crashes

      const startB = parseDate(ev.date, ev.time)
      let endB     = parseDate(ev.dateEnd || ev.date, ev.timeEnd || ev.time)

      if(endB <= startB) endB = new Date(startB.getTime() + ev.duration * 60 * 60 * 1000)

      return startA < endB && endA > startB
    }) || null
  })

  // CANCEL EVENT
  const cancelEvent = () => {
    if (event.status === 'canceled') {
      event.status = 'scheduled'
      event.canceledAt = null
    } else {
      event.status = 'canceled'
      event.canceledAt = Date.now()
    }
  }

  // DELETE EVENT
  const deleteEvent = () => {
    if (event.added_manually) dataStore.removeEvent(event.id_event) // it's safe to exclude events created by the user
    else event.deleted = true // we should only hide events created automatically, excluding them will cause conflict
  }

  // PREPARE EVENT FOR SAVE
  const saveEvent = () => {
    const student = dataStore.sortedStudents.find(s => s.id_student === event.id_student)
    const fallBackNum = key => fallbackNumber(event, student, config, key)
    const fallBackBol = key => fallbackBool(event, student, config, key)

    // new events
    if (!event.originalDate) {
      event.status = 'scheduled'
      event.originalDate = event.date
      event.originalTime = event.time

      event.cost = fallBackNum('cost')
      event.duration = fallBackNum('duration')
      event.freeCancelationBefore = fallBackNum('freeCancelationBefore')
      event.cancelationFee = fallBackNum('cancelationFee')
      event.minutesBefore = fallBackNum('minutesBefore')

      event.variableCost = fallBackBol('variableCost')
      event.chargeCancelation = fallBackBol('chargeCancelation')
    }

    // rescheduling detection
    event.rescheduled = event.date !== event.originalDate || event.time !== event.originalTime

    // auto-finish logic
    if (config.autoFinishEvents) {
      const eventDateTime = parseDate(event.date, event.time)
      const finishThreshold = new Date(eventDateTime.getTime() + Number(config.autoFinishOffset || 30) * 60 * 1000)
      if (finishThreshold <= new Date()) event.status = 'done'
    }
  }

  // WATCHERS
  // Change student -> load student defaults
  watch(() => event.id_student, (newId, oldId) => {
    const oldStudent = dataStore.sortedStudents.find(s => s.id_student === oldId)
    const newStudent = dataStore.sortedStudents.find(s => s.id_student === newId)
    if (!newStudent) return

    const fallBackNum = key => fallbackNumber(event, newStudent, config, key)
    const fallBackBol = key => fallbackBool(event, newStudent, config, key)

    // Use the old student’s values to detect if user changed them manually -> true: keep unchanged
    const check = key => event[key] === oldStudent?.[key] || event[key] == null

    const numKeys = ['cost', 'duration', 'freeCancelationBefore', 'cancelationFee', 'minutesBefore']
    numKeys.forEach(k => { if (check(k)) event[k] = fallBackNum(k) })

    if (check('variableCost')) event.variableCost = fallBackBol('variableCost')
    if (check('chargeCancelation')) event.chargeCancelation = fallBackBol('chargeCancelation')
  })

  // Change dateStart -> updates dateEnd and timeEnd, preserves duration and timeStart
  watch(() => event.date, (newVal, oldVal) => {
    if (updating || !newVal || !oldVal || !event.dateEnd) return
    if (!isValidDate(newVal) || !isValidDate(oldVal)) return

    updating = true
      const oldStart = parseDate(oldVal, event.time)
      const oldEnd = event.timeEnd
        ? parseDate(event.dateEnd, event.timeEnd)
        : new Date(oldStart.getTime() + event.duration * 60 * 60 * 1000)

      const diff = oldEnd.getTime() - oldStart.getTime()
      const newStart = parseDate(newVal, event.time)
      const newEnd = new Date(newStart.getTime() + diff)

      event.dateEnd = dateISO(newEnd)
      event.timeEnd = timeISO(newEnd)
    setTimeout(() => updating = false, 50)
  })

  // Change timeStart -> updates dateEnd and timeEnd, preserves duration and dateStart
  watch(() => event.time, newTime => {
    if (updating || !newTime) return

    updating = true
      const start = parseDate(event.date, newTime)
      if (!isValidDate(start)) return

      const end = new Date(start.getTime() + event.duration * 60 * 60 * 1000)
      event.dateEnd = dateISO(end)
      event.timeEnd = timeISO(end)
    setTimeout(() => updating = false, 50)
  })

  // Change duration -> updates dateEnd and timeEnd, preserves dateStart and timeStart
  watch(() => event.duration, newVal => {
    if (updating || !newVal) return

    updating = true
      const start = parseDate(event.date, event.time)
      if (!isValidDate(start)) return

      const end = new Date(start.getTime() + newVal * 60 * 60 * 1000)
      event.dateEnd = dateISO(end)
      event.timeEnd = timeISO(end)
    setTimeout(() => updating = false, 50)
  })

  // Change dateEnd or timeEnd -> updates duraion, preserves dateStart and timeStart
  watch([() => event.dateEnd, () => event.timeEnd], ([newDateEnd, newTimeEnd]) => {
    if (updating) return

    updating = true
      const start = parseDate(event.date, event.time)
      const end = parseDate(newDateEnd, newTimeEnd)
      if (!isValidDate(start) || !isValidDate(end)) return

      const diff = (end - start) / (60 * 60 * 1000)
      event.duration = diff
    setTimeout(() => updating = false, 50)
  })

  return {
    initialUpdate, saveEvent, 
    restoreEvent, finishEvent, cancelEvent, deleteEvent,
    overlapWarning
  }
}
