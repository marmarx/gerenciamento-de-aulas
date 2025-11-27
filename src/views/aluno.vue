<script setup>
import { computed } from 'vue'

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

import { useRouter } from 'vue-router'
if (!dataStore.selectedStudent) useRouter().push('/alunos')
const student = dataStore.student

import { shortDateLabel, shortWeekdays, horaBR, formatDuration, currency, whatsappLink, mapsLink } from '@/composables/utility';
import { eventValue } from '@/composables/eventValue'

const studentSchedules = computed(() => student.weekly_schedule.filter(e => e.weekDay && e.timeDay).map(e => `${shortWeekdays[e.weekDay]} ${horaBR(e.timeDay)}`).join('  •  '))
if(studentSchedules.value) console.log(studentSchedules.value)

const scheduledEvs   = computed(() => dataStore.scheduledEvents.filter(e => e.id_student === student.id_student))
const canceledEvents = computed(() => dataStore.canceledEvents.filter(e => e.id_student === student.id_student))

const chargableEvents = computed(() => dataStore.chargableEvents.filter(e => e.id_student === student.id_student))
const chargableEventsValue = computed(() => chargableEvents.value.filter(e => e.experimental === false).reduce((sum, e) => sum + eventValue(e.id_event), 0))

const completedPayments = computed(() => dataStore.sortedPayments.filter(p => p.id_student === student.id_student).reduce((sum, p) => sum + p.value, 0))
const balance = computed(() => completedPayments.value - chargableEventsValue.value)

const completedEvents = computed(() => dataStore.doneEvents.filter(e => e.id_student === student.id_student))
const completedEventsTime = computed(() => completedEvents.value.reduce((sum, e) => sum + Number(e.duration), 0))

const cancelPolicy = computed(() => {
  if(!student.chargeCancelation || !student.cancelationFee) return 'gratuitos'
  return `gratuito até ${formatDuration(student.freeCancelationBefore)} antes do horário da aula, após é cobrado ${student.cancelationFee}% do valor`
})
</script>

<template>
  <div v-if="student" class="section">
    <h2>Detalhes do Aluno</h2>
    <div class="halfContainer">

      <div class="half">

        <p><b>Nome:</b> {{ student.student_name }}</p>
        <p><b>Status:</b> <span class="status" :class="{paused: student.paused}">{{student.paused ? 'Pausado' : 'Ativo'}}</span></p>
        <p v-if="student.student_phone"><b>Telefone:</b> <a target="_blank" :href="whatsappLink(student.student_phone)" rel="noopener noreferrer">{{student.student_phone}}</a></p>
        <p v-if="student.dob"><b>Data de nascimento:</b> {{ shortDateLabel(student.dob) }}</p>
        <p v-if="student.scholl"><b>Escola:</b> {{student.scholl}}</p>
        <p v-if="student.year"><b>Série:</b> {{student.year}}</p>
        <hr/>

        <div v-if="student.scholl || student.year">
          <p v-if="student.parent"><b>Responsável:</b> {{student.parent}}</p>
          <p v-if="student.parent_phone"><b>Telefone:</b> <a :href="whatsappLink(student.parent_phone)" target="_blank" rel="noopener noreferrer">{{student.parent_phone}}</a></p>
          <p v-if="student.parent_2"><b>Responsável:</b> {{student.parent_2}}</p>
          <p v-if="student.parent_2_phone"><b>Telefone:</b> <a :href="whatsappLink(student.parent_2_phone)" target="_blank" rel="noopener noreferrer">{{student.parent_2_phone}}</a></p>
          <hr/>
        </div>

        <div v-if="student.address || student.meeting || student.scholl || student.year">
          <p v-if="student.address"><b>Endereço:</b> <a :href="mapsLink(student.address)" target="_blank" rel="noopener noreferrer">{{ student.address }}</a></p>
          <p v-if="student.meeting"><b>Aula virtual:</b> <a :href="student.meeting" target="_blank" rel="noopener noreferrer">Link</a></p>
          <p v-if="student.start_date"><b>Início contrato:</b> {{ shortDateLabel(student.start_date) }}</p>
          <p v-if="student.end_date"><b>Fim contrato:</b> {{ shortDateLabel(student.end_date) }}</p>
          <hr class="mob" />
        </div>

      </div>

      <div id="student-statement" class="half">
        <p v-if="studentSchedules"><b>Horários:</b> {{studentSchedules ? studentSchedules : 'nenhum'}}</p>
        <p><b>{{student.variableCost ? 'Valor da hora aula' : 'Valor fixo por aula'}}:</b> {{ currency(student.cost) }}</p>
        <p v-if="student.duration"><b>Duração padrão:</b> {{ formatDuration(student.duration) }}</p>
        <p><b>Política de cancelamento:</b> {{ cancelPolicy }}</p>

        <hr/>
        <p><b>Agendamentos:</b> {{ scheduledEvs.length }} aula{{ scheduledEvs.length>1?'s':'' }}</p>
        <p><b>Aulas dadas:</b> {{ completedEvents.length }} aula{{ completedEvents.length>1?'s':'' }}<span v-if="completedEventsTime"> ({{formatDuration(completedEventsTime)}})</span></p>
        <p><b>Cancelamentos:</b> {{ canceledEvents.length }} aula{{ canceledEvents.length>1?'s':'' }}</p>
        
        <hr/>
        <p><b>Valor Devido:</b> {{ currency(chargableEventsValue) }}</p>
        <p><b>Valor Pago:</b> {{ currency(completedPayments) }}</p>
        <p><b>Saldo:</b> <span class="status" :class="{paused: balance < 0}" style="font-weight:bold">{{ currency(balance) }}</span></p>
               
        <div v-if="student.obs">
          <hr/>
          <p><b>Observações:</b> {{student.obs }}</p>
        </div>
      </div>
    </div>
    <div class="flexContainer">
      <button @click="student.paused = !student.paused">{{student.paused ? 'Reativar' : 'Pausar'}}</button>
      <router-link to="/aluno/editar"><button>Editar</button></router-link>
      <router-link to="/extrato"><button>Extrato</button></router-link>
      <router-link to="/relatorio"><button>Relatório</button></router-link>
      <router-link to="/alunos"><button>Voltar</button></router-link>
    </div>
  </div>
  <div v-else class="section">Aluno não encontrado.</div>
</template>

<style>
.status{color: var(--green); font-weight: bold}
.paused{color: var(--red)}
hr{width:100%; margin: 0}
</style>