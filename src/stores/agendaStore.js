import { defineStore } from 'pinia'
import { watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { parseDate, dateISO } from '@/composables/utility'
import { useDataStore } from "@/stores/dataStore"

export const useAgendaStore = defineStore('agenda', () => {
  const dataStore = useDataStore()
  const students = computed(() => dataStore.sortedStudents)

  const autoCreateEvents     = computed(() => dataStore.sortedConfig.autoCreateEvents ?? false)
  const autoFinishEvents     = computed(() => dataStore.sortedConfig.autoFinishEvents ?? false)
  const autoRemovePastEvents = computed(() => dataStore.sortedConfig.autoRemovePastEvents ?? false)

  const numberOfDays         = computed(() => Number(dataStore.sortedConfig.numberOfDays ?? 0))
  const autoFinishOffset     = computed(() => Number(dataStore.sortedConfig.autoFinishOffset) ?? 30)
  const removalGraceHours    = computed(() => Number(dataStore.sortedConfig.removalGraceHours) ?? 48)


  // -- HELPER FUNCTIONS --
  const createGenKey = (e) => `${e.id_student}::${e.originalDate || e.date}::${e.originalTime || e.time}`

  const setNewEvent = (student, d, schedule) => {
    const newEvent = dataStore.newEvent()
    newEvent.id_student = student.id_student
    newEvent.student_name = student.student_name
    newEvent.date = d.dateISO
    newEvent.time = schedule.timeDay
    newEvent.originalDate = d.dateISO
    newEvent.originalTime = schedule.timeDay
    newEvent.subject = schedule.subject
    newEvent.status = 'scheduled'
    newEvent.added_manually = false

    newEvent.variableCost = (student.variableCost ?? dataStore.sortedConfig.variableCost ?? true)
    newEvent.duration = (student.duration ?? dataStore.sortedConfig.duration ?? 1)
    newEvent.cost = (student.cost ?? dataStore.sortedConfig.cost ?? 50)

    newEvent.minutesBefore = student.minutesBefore ?? dataStore.sortedConfig.minutesBefore ?? 15
    
    newEvent.chargeCancelation = (student.chargeCancelation ?? dataStore.sortedConfig.chargeCancelation ?? false)
    newEvent.freeCancelationBefore = (student.freeCancelationBefore ?? dataStore.sortedConfig.freeCancelationBefore ?? 1)
    newEvent.cancelationFee = (student.cancelationFee ?? dataStore.sortedConfig.cancelationFee ?? 50)

    newEvent.genKey = createGenKey(newEvent)
    return newEvent
  }


  // -- MAIN FUNCTIONS --

  // Auto-finish Events (single timeout scheduled to next threshold)
  let autoFinishTimeout = null

  const scheduleNextAutoFinish = () => {
    clearTimeout(autoFinishTimeout)

    if (!autoFinishEvents.value) return

    const now = new Date()
    let nextDelay = Infinity

    // Compute next timeout threshold
    dataStore.data.events.forEach(ev => {
      if (ev.status !== 'scheduled' || ev.deleted) return

      const student = students.value.find(s => s.id_student === ev.id_student)
      if (!student || student.paused) return

      const start = parseDate(ev.date, ev.time)
      const threshold = new Date(start.getTime() + autoFinishOffset.value * 60 * 1000)
      const overdue = threshold <= now
      if (overdue) { ev.status = 'done'; return }

      const delay = threshold - now
      if (delay < nextDelay) nextDelay = delay
    })

    if (nextDelay === Infinity) return  // No events? Nothing to schedule
    autoFinishTimeout = setTimeout(() => scheduleNextAutoFinish(), nextDelay)
  }

  const stopAutoFinish = () => {
    if (autoFinishTimeout) clearTimeout(autoFinishTimeout)
    autoFinishTimeout = null
  }


  // Remove scheduled events for paused students
  const pausedStudents = computed(() => students.value.filter(s => s.paused).map(s => s.id_student))

  const removeScheduledEventsForAllPausedStudents = () => {
    if (pausedStudents.value.length === 0) return
    dataStore.data.events = [...dataStore.data.events].filter(e => !(pausedStudents.value.includes(e.id_student) && e.status === 'scheduled'))
  }

  
  // Remove scheduled events for a single student (differential)
  const removeScheduledEventsForStudent = (id_student) => {
    if (!id_student) return
    dataStore.data.events = [...dataStore.data.events].filter(e => {
      if (e.id_student !== id_student) return true  // keep other students' events unchanged
      if (e.status !== 'scheduled') return true     // keep done and canceled events
      if (e.added_manually) return true             // keep manually added events
      return false
    })
  }


  // Strip undone past events (auto remove logic)
  const stripUndonePastEvents = () => {
    if (!autoFinishEvents.value && !autoRemovePastEvents.value) return

    const now = Date.now()
    dataStore.data.events = [...dataStore.data.events].filter(e => {
      if (e.added_manually) return true             // keep manual events
      if (e.status !== 'scheduled') return true     // keep canceled and done events

      const eventDate = parseDate(e.date, e.time || '23:59')
      const finishThreshold = eventDate.getTime() + (autoFinishOffset.value * 60 * 1000)

      const hoursOverdue = (now - finishThreshold) / (60 * 60 * 1000)
      const removalOverdue = hoursOverdue >= removalGraceHours.value
      if (removalOverdue && autoRemovePastEvents.value) return false
      // if (removalOverdue) return false

      return true
    })
  }


  // Generate weekly recurring events (idempotent)
  const generateEvents = () => {
    if (!autoCreateEvents.value) return
    if (!students.value.length) return

    const validGenKeys = new Set()
    const datesToCheck = []

    for (let d = 0; d <= numberOfDays.value; d++) {
      const date = new Date()
      date.setDate(date.getDate() + d)
      datesToCheck.push({ dateISO: dateISO(date), weekDay: date.getDay() })
    }

    const studentsWithSchedule = students.value.filter(s => Array.isArray(s.weekly_schedule) && s.weekly_schedule.length > 0)

    studentsWithSchedule.forEach(student => {
      if (student.paused) return // skip paused students

      student.weekly_schedule.forEach(schedule => {
        if (schedule.weekDay == null || !schedule.timeDay) return // skip empty schedule entries

        datesToCheck.forEach(d => {
          if (Number(schedule.weekDay) !== d.weekDay) return

          const genKey = `${student.id_student}::${d.dateISO}::${schedule.timeDay}`
          validGenKeys.add(genKey)

          // check if event with this genKey already exists
          const exists = dataStore.data.events.find(e => {
            if(!e.genKey) e.genKey = createGenKey(e)
            return e.genKey === genKey
          })
          if (exists) return  // skips -> event already exists

          const newEvent = setNewEvent(student, d, schedule)
          dataStore.data.events.push(newEvent)
        })
      })
    })

    // Remove auto-created events that are no longer valid (do NOT remove manual events)
    dataStore.data.events = [...dataStore.data.events].filter(e => {
      if (e.added_manually) return true                           // keep events added manually
      if (parseDate(e.date, e.time) < new Date()) return true     // keep past events
      if (!e.genKey) return true                                  // keep legacy events
      return validGenKeys.has(e.genKey)
    })
  }

  // Debounce generator invocations to batch multiple quick changes
  let genTimeout = null
  
  const scheduleGenerate = (delay = 100) => {
    if (genTimeout) clearTimeout(genTimeout)
    genTimeout = setTimeout(() => {
      generateEvents()
      stripUndonePastEvents()
      genTimeout = null
    }, delay)
  }


  // Generate events only for a single student (differential)
  const generateEventsForStudent = (id_student) => {
    if (!autoCreateEvents.value) return
    if (!id_student) return

    const student = students.value.find(s => s.id_student === id_student)
    if (!student) return
    if (student.paused) return

    // prepare date range
    const datesToCheck = []
    for (let d = 0; d <= numberOfDays.value; d++) {
      const date = new Date()
      date.setDate(date.getDate() + d)
      datesToCheck.push({ dateISO: dateISO(date), weekDay: date.getDay() })
    }

    // collect valid keys for this student only
    const validGenKeysForStudent = new Set()

    student.weekly_schedule.forEach(schedule => {
      if (schedule.weekDay == null || !schedule.timeDay) return
      
      datesToCheck.forEach(d => {
        if (Number(schedule.weekDay) !== d.weekDay) return

        const genKey = `${student.id_student}::${d.dateISO}::${schedule.timeDay}`
        validGenKeysForStudent.add(genKey)

        // check if event with this genKey already exists
        const exists = dataStore.data.events.find(e => {
          if(!e.genKey) e.genKey = createGenKey(e)
          return e.genKey === genKey
        })
        if (exists) return  // skips -> event already exists

        const newEvent = setNewEvent(student, d, schedule)
        dataStore.data.events.push(newEvent)
      })
    })

    // Remove obsolete auto-created events for this student only (keep manual and past events)
    dataStore.data.events = [...dataStore.data.events].filter(e => {
      if (e.id_student !== id_student) return true              // keep other student's events unchanged
      if (parseDate(e.date, e.time) < new Date()) return true   // keep past events
      if (e.added_manually) return true                         // keep events added manually
      if (!e.genKey) return true                                // keep legacy events
      return validGenKeysForStudent.has(e.genKey)
    })
  }


  // -- WATCHERS --

  // Watch studentsSignature and compute changed student IDs (differential)
  const studentSignature = (s) =>
    `${s.id_student}::${s.paused ? 1 : 0}::${(s.weekly_schedule || []).map(w => `${w.weekDay ?? ''}|${w.timeDay ?? ''}`).join(';')}`

  const studentsSignature = computed(() => students.value.map(s => studentSignature(s)).join('|'))

  watch(() => studentsSignature.value, (newSig, oldSig) => {
    if (!oldSig) return // onMounted handles initial generation
    if (newSig === oldSig) return

    const newArr = newSig.split('|')
    const oldArr = oldSig.split('|')

    const changedIds = []
    const minLen = Math.min(newArr.length, oldArr.length)

    for (let i = 0; i < minLen; i++) {
      if (newArr[i] !== oldArr[i]) {
        const id = newArr[i].split('::')[0]
        if (id) changedIds.push(id)
      }
    }

    // new students were added
    if (newArr.length > oldArr.length) {
      for (let i = oldArr.length; i < newArr.length; i++) {
        const id = newArr[i].split('::')[0]
        if (id) changedIds.push(id)
      }
    }
    // students were removed
    else if (oldArr.length > newArr.length) {
      for (let i = newArr.length; i < oldArr.length; i++) {
        const id = oldArr[i].split('::')[0]
        if (id) changedIds.push(id)
      }
    }

    const uniqueChanged = [...new Set(changedIds)]  // remove duplicates
    if (!uniqueChanged.length) return

    uniqueChanged.forEach(id => {
      removeScheduledEventsForStudent(id)
      generateEventsForStudent(id)
    })

    stripUndonePastEvents()
  })


  // Watch for config changes -> affect all students -> full generation
  const configSignature = computed(() => `${autoCreateEvents.value}::${autoRemovePastEvents.value}::${autoFinishEvents.value}::${autoFinishOffset.value}::${numberOfDays.value}::${removalGraceHours.value}`)

  watch(() => configSignature.value, () => {
      if (autoFinishEvents.value) scheduleNextAutoFinish()
      else stopAutoFinish()
      scheduleGenerate()
    }, { immediate: true }
  )
  

  // -- STARTUP --
  const bootup = () => {
    if (autoFinishEvents.value) scheduleNextAutoFinish()
    removeScheduledEventsForAllPausedStudents()
    scheduleGenerate(10)
  }

  onMounted(() => bootup())

  onBeforeUnmount(() => {
    stopAutoFinish()
    if (genTimeout) clearTimeout(genTimeout)
    if (autoFinishTimeout) clearTimeout(autoFinishTimeout)
  })

  return { bootup }
})
