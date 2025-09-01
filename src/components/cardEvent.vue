<script setup>
import { computed } from 'vue'
const props = defineProps({ id: { type: String, required: true }, add: { type: Boolean, default: false } }) //event id

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
const event = computed(() => dataStore.data.events.find(l => l.id_event === props.id))
const student = computed(() => dataStore.data.students.find(s => s.id_student === event.value.id_student))

import { mapsLink, whatsappLink, weekDay, dateLabel, horaBR } from '@/stores/utility';
const eventSchedule = computed(() => `${dateLabel(event.value.date)}  •  ${weekDay(event.value.date)}  •  ${horaBR(event.value.time)}`)

const markAsDone = () => {
  event.value.duration = event.value.duration || dataStore.data.config.defaultClassDuration
  event.value.status = 'done'
}

const cancelEvent = () => { event.value.status = 'canceled' }
const restoreEvent = () => { event.value.status = 'scheduled' }
</script>

<template>
  <div v-if="!student.paused" class="card" :class="{partiallyVisible: event.status === 'canceled'}">
    <div class="name">{{student.student_name}}</div>
    <div class="info">{{eventSchedule}}</div>
    <div v-if="add" class="btns">
      <div class="btn" v-if="event.status === 'canceled'" @click="restoreEvent()">Restaurar</div>
      <div class="btn" v-else-if="dataStore.data.config.autoFinishEvents" @click="cancelEvent()">Cancelar</div>
      <div class="btn" v-else @click="markAsDone()">Finalizar</div> <!-- Registrar, Concluir, Finalizar, Efetivar, Validar, Lançar -->
      <a v-if="student.address && !student.meeting" class="btn" :href="mapsLink(student.address)" target="_blank" rel="noopener noreferrer">Maps</a>
      <a v-if="student.meeting"      class="btn" :href="student.meeting"                    target="_blank" rel="noopener noreferrer">Vídeo</a>
      <a v-if="student.parent_phone" class="btn" :href="whatsappLink(student.parent_phone)" target="_blank" rel="noopener noreferrer">Whatsapp</a>
    </div>
    <div v-else class="btns">
      <router-link class="btn" @click="dataStore.selectedEvent = event.id_event" to="/aula/editar">Editar</router-link>
      <a v-if="student.address && !student.meeting" class="btn" :href="mapsLink(student.address)" target="_blank" rel="noopener noreferrer">Maps</a>
      <a v-if="student.parent_phone" class="btn" :href="whatsappLink(student.parent_phone)" target="_blank" rel="noopener noreferrer">Whatsapp</a>
    </div>
  </div>
</template>

<style>
@import "@/assets/card.css";
</style>