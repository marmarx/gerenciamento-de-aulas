<script setup>
import { computed } from 'vue'
const props = defineProps({ id: { type: String, required: true }, add: { type: Boolean, default: false } }) //event id

import { useDataStore } from "@/stores/datastore"
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
      <a v-if="student.address"      class="btn" :href="mapsLink(student.address)"          target="_blank" rel="noopener noreferrer">Maps</a>
      <a v-if="student.meeting"      class="btn" :href="student.meeting"                    target="_blank" rel="noopener noreferrer">Vídeo</a>
      <a v-if="student.parent_phone" class="btn" :href="whatsappLink(student.parent_phone)" target="_blank" rel="noopener noreferrer">Whatsapp</a>
    </div>
    <div v-else class="btns">
      <router-link class="btn" @click="dataStore.selectedEvent = event.id_event" to="/aula/editar">Editar</router-link>
      <a v-if="student.address"      class="btn" :href="mapsLink(student.address)"          target="_blank" rel="noopener noreferrer">Maps</a>
      <a v-if="student.parent_phone" class="btn" :href="whatsappLink(student.parent_phone)" target="_blank" rel="noopener noreferrer">Whatsapp</a>
    </div>
  </div>
</template>

<style>
.card{
  display:flex; flex-direction:column; min-height:132px; 
  border:1px solid var(--card-br); border-radius:14px;
  background:var(--card-bg); box-shadow:0 1px 2px rgba(0,0,0,.04);
}
.partiallyVisible{opacity:.5}

.name{display:inline-flex; justify-content:space-between; font-weight:600; font-size:1.05rem; word-break:break-word;padding:22px 18px 18px}
.ampel{width: 8px; height: 8px; border-radius: 100%; background: currentColor}
.status{color: var(--money-green); font-weight:bold}
.paused{color: var(--money-red)}

.info{font-size:.98rem; color:var(--accent); display:flex; align-items:center; gap:8px;padding:0 18px 18px; white-space:pre}
.info:nth-child(3){padding-bottom:22px}

.btns{ display:inline-flex; margin-top:auto; border-top:1px solid var(--card-br) }
.btn{
  width: 100%;
  padding:10px 0; border:0; border-right:1px solid var(--btn-br);
  font-weight:600; color: var(--white); text-align:center; text-decoration: none;
  appearance: none; cursor:pointer; background:var(--black-main);
}
.btn:hover{background:var(--black-washed)}
.btn:first-child{border-radius: 0 0 0 14px}
.btn:last-child{border-right:0;border-radius: 0 0 14px 0}
.btn:active{transform:translateY(1px);}
.noround{border-radius:0!important}
</style>