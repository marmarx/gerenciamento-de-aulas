<script setup>
import { computed } from 'vue'
const props = defineProps({ id: { type: String, required: true } }) // student id

import { useDataStore } from "@/stores/datastore"
const dataStore = useDataStore()
const student = dataStore.data.students.find(s => s.id_student === props.id)

import { horaBR, currency } from '@/stores/utility';
const weekDays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab']
const studentSchedules = computed(() => student.weekly_schedule.filter(e => e.weekDay || e.timeDay).map(e => `${weekDays[e.weekDay]} ${horaBR(e.timeDay)}`).join('  •  '))
const completedEvents = computed(() => dataStore.data.events.filter(l => l.id_student === student.id_student).filter(l => l.status === 'done'))
const completedEventsValue = computed(() => completedEvents.value.filter(l => l.experimental === false).reduce((sum, l) => sum + l.cost * l.duration, 0))
const completedPayments = computed(() => dataStore.data.payments.filter(p => p.id_student === student.id_student).reduce((sum, p) => sum + p.value, 0))
const balance = computed(() => completedPayments.value - completedEventsValue.value)
</script>

<template>
  <div class="card">
    <div class="name">
      {{student.student_name}}
      <div class="ampel status" :class="{paused: student.paused}"></div>
    </div>
    <div class="info">{{studentSchedules}}</div>
    <div class="info">Saldo:<span class="status" :class="{paused: balance < 0}">{{ currency(balance) }}</span></div>
    <div class="btns">
      <router-link class="btn" @click="dataStore.selectedStudent = student.id_student" to="/aluno">Info</router-link>
      <router-link class="btn" @click="dataStore.selectedStudent = student.id_student" to="/extrato">Extrato</router-link>
      <router-link class="btn" @click="dataStore.selectedStudent = student.id_student" to="/relatorio">Relatório</router-link>
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