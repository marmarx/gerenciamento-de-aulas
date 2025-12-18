<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from "@/stores/dataStore"
import { horaBR, currency, shortWeekdays } from '@/composables/utility'
import { eventValue } from '@/composables/eventValue'

const props = defineProps({ id: { type: String, required: true } }) // student id

const router = useRouter()
const dataStore = useDataStore()

const student = dataStore.sortedStudents.find(s => s.id_student === props.id)
const studentSchedules = computed(() => {
  const schedule = student.weekly_schedule.filter(e => e.weekDay || e.timeDay)
  if(!schedule.length) return 'Nenhum horário'
  return schedule.map(e => `${shortWeekdays[e.weekDay]} ${horaBR(e.timeDay)}`).join('  •  ')
})

const chargableEvents = computed(() => dataStore.chargableEvents.filter(e => e.id_student === student.id_student))
const chargableEventsValue = computed(() => chargableEvents.value.reduce((sum, e) => sum + eventValue(e.id_event), 0))

const completedPayments = computed(() => dataStore.sortedPayments.filter(p => p.id_student === student.id_student).reduce((sum, p) => sum + p.value, 0))
const balance = computed(() => completedPayments.value - chargableEventsValue.value)

// button method
const routeTo = (path) => {
  dataStore.selectedStudent = student.id_student
  router.push(path)
}
</script>

<template>
  <div class="card regular-border" title="Ver perfil do aluno" @click="routeTo('/aluno')">
    <div class="name">
      {{student.student_name}}
      <div class="ampel status" :class="{paused: student.paused}"></div>
    </div>
    <div class="details">{{studentSchedules}}</div>
    <div class="details">Saldo:<span class="status" :class="{paused: balance < 0}">{{ currency(balance) }}</span></div>
    <div class="btns">
      <div title="Editar aluno"  class="btn edit"    @click.stop="routeTo('/aluno/editar')"></div>
      <div title="Ver extrato"   class="btn extrato" @click.stop="routeTo('/extrato')">      </div>
      <div title="Ver relatório" class="btn report"  @click.stop="routeTo('/relatorio')">    </div>
    </div>
  </div>
</template>

<style>
@import "@/assets/card.css";
</style>