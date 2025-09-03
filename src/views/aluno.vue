<script setup>
import { computed } from 'vue'

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

import { useRouter } from 'vue-router'
if (!dataStore.selectedStudent) useRouter().push('/alunos')

const student = dataStore.student
const weekDays = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]

import { invertDateISO, horaBR, currency, whatsappLink } from '@/stores/utility';
const studentSchedules = computed(() => student.weekly_schedule.filter(e => e.weekDay || e.timeDay).map(e => `${weekDays[e.weekDay]} ${horaBR(e.timeDay)}`).join('  •  '))
const completedEvents = computed(() => dataStore.doneEvents.filter(l => l.id_student === student.id_student))
const completedEventsValue = computed(() => completedEvents.value.filter(l => l.experimental === false).reduce((sum, l) => sum + l.cost * l.duration, 0))
const completedEventsTime = computed(() => completedEvents.value.reduce((sum, l) => sum + l.duration, 0))
const completedPayments = computed(() => dataStore.sortedPayments.filter(p => p.id_student === student.id_student).reduce((sum, p) => sum + p.value, 0))
const balance = computed(() => completedPayments.value - completedEventsValue.value)
</script>

<template>
  <div v-if="student" class="section">
    <h2>Detalhes do Aluno</h2>
    <div class="halfContainer">
      <div class="half">
        <p><b>Nome:</b> {{ student.student_name }}</p>
        <p><b>Status:</b> <span class="status" :class="{paused: student.paused}">{{student.paused ? 'Pausado' : 'Ativo'}}</span></p>
        <p v-if="student.weekly_schedule"><b>Horários:</b> {{studentSchedules}}</p>
        <p v-if="student.student_phone"><b>Telefone:</b> <a target="_blank" :href="whatsappLink(student.student_phone)" rel="noopener noreferrer">{{student.student_phone}}</a></p>

        <hr>
        <p><b>Responsável:</b> {{student.parent}}</p>
        <p><b>Telefone:</b> <a target="_blank" :href="whatsappLink(student.parent_phone)" rel="noopener noreferrer">{{student.parent_phone}}</a></p>
        <p v-if="student.parent_2"><b>Responsável:</b> {{student.parent_2}}</p>
        <p v-if="student.parent_2_phone"><b>Telefone:</b> <a :href="whatsappLink(student.parent_2_phone)" target="_blank" rel="noopener noreferrer">{{student.parent_2_phone}}</a></p>
        <p v-if="student.address"><b>Endereço:</b> {{student.address}}</p>

        <div v-if="student.scholl || student.year">
          <hr>
          <p v-if="student.scholl"><b>Escola:</b> {{student.scholl}}</p>
          <p v-if="student.year"><b>Série:</b> {{student.year}}</p>
        </div>
      </div>
      <div id="student-statement" class="half">
        <hr class="mob"/>
        <p><b>Aulas dadas:</b> {{ completedEvents.length }} aula{{ completedEvents.length>1?'s':'' }}</p>
        <p><b>Horas totais:</b> {{ completedEventsTime }} hora{{ completedEventsTime>1?'s':'' }}</p>
        <p><b>Hora aula atual:</b> {{ currency(student.cost) }}</p>
        <p><b>Valor Devido:</b> {{ currency(completedEventsValue) }}</p>
        <p><b>Valor Pago:</b> {{ currency(completedPayments) }}</p>
        <p><b>Saldo:</b> <span class="status" :class="{paused: balance < 0}" style="font-weight:bold">{{ currency(balance) }}</span></p>
        
        <div v-if="student.start_date || student.end_date">
          <hr>
          <p v-if="student.start_date"><b>Início:</b> {{ invertDateISO(student.start_date) }}</p>
          <p v-if="student.end_date"><b>Fim:</b> {{ invertDateISO(student.end_date) }}</p>
        </div>
        
        <div v-if="student.obs">
          <hr>
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
.status{color: var(--money-green); font-weight: bold}
.paused{color: var(--money-red)}
</style>