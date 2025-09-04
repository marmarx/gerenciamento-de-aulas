<script setup>
import cardEvent from '@/components/cardEvent.vue'
import { computed, watch } from 'vue'

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
const numberOfDays = computed(() => dataStore.data.config.numberOfDays || 0)
const nextDaysTitle = computed(() => numberOfDays.value === 1 ? 'Amanhã' : `Próximos ${numberOfDays.value} dias`)
const lastDate = computed(() => new Date(new Date().setDate(new Date().getDate() + numberOfDays.value)))
const autoFinishOffset = Number(dataStore.data.config.autoFinishOffset);
const offset = computed(() => isNaN(autoFinishOffset) ? 60 : autoFinishOffset)

// Generate list of new events
const generateEvents = () => {
  const studentsWithSchedule = dataStore.activeStudents.filter(s => s.weekly_schedule.length > 0)
  const existingEvents = dataStore.sortedEvents.map(l => ({ id_student: l.id_student, date: l.date, time: l.time, originalDate: l.originalDate, originalTime: l.originalTime }))
  
  const datesToCheck = []
  for (let d = 0; d <= numberOfDays.value; d++) {
    const date = new Date(new Date().setDate(new Date().getDate() + d))
    datesToCheck.push({ date: dateISO(date), weekDay: date.getDay() })
  }

  studentsWithSchedule.forEach(student => {
    student.weekly_schedule.forEach(schedule => {
      if (schedule.weekDay === '' || schedule.timeDay === '') return //skip empty schedule entries
      datesToCheck.forEach(d => {
        if (parseInt(schedule.weekDay) === d.weekDay) {
          // check if event already exists
          if (!existingEvents.find(e => student.id_student === e.id_student && d.date === (e.originalDate || e.date) && schedule.timeDay === (e.originalTime || e.time))) {
            // create new event
            const newEvent = dataStore.newEvent()
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
}
generateEvents()

watch(() => numberOfDays, (newVal, oldVal) => {
  if (newVal > 0 && newVal > oldVal) generateEvents()
}, { immediate: true } )

import { today, dateISO, formatTime } from '@/stores/utility';
// Auto add events
const autoFinishEvents = () => {
  if (!dataStore.data.config.autoFinishEvents) return;
  const now = new Date();
  dataStore.sortedStudents.forEach(s => {
    if (s.paused || s.weekly_schedule.length === 0) return;
    dataStore.sortedEvents.forEach(event => {
      if (event.status !== 'scheduled') return;
      const eventDateTime = new Date(`${event.date}T${formatTime(event.time)}`);
      const finishThreshold = new Date(eventDateTime.getTime() + Number(offset) * 60 * 1000)  //hour offset
      if (finishThreshold <= now) event.status = 'done'
    });
  });
};
autoFinishEvents()

// Strip undone past events (canceled and scheduled)
const stripUndonePastEvents = () => {
  if (!dataStore.data.config.autoRemovePastEvents) return
  dataStore.data.events = dataStore.data.events.filter(l => l.status === 'done' || l.date >= dateISO(new Date()))
}
stripUndonePastEvents()

const eventsToday = computed(() => dataStore.undoneEvents.filter(l => l.date === dateISO(today())))
const eventsNextDays = computed(() => dataStore.undoneEvents.filter(l => l.date > dateISO(today()) && l.date <= dateISO(lastDate.value)))
</script>

<template>
  <div class="section">
    <div class="agenda">
      <h2>Hoje</h2>
      <div v-if="eventsToday.length" class="container grid">
        <cardEvent v-for="event in eventsToday" :key="event.id_event" :id="event.id_event" :add="true" />
      </div>
      <p class="tac" v-else>Nenhuma aula para hoje :)</p>
    </div>
      
    <div class="agenda" v-if="numberOfDays>0 && eventsNextDays.length">
      <h2>{{nextDaysTitle}}</h2>
      <div class="container grid">
        <cardEvent v-for="event in eventsNextDays" :key="event.id_event" :id="event.id_event" :add="false" />
      </div>
    </div>
  </div>
</template>

<style>
.agenda{width:100%}
.agenda:nth-last-child(1){margin-top:2em}
.agenda h2{margin-bottom:1.5em}
.grid{ display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 14px ; margin-top: 1em}

@media screen and (max-width: 992px) {
  .agenda:nth-last-child(1){margin-top:1em}
  .agenda h2{margin-bottom:0}
}
</style>
