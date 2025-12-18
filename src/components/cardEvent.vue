<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from "@/stores/dataStore"
import { useClockStore } from '@/stores/counterStore'
import { parseDate, mapsLink, whatsappLink, weekLabel, dateLabel, horaBR, formatDur } from '@/composables/utility'
import alink from '@/components/alink.vue'

const props = defineProps({ id: { type: String, required: true }, isToday: { type: Boolean, default: false } }) //event id

const router = useRouter()
const dataStore = useDataStore()
const clock = useClockStore()
const now = computed(() => props.isToday ? clock.now : null)

const event   = computed(() => dataStore.sortedEvents.find(e => e.id_event === props.id))
const student = computed(() => dataStore.sortedStudents.find(s => s.id_student === event.value.id_student))

const startDate = computed(() => parseDate(event.value.date, event.value.time).getTime())
const endDate   = computed(() => startDate.value + event.value.duration * 60 * 60 * 1000)
// const endDate = computed(() => parseDate(event.value.dateEnd, event.value.timeEnd).getTime())

// timmer countdown
const isNow = computed(() => {
  if (showRestore.value) return null
  if (!props.isToday || !now.value) return false

  const current = now.value
  return current >= startDate.value && current <= endDate.value
})

const countDown = computed(() => {
  if (showRestore.value) return 'Cancelado'
  if (!props.isToday || !now.value) return null

  const current = now.value
  if (current >= endDate.value) return 'Passado'  // already finished
  if (current >= startDate.value) return 'Agora'  // currently happening

  const diff = (startDate.value - current) / (60 * 60 * 1000)        // milliseconds -> hours
  return `em ${formatDur(diff)}`
})

// button methods
const markAsDone = () => {
  event.value.duration = event.value.duration || dataStore.sortedConfig.duration
  event.value.status = 'done'
}

const cancelEvent  = () => { event.value.status = 'canceled'; event.value.canceledAt = new Date().getTime() }
const restoreEvent = () => { event.value.status = 'scheduled' }

const routeTo = (path) => {
  dataStore.selectedEvent = event.value.id_event
  router.push(path)
}

// button visibility
const showRestore = computed(() => event.value.status === 'canceled')
const showCancel  = computed(() => dataStore.sortedConfig.autoFinishEvents)
const showMap     = computed(() => student.value.address && !student.value.meeting)
</script>

<template v-if="!student?.paused">
  <div class="card-holder" :class="{magic: isNow}">
    <div title="Editar aula" class="card" :class="{partiallyVisible: showRestore}" @click="routeTo('/aula')">
      <div class="name">
        {{student.student_name}}
        <div v-if="countDown" class="countDown">{{ countDown }}</div>
      </div>
      <div class="details">{{weekLabel(event.date)}}  •  {{dateLabel(event.date)}}  •  {{horaBR(event.time)}}</div>
      <div class="btns">

        <template v-if="isToday" >
          <div v-if="showRestore"     title="Restaurar aula" class="btn undo"     @click.stop="restoreEvent()"></div>
          <div v-else-if="showCancel" title="Cancelar aula"  class="btn cancel"   @click.stop="cancelEvent()"> </div>
          <div v-else                 title="Finalizar aula" class="btn complete" @click.stop="markAsDone()">  </div>
        </template>
        
        <alink v-if="showMap"               title="Navegar até aluno"       class="btn navigation" :href="mapsLink(student.address)"/>
        <alink v-if="student.meeting"       title="Abrir vídeo chamada"     class="btn video"      :href="student.meeting"/>
        <alink v-if="student.student_phone" title="Whatsapp do aluno"       class="btn whatsapp"   :href="whatsappLink(student.student_phone)"/>
        <alink v-if="student.parent_phone"  title="Whatsapp do responsável" class="btn parent"     :href="whatsappLink(student.parent_phone)"/>

      </div>
    </div>
  </div>
</template>

<style>
@import "@/assets/card.css";
</style>