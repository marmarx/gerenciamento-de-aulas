<script setup>
import inputToggle from '@/components/inputToggle.vue'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

import { dateISO, timeISO, formatTime, isValidDate } from '@/stores/utility';
import { onBeforeUnmount, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const autoFinishOffset = computed(() => !isNaN(dataStore.data.config.autoFinishOffset) ? Number(dataStore.data.config.autoFinishOffset) : 30)
let isNewEvent = ref(false)

if(!dataStore.selectedEvent) {
  const newEvent = dataStore.newEvent()
  dataStore.data.events.push(newEvent)
  dataStore.selectedEvent = newEvent.id_event
  isNewEvent.value = true
}

const students = dataStore.activeStudents
const event = dataStore.data.events.find(e => e.id_event === dataStore.selectedEvent)
let updating = false

const isDisabled = () => !event.id_student || !event.date || !event.time

const backupEvent = {
  date: event.date,
  time: event.time,
  dateEnd: event.dateEnd,
  timeEnd: event.timeEnd
}

// restore to the last instance or the original created values
const restoreEvent = () => {
  event.date = backupEvent.date || event.originalDate || event.date
  event.time = backupEvent.time || event.originalTime || event.time
  event.dateEnd = backupEvent.dateEnd || event.dateEnd
  event.timeEnd = backupEvent.timeEnd || event.timeEnd
  if( event.date === event.originalDate && event.time === event.originaltime) event.rescheduled = false
  saveEvent()
}

const saveEvent = () => {
  event.student_name = students.find(s => s.id_student === event.id_student)?.student_name || ''
  event.duration = event.duration || dataStore.data.config.defaultClassDuration

  if(isNewEvent.value) {
    event.status = 'scheduled'
    event.originalDate = event.originalDate || event.date
    event.originalTime = event.originalTime || event.time
    event.cost = students.find(s => s.id_student === event.id_student).cost || dataStore.data.config.defaultClassCost
  }
  else event.rescheduled = event.date !== event.originalDate || event.time !== event.originalTime

  if(dataStore.data.config.autoFinishEvents.value) {
    const now = new Date();
    const eventDateTime = new Date(`${event.date}T${formatTime(event.time)}`);
    const finishThreshold = new Date(eventDateTime.getTime() + autoFinishOffset.value * 60 * 1000)
    if(finishThreshold <= now) event.status = 'done'
  }

  router.push('/agenda')
}

const cancelEvent = () => {
  event.status = event.status === 'canceled' ? 'scheduled' : 'canceled'
  router.push('/agenda')
}

const removeEvent = () => {
  dataStore.removeEvent(event.id_event)
  router.push('/agenda')
}

const finishEventNow = () => {
  updating = true
  const now = new Date()
  event.date = dateISO(now) // YYYY-MM-DD format
  event.time = timeISO(now) // HH:mm

  const end = new Date(now.getTime() + event.duration * 60 * 60 * 1000)
  console.log(end)  // prints: Fri Oct 31 2025 12:56:39 GMT-0300 (Horário Padrão de Brasília)
  console.log(dateISO(end)) // prints: 2025-10-31
  event.dateEnd = dateISO(end)
  event.timeEnd = timeISO(end)

  console.log('Immediately after set', event.dateEnd) // prints: 2025-10-31

  setTimeout(() => {
    console.log('After 100ms', event.dateEnd) // prints: 2025-10-19
    console.log('From store', dataStore.data.events.find(e => e.id_event === event.id_event)?.dateEnd) // prints: 2025-10-19
  }, 100)

  event.status = 'done'
  router.push('/agenda')
  setTimeout(() => updating = false, 50)
}

// change dateEnd and timeEnd upon changing start date, preserves duration
watch(() => event.date, (newVal, oldVal) => {
  console.log('change dateEnd and timeEnd upon changing start date')
  if (updating) return
  if (!newVal || !oldVal || !event.dateEnd) return
  if (!isValidDate(newVal) || !isValidDate(oldVal)) return

  updating = true
  const oldStart = new Date(`${oldVal}T${event.time}`)

  let oldEnd
  if (event.timeEnd) oldEnd = new Date(`${event.dateEnd}T${event.timeEnd}`)
  else if (event.duration) oldEnd = new Date(oldStart.getTime() + event.duration * 60 * 60 * 1000)
  else oldEnd = new Date(`${event.dateEnd}T${event.time}`)

  const diff = oldEnd.getTime() - oldStart.getTime()
  const newStart = new Date(`${newVal}T${event.time}`)
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

  const start = new Date(`${event.date}T${newVal}`)
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

  const start = new Date(`${event.date}T${event.time}`)
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
  
  const start = new Date(`${event.date}T${event.time}`)
  const end = new Date(`${newDateEnd}T${newTimeEnd}`)
  if (!isValidDate(start) || !isValidDate(end)) return

  const diffMinutes = (end.getTime() - start.getTime()) / (60 * 1000)
  event.duration = diffMinutes / 60

  setTimeout(() => updating = false, 50) // to avoid immediate retriggering
})

const timeMin = computed(() => event.dateEnd === event.date ? event.time : '')

// remove event if no student, no date or no time is given when leaving the page
onBeforeUnmount(() => { if(isNewEvent.value && isDisabled()) dataStore.removeEvent(event.id_event) })
</script>

<template>
  <div class="section">
    <h2>{{ isNewEvent ? 'Nova' : 'Editar' }} Aula</h2>
    <div class="container">
      <label>Nome do aluno
      <select name="aluno" v-model="event.id_student" required> <!-- disabled -->
        <option value="" selected>Nome do aluno</option>
        <option v-for="student in students" :key="student" :value="student.id_student">{{student.student_name}}</option>
      </select>
      </label>
    
      <div class="flexContainer">
        <label class="half">Data de início
          <input name="data" type="date" v-model="event.date" required>
        </label>
        <label class="half">Data de fim
          <input name="data" type="date" v-model="event.dateEnd" :min="event.date" required>
        </label>
      </div>

      <div class="flexContainer">
        <label class="half">Horário de início
          <input name="horario" type="text" placeholder="Hora de início (hh:mm)" onfocus="this.type='time'" onblur="if(!this.value)this.type='text'" v-model="event.time" required>
        </label>
        <label class="half">Horário de fim
          <input name="horario" type="text" placeholder="Hora de fim (hh:mm)" :min="timeMin" onfocus="this.type='time'" onblur="if(!this.value)this.type='text'" v-model="event.timeEnd" required>
        </label>
      </div>

      <label>Duração (horas)
        <input name="duração" type="number" placeholder="Duração (horas)" step="0.1" v-model="event.duration">
      </label>
      
      <!-- <label>Valor da hora aula<input name="valor" type="number" placeholder="Valor da hora aula" step="0.5" v-model="event.cost"></label> -->
      <label>Observações<textarea name="obs" placeholder="Observações" v-model="event.obs"></textarea></label>

      <inputToggle v-model="event.experimental">
        <template #title>Aula experimental</template>
        <template #helpText>Aulas experimentais não tem custo e não são consideradas nos cálculos</template>
      </inputToggle>

    </div>

    <div v-if="isNewEvent" class="flexContainer">
      <button @click="saveEvent()" :disabled="isDisabled()">Salvar</button>
      <button @click="removeEvent()">Cancelar</button>
    </div>
    <template v-else>
      <div class="flexContainer">
        <button @click="finishEventNow()">Finalizar Agora</button>
        <button @click="cancelEvent()">{{event.status === 'canceled' ? 'Restaurar Aula' : 'Cancelar Aula'}}</button>
      </div>
      <div class="flexContainer">
        <button @click="saveEvent()" :disabled="isDisabled()">Salvar Alterações</button>
        <button @click="restoreEvent()">Cancelar Alterações</button>
        <button @click="removeEvent()">Excluir Aula</button>
      </div>
    </template>
    
  </div>
</template>