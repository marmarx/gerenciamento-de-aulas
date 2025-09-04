<script setup>
import { computed } from 'vue'
const props = defineProps({ id: { type: String, required: true } }) // student id

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
const student = dataStore.sortedStudents.find(s => s.id_student === props.id)

import { horaBR, currency } from '@/stores/utility';
const weekDays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab']
const studentSchedules = computed(() => student.weekly_schedule.filter(e => e.weekDay || e.timeDay).map(e => `${weekDays[e.weekDay]} ${horaBR(e.timeDay)}`).join('  •  '))
const completedEvents = computed(() => dataStore.doneEvents.filter(l => l.id_student === student.id_student))
const completedEventsValue = computed(() => completedEvents.value.filter(l => l.experimental === false).reduce((sum, l) => sum + l.cost * l.duration, 0))
const completedPayments = computed(() => dataStore.sortedPayments.filter(p => p.id_student === student.id_student).reduce((sum, p) => sum + p.value, 0))
const balance = computed(() => completedPayments.value - completedEventsValue.value)
</script>

<template>
  <div class="card">
    <div class="name">
      {{student.student_name}}
      <div class="ampel status" :class="{paused: student.paused}"></div>
    </div>
    <div class="details">{{studentSchedules}}</div>
    <div class="details">Saldo:<span class="status" :class="{paused: balance < 0}">{{ currency(balance) }}</span></div>
    <div class="btns">
      <router-link title="Info"       class="btn info"     @click="dataStore.selectedStudent = student.id_student" to="/aluno"></router-link>
      <router-link title="Extrato"    class="btn extrato"  @click="dataStore.selectedStudent = student.id_student" to="/extrato"></router-link>
      <router-link title="Relatório"  class="btn report"   @click="dataStore.selectedStudent = student.id_student" to="/relatorio"></router-link>
    </div>
  </div>
</template>

<style>
@import "@/assets/card.css";
</style>