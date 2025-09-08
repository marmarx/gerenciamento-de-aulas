import { defineStore } from 'pinia'
import { watch, computed, watchEffect } from 'vue'
import { dateISO, formatTime } from '@/stores/utility'
import { useDataStore } from "@/stores/dataStore"

export const useAgendaStore = defineStore('agenda', () => {
  const dataStore = useDataStore()
  const numberOfDays = computed(() => dataStore.data.config.numberOfDays || 0)
  const autoFinishEvents = computed(() => dataStore.data.config.autoFinishEvents)
  const autoFinishOffset = computed(() => !isNaN(dataStore.data.config.autoFinishOffset) ? Number(dataStore.data.config.autoFinishOffset) : 30)
  const autoRemovePastEvents = computed(() => dataStore.data.config.autoRemovePastEvents)

  const activeStudents = dataStore.activeStudents
  const sortedEvents = dataStore.sortedEvents

  //Autofinish events watcher
  const initAutoFinishWatcher = () => {
    let timeoutId

    watchEffect(() => {
      if (!autoFinishEvents.value) return
      const scheduleCheck = () => {
        const now = new Date()
        let nextCheckDelay = Infinity

        activeStudents.forEach(s => {
          if (s.paused || s.weekly_schedule.length === 0) return

          sortedEvents.forEach(event => {
            if (event.status !== 'scheduled') return
            const eventDateTime = new Date(`${event.date}T${formatTime(event.time)}`)
            const finishThreshold = new Date(eventDateTime.getTime() + Number(autoFinishOffset.value) * 60 * 1000)

            if (finishThreshold <= now) event.status = 'done' // overdue → mark done immediately
            else {
              const delay = finishThreshold.getTime() - now.getTime()
              if (delay < nextCheckDelay) nextCheckDelay = delay
            }
          })
        })

        clearTimeout(timeoutId)
        if (nextCheckDelay !== Infinity) timeoutId = setTimeout(scheduleCheck, nextCheckDelay)
      }
      scheduleCheck() // run immediately whenever dependencies change
    })
  }

  // Generate events function
  const generateEvents = () => {
    if (!dataStore.data.students || dataStore.data.students.length === 0) return
    const studentsWithSchedule = activeStudents.filter(s => s.weekly_schedule.length > 0)
    const validEvents = [] // keep a map of valid events that *should* exist

    const datesToCheck = []
    for (let d = 0; d <= numberOfDays.value; d++) {
      const date = new Date(new Date().setDate(new Date().getDate() + d))
      datesToCheck.push({ date: dateISO(date), weekDay: date.getDay() })
    }

    studentsWithSchedule.forEach(student => {
      student.weekly_schedule.forEach(schedule => {
        if (!schedule.weekDay || !schedule.timeDay) return // skip empty schedule entries
        datesToCheck.forEach(d => {
          if (parseInt(schedule.weekDay) === d.weekDay) {
            validEvents.push({
              id_student: student.id_student,
              date: d.date,
              time: schedule.timeDay,
              originalDate: d.date,
              originalTime: schedule.timeDay
            })

            const exists = dataStore.sortedEvents.find(e =>
              e.id_student === student.id_student &&
              d.date === (e.originalDate || e.date) &&
              schedule.timeDay === (e.originalTime || e.time)
            )

            if (!exists) {  // check if it already exists
              const newEvent = dataStore.newEvent() // create new event
              newEvent.added_on = new Date()
              newEvent.id_student = student.id_student
              newEvent.student_name = student.student_name
              newEvent.date = d.date
              newEvent.time = schedule.timeDay
              newEvent.originalDate = d.date
              newEvent.originalTime = schedule.timeDay
              newEvent.subject = schedule.subject
              newEvent.cost = student.cost
              newEvent.added_manually = false
              newEvent.status = 'scheduled'
              dataStore.data.events.push(newEvent)
              // console.log(`Creating event ${newEvent.id_event}`)
            }
          }
        })
      })
    })

    // Cleanup: remove invalid future events only
    dataStore.data.events = dataStore.data.events.filter(e => {
      if (e.added_manually) return true // keep all events added manually
      if (new Date(e.date) < new Date()) return true // keep all past events
      return validEvents.some(v =>
        v.id_student === e.id_student &&
        v.date === (e.originalDate || e.date) &&
        v.time === (e.originalTime || e.time)
      )
    })
  }

  const stripUndonePastEvents = () => {
    const today = new Date()
    dataStore.data.events = dataStore.data.events
      .map(e => {
        if (new Date(e.date) < today) {
          if (autoFinishEvents.value && e.status !== 'done') e.status = 'done'
          if (autoRemovePastEvents.value && e.status !== 'done') return null
        }
        return e
      })
      .filter(Boolean) // remove nulls (only when autoRemovePastEvents applies)
  }


  //Generate events watcher
  const setupEventWatcher = () => {
    // re-run when numberOfDays changes
    watch(() => numberOfDays.value, (newVal, oldVal) => { if (newVal > 0 && newVal > oldVal) generateEvents() }, { immediate: true } )

    // re-run when schedules change
    watchEffect(() => {
      // dependencies: schedules
      activeStudents.forEach(s => s.weekly_schedule)

      // dependencies: config toggles
      autoRemovePastEvents.value
      autoFinishEvents.value
      autoFinishOffset.value
      numberOfDays.value

      // trigger logic
      generateEvents()
      stripUndonePastEvents()
    })
  }

  return { initAutoFinishWatcher, setupEventWatcher, generateEvents }
})