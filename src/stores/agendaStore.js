import { defineStore } from 'pinia'
import { watch, watchEffect, computed, onMounted } from 'vue'
import { parseDate, dateISO } from '@/composables/utility'
import { useDataStore } from "@/stores/dataStore"

export const useAgendaStore = defineStore('agenda', () => {
  const dataStore = useDataStore()

  const numberOfDays         = computed(() => dataStore.data.config.numberOfDays || 0)
  const autoFinishEvents     = computed(() => dataStore.data.config.autoFinishEvents)
  const autoFinishOffset     = computed(() => Number(dataStore.data.config.autoFinishOffset) || 30)
  const autoRemovePastEvents = computed(() => dataStore.data.config.autoRemovePastEvents)
  const removalGraceHours    = computed(() => Number(dataStore.data.config.removalGraceHours) || 48)

  const students = computed(() => dataStore.data.students)
  const events   = computed(() => dataStore.data.events)


  //Autofinish events watcher
  const initAutoFinishWatcher = () => {
    let nextCheckTimeout = null

    const scheduleCheck = () => {
      if (!autoFinishEvents.value) return   // user disabled auto-finish

      const now = new Date()
      let nextCheckDelay = Infinity

      events.value.forEach(event => {
        if (event.status !== 'scheduled') return

        const student = students.value.find(s => s.id_student === event.id_student)
        if (!student || student.paused) return

        const eventDate = parseDate(event.date, event.time)
        const finishThreshold = new Date(eventDate.getTime() + autoFinishOffset.value * 60000)
        const isOverdue = finishThreshold <= now

        if (isOverdue) event.status = 'done' // overdue → mark done
        else {
          const delay = finishThreshold.getTime() - now.getTime()
          if (delay < nextCheckDelay) nextCheckDelay = delay
        }
      })

      clearTimeout(nextCheckTimeout)
      if (nextCheckDelay !== Infinity) nextCheckTimeout = setTimeout(scheduleCheck, nextCheckDelay)
    }

    watchEffect(() => {
      clearTimeout(nextCheckTimeout)
      scheduleCheck() // run now & whenever dependencies change
    })
  }

  // remove events for paused students
  const pausedIds = computed(() => students.value.filter(s => s.paused).map(s => s.id_student))
  const removeScheduledEventsForPausedStudents = () => {
    if (pausedIds.value.length === 0) return
    dataStore.data.events = dataStore.data.events.filter(e => !(pausedIds.value.includes(e.id_student) && e.status === 'scheduled'))
  }
  watch(pausedIds, removeScheduledEventsForPausedStudents, {immediate: true}


  // remove events that became overdue and haven't been marked as 'done' manually
  const stripUndonePastEvents = () => {
    if (!autoFinishEvents.value && !autoRemovePastEvents.value) return // won't run if both are turned off
    const now = new Date()

    dataStore.data.events = dataStore.data.events
      .map(e => {
        const eventDate = parseDate(e.date, e.time)
        const finishThreshold = new Date(eventDate.getTime() + autoFinishOffset.value * 60 * 1000) // minutes to hours

        const hoursOverdue = (now - finishThreshold) / (1000 * 60 * 60) // miliseconds to hours
        const removalOverdue = hoursOverdue >= removalGraceHours.value

        if (e.status === 'scheduled' && removalOverdue) return null
        return e
      })
      .filter(Boolean)
  }


  // generate weekly events
  const generateEvents = () => {
    if (!dataStore.data.config.autoCreateEvents) return
    if (!students.value.length) return

    const validEvents = []
    const datesToCheck = []

    for (let d = 0; d <= numberOfDays.value; d++) {
      const date = new Date()
      date.setDate(date.getDate() + d)
      datesToCheck.push({ date: dateISO(date), weekDay: date.getDay() })
    }

    const studentsWithSchedule = students.value.filter(s => s.weekly_schedule.length > 0)

    studentsWithSchedule.forEach(student => {
      if (student.paused) return
      student.weekly_schedule.forEach(schedule => {
        if (schedule.weekDay === null || !schedule.timeDay) return  // skip empty schedule entries

        datesToCheck.forEach(d => {
          if (parseInt(schedule.weekDay) === d.weekDay) {
            validEvents.push({
              id_student: student.id_student,
              date: d.date,
              time: schedule.timeDay,
              // originalDate: d.date,
              // originalTime: schedule.timeDay
            })

            const exists = events.value.find(e =>
              e.id_student === student.id_student &&
              d.date === (e.originalDate || e.date) &&
              schedule.timeDay === (e.originalTime || e.time)
            )

            if (!exists) {  // check if it already exists -> if not, create new event 'HERE'
              const newEvent = dataStore.newEvent()
              newEvent.id_student = student.id_student
              newEvent.student_name = student.student_name
              newEvent.date = d.date
              newEvent.time = schedule.timeDay
              newEvent.originalDate = d.date
              newEvent.originalTime = schedule.timeDay
              newEvent.subject = schedule.subject
              newEvent.status = 'scheduled'
              newEvent.duration = student.duration
              newEvent.cost = student.cost
              newEvent.added_manually = false

              newEvent.minutesBefore = student.minutesBefore || dataStore.data.config.minutesBefore || 15
              newEvent.duration = student.duration || dataStore.data.config.duration || 1
              newEvent.cost = student.cost || dataStore.data.config.cost || 50
              newEvent.variableCost = student.variableCost || dataStore.data.config.variableCost || true
              newEvent.chargeCancelation = student.chargeCancelation || dataStore.data.config.chargeCancelation || false
              newEvent.freeCancelationBefore = student.freeCancelationBefore || dataStore.data.config.freeCancelationBefore || 1
              newEvent.cancelationFee = student.cancelationFee || dataStore.data.config.cancelationFee || 50

              dataStore.data.events.push(newEvent)
            }
          }
        })
      })
    })

    dataStore.data.events = dataStore.data.events.filter(e => {
      if (e.added_manually) return true                   // keep all events added manually
      if (parseDate(e.date) < new Date()) return true     // keep all past events
      return validEvents.some(v =>
        v.id_student === e.id_student &&
        v.date === (e.originalDate || e.date) &&
        v.time === (e.originalTime || e.time)
      )
    })
  }


  const setupEventWatcher = () => {
    // Removes scheduled events for paused students
    watch(() => students.value.map(s => s.paused), () => {
      removeScheduledEventsForPausedStudents()
      generateEvents()
    }, { deep: true, immediate: true })

    // Create events if autoCreateEvents gets turned on - redudant with the watchEffect below, added for the sake or legibility
    watch(() => dataStore.data.config.autoCreateEvents, (newVal) => { if (newVal) generateEvents() }, { immediate: true } )

    // Re-run generators on config changes
    watchEffect(() => {
      // dependencies: schedules
      students.value.forEach(s => { s.weekly_schedule.map(item => `${item.weekDay ?? ''}|${item.timeDay ?? ''}|${item.subject ?? ''}`) })

      // dependencies: config toggles
      autoRemovePastEvents.value
      autoFinishEvents.value
      autoFinishOffset.value
      numberOfDays.value

      generateEvents()
      stripUndonePastEvents()
    })
  }

  onMounted(async () => {
    initAutoFinishWatcher()
    setupEventWatcher()
  })

  return { generateEvents }
})

