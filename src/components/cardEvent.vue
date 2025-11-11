<script setup>
import { computed } from 'vue'
const props = defineProps({ id: { type: String, required: true }, add: { type: Boolean, default: false } }) //event id

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
const event = computed(() => dataStore.sortedEvents.find(e => e.id_event === props.id))
const student = computed(() => dataStore.sortedStudents.find(s => s.id_student === event.value.id_student))

import { mapsLink, whatsappLink, weekLabel, dateLabel, horaBR } from '@/stores/utility';
const eventSchedule = computed(() => `${weekLabel(event.value.date)}  •  ${dateLabel(event.value.date)}  •  ${horaBR(event.value.time)}`)

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
    <div class="details">{{eventSchedule}}</div>
    <div v-if="add" class="btns">
      <div v-if="event.status === 'canceled'"                 title="Restaurar" class="btn undo"      @click="restoreEvent()"></div>
      <div v-else-if="dataStore.data.config.autoFinishEvents" title="Cancelar"  class="btn cancel"    @click="cancelEvent()"></div>
      <div v-else                                             title="Finalizar" class="btn complete"  @click="markAsDone()"></div>
      <!-- Registrar, Concluir, Finalizar, Efetivar, Validar, Lançar -->
      <a v-if="student.address && !student.meeting"    class="btn navigation" :href="mapsLink(student.address)"           target="_blank" rel="noopener noreferrer" title="Navegar"></a>
      <a v-if="student.meeting"       title="Vídeo"    class="btn video"      :href="student.meeting"                     target="_blank" rel="noopener noreferrer"></a>
      <a v-if="student.student_phone" title="Whatsapp" class="btn whatsapp"   :href="whatsappLink(student.student_phone)" target="_blank" rel="noopener noreferrer"></a>
      <a v-if="student.parent_phone"  title="Whatsapp" class="btn parent"     :href="whatsappLink(student.parent_phone)"  target="_blank" rel="noopener noreferrer"></a>
    </div>
    <div v-else class="btns">
      <router-link to="/aula"  title="Editar"   class="btn edit"       @click="dataStore.selectedEvent = event.id_event"></router-link>
      <a v-if="student.address && !student.meeting"    class="btn navigation" :href="mapsLink(student.address)"           target="_blank" rel="noopener noreferrer" title="Navegar"></a>
      <a v-if="student.student_phone" title="Whatsapp" class="btn whatsapp"   :href="whatsappLink(student.student_phone)" target="_blank" rel="noopener noreferrer"></a>
      <a v-if="student.parent_phone"  title="Whatsapp" class="btn parent"     :href="whatsappLink(student.parent_phone)"  target="_blank" rel="noopener noreferrer"></a>
    </div>
  </div>
</template>

<style>
@import "@/assets/card.css";
</style>