<script setup>
import inputToggle from '@/modules/inputs/inputToggle.vue'
import inputText from '@/modules/inputs/inputText.vue'
import inputSelect from '@/modules/inputs/inputSelect.vue'
import inputHelp from '@/modules/inputs/inputHelp.vue'

import { shortDateLabel, formatDuration, formatDur, currency } from '@/composables/utility'
import { onMounted, onBeforeUnmount, ref, computed, watch } from 'vue'
import { useDataStore } from "@/stores/dataStore"
import { useRouter } from 'vue-router'
import { isMob } from '@/modules/gesture/gestureControl'
import { toastShow } from '@/modules/toast/toastShow'

const dataStore = useDataStore()
const router = useRouter()

// basic flags
const advancedOptions = computed(() => dataStore.sortedConfig.advancedOptions)
let isNewEvent = ref(false)

if (!dataStore.selectedEvent) {
  const newEvent = dataStore.newEvent()
  dataStore.data.events.push(newEvent)
  dataStore.selectedEvent = newEvent.id_event
  isNewEvent.value = true
}

const students = dataStore.activeStudents
const event = dataStore.data.events.find(e => e.id_event === dataStore.selectedEvent)

import { useEventDefaults } from '@/composables/eventDefaults'
const {
  initialUpdate, saveEvent, 
  restoreEvent, finishEvent, cancelEvent, deleteEvent,
  overlapWarning
} = useEventDefaults(event)

watch(overlapWarning, (conflict) => {
  if (!conflict) return

  const start = `${shortDateLabel(conflict.date, event.date)}, ${conflict.time}`
  let end = ''
  if (conflict.timeEnd) end =
    conflict.date === conflict.dateEnd
    ? conflict.timeEnd
    : `${shortDateLabel(conflict.dateEnd, event.dateEnd)}, ${conflict.timeEnd}`

  toastShow('Aviso: sobreposição de eventos!', `${conflict.student_name.trim()} - ${start}${end ? ' → ' + end : ''}` )
})

// initial fix for editing old events
if (!isNewEvent.value) initialUpdate()

const exitView = () => {
  if (router.options.history.state.back) router.back()
  else router.push('/agenda')
}

const saveEv = () => {
  event.student_name = students.find(s => s.id_student === event.id_student)?.student_name || ''
  saveEvent()
  exitView()
}

const restoreEv = () => { restoreEvent(); saveEv() }
const finishEv  = () => { finishEvent(); exitView() }
const cancelEv  = () => { cancelEvent(); exitView() }
const removeEv  = () => { deleteEvent(); exitView() }

// Utility
const timeMin = computed(() => event.dateEnd === event.date ? event.time : '')
const isDisabled = () => !event.id_student || !event.date?.trim() || !event.time?.trim()

// Lifecycle logic for removing empty new events
const handleBeforeUnload = () => {
  if (isNewEvent.value) {
    if (isDisabled()) deleteEvent()
    else saveEvent()
  }
}

onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload))

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  handleBeforeUnload()
})
</script>

<template>
  <div class="section">
    <h2>{{ isNewEvent ? 'Nova' : 'Editar' }} Aula</h2>

    <div class="container" :class="{'halfContainer': advancedOptions}">
      <div :class="{'half': advancedOptions, 'container': !advancedOptions}">

        <h4 class="noMob">Detalhes da Aula</h4>
        <inputSelect id="aluno" defaultText="Selecione um aluno" placeholder="Aluno" :options="students" label="student_name" value="id_student" v-model="event.id_student" />

        <div class="flexContainer">
          <inputText class="half" id="startDate" type="date" placeholder="Data início" v-model="event.date" />
          <inputText class="half" id="endDate"   type="date" placeholder="Data fim"    v-model="event.dateEnd" :numberDefs="{min: event.date}" />
          <inputText class="half" id="startTime" type="time" placeholder="Hora início" v-model="event.time" />
          <inputText class="half" id="endTime"   type="time" placeholder="Hora fim"    v-model="event.timeEnd" :numberDefs="{min: timeMin}" />
        </div>

        <div class="flexContainer">
          <inputText :class="{'half': !advancedOptions, 'w100': advancedOptions}" id="duration" type="number" v-model="event.duration" :numberDefs="{min: 0, step: 0.1}"
            :placeholder="event.duration ? `Duração (${formatDur(event.duration)})` : 'Duração (horas)'" />

          <inputText v-if="!advancedOptions" class="half" id="cost" type="number" v-model="event.cost" :numberDefs="{step: 0.5, min: 0}"
            :placeholder="`Valor (${event.cost ? currency(event.cost) : currency(0).slice(0,2)}${event.variableCost ? '/h' : ''})`" />
        </div>

        <inputText id="notify" type="number" v-model="event.minutesBefore" :numberDefs="{min: 0, step: 5, max: 120}"
          :placeholder="`Notificação (${event.minutesBefore ? `${formatDur(event.minutesBefore/60)}` : 'minutos'})`" />

        <inputToggle v-model="event.experimental">
          <template #title>Aula experimental</template>
          <template #helpText>Aulas experimentais não tem custo e não são consideradas nos cálculos</template>
        </inputToggle>

        <template v-if="!isMob || !advancedOptions">
          <hr>
          <h4>Observações</h4>
          <div class="form-group">
            <textarea id="obs" placeholder="Observações" v-model="event.obs"></textarea>
          </div>
        </template>
        
      </div>

      <div v-if="advancedOptions" class="half">

        <h4>Política de precificação</h4>
        <p>Afeta apenas esta aula</p>
        <inputToggle v-model="event.variableCost">
          <template #title>Valor {{event.variableCost?'variável':'fixo'}}</template>
          <template #helpText>O valor desta aula {{event.variableCost?'':'in'}}depende da respectiva duração</template>
        </inputToggle>

        <inputHelp id="cost" :placeholder="`Valor (${currency(0).slice(0,2)}${event.variableCost ? '/h' : ''})`" :numberDefs="{min: 0, step: .5}" v-model.number="event.cost">
          <template #title>Valor da {{ event.variableCost ? 'hora' : 'aula' }}</template>
          <template #helpText>Esta aula custa {{ currency(event.cost) }} {{ event.variableCost ? 'a cada hora' : '(valor fixo)' }}</template>
        </inputHelp>
        
        <!-- 
        <inputHelp id="duration" placeholder="Horas" :numberDefs="{min: 0, step: .1}" v-model.number="event.duration">
          <template #title>Duração</template>
          <template #helpText>Esta aula tem {{ formatDuration(event.duration) }} de duração</template>
        </inputHelp>
        -->

        <hr/>

        <h4>Política de cancelamento</h4>
        <p>Afeta apenas esta aula</p>
        <inputToggle v-model="event.chargeCancelation">
          <template #title>Cancelamento {{ event.chargeCancelation?'cobrado':'gratuito' }}</template>
          <template #helpText>Cancelamento desta aula {{ event.chargeCancelation?'':'não ' }}será cobrado {{ event.chargeCancelation?'conforme baixo':'' }}</template>
        </inputToggle>

        <inputHelp id="freeBefore" :if="event.chargeCancelation" placeholder="horas" :numberDefs="{min: 0, step: .25}" v-model.number="event.freeCancelationBefore">
          <template #title>Período de gratuidade</template>
          <template #helpText>O cancelamento desta aula não será cobrado caso ocorra {{ event.freeCancelationBefore ? `com no mínimo ${formatDuration(event.freeCancelationBefore)} de antecedência` : 'até seu horário' }}</template>
        </inputHelp>

        <inputHelp id="cancelFee" :if="event.chargeCancelation" placeholder="%" :numberDefs="{min: 0, max: 200, step: 5}" v-model.number="event.cancelationFee">
          <template #title>Taxa de cancelamento</template>
          <template #helpText>O cancelamento desta aula {{event.cancelationFee ? `acarreta cobrança de ${event.cancelationFee}% do seu valor` : 'é gratuito'}}</template>
        </inputHelp>

        <template v-if="isMob">
          <hr>
          <h4>Observaçõesaa</h4>
          <div class="form-group">
            <textarea id="obs" placeholder="Observações" v-model="event.obs"></textarea>
          </div>
        </template>
        
      </div>

    </div>

    <div v-if="isNewEvent" class="flexContainer">
      <button @click="saveEv()" :disabled="isDisabled()">Salvar</button>
      <button @click="removeEv()">Cancelar</button>
    </div>
    <template v-else>
      <div class="flexContainer">
        <button v-if="event.status === 'scheduled'" @click="finishEv()">Finalizar Agora</button>
        <button @click="cancelEv()">{{event.status === 'canceled' ? 'Restaurar Aula' : 'Cancelar Aula'}}</button>
      </div>
      <div class="flexContainer">
        <button @click="saveEv()" :disabled="isDisabled()">Salvar Alterações</button>
        <button @click="restoreEv()">Cancelar Alterações</button>
        <button @click="removeEv()">Excluir Aula</button>
      </div>
    </template>
    
  </div>
</template>

<style scoped>
h4 { font-size: 1.2em; margin-top: 2em; text-align: center }
hr{ margin: 2em 0 }
p{text-align: center; margin-top: -.5em}
.noWeb { display: none }

.flexContainer { display: flex; flex-wrap: wrap; row-gap: 0; column-gap: .5em }

@media screen and (max-width: 992px) { 
  hr { width: 80%; margin: 2em auto }
  .noWeb { display: block; margin-bottom: 0; }
  .noMob{ display: none }

  #startDate { order: 1 }
  #startTime { order: 2 }
  #endDate   { order: 3 }
  #endTime   { order: 4 }
}
</style>