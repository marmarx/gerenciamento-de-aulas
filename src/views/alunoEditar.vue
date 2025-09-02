<script setup>
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

import { ref, watch, onBeforeUnmount } from 'vue'
const isNewStudent = ref(false)
// if no student is selected, create a new one and select it
if(!dataStore.selectedStudent) {
  const newStudent = dataStore.newStudent()
  dataStore.data.students.push(newStudent)
  dataStore.selectedStudent = newStudent.id_student
  isNewStudent.value = true
}

const student = dataStore.sortedStudents.find(s => s.id_student === dataStore.selectedStudent)
student.weekly_schedule.push({ weekDay: '', timeDay: '', subject: '' })

const hasContent = (item) => item.weekDay || item.timeDay || item.subject //true if any subitem has content, false if all are empty
const normalizeSchedule = () => {
  for (let i = 0; i < student.weekly_schedule.length ; i++) {
    if (!hasContent(student.weekly_schedule[i])) student.weekly_schedule.splice(i, 1)
  }
  const last = student.weekly_schedule.at(-1)
  if (!last || hasContent(last)) student.weekly_schedule.push({ weekDay: '', timeDay: '', subject: '' })
}

// add or remove items to schedule whenever it is changed
watch(
  () => student.weekly_schedule.map(r => `${r.weekDay ?? ''}|${r.timeDay ?? ''}|${r.subject ?? ''}`).join('||'),
  () => normalizeSchedule(),
  { immediate: true }
)

import { useRouter } from 'vue-router'
const router = useRouter()

// remove existing student on user request
const removeStudent = () => {
  if(!confirm(`Tem certeza que deseja remover o aluno ${student.student_name}?\nTodas as aulas e pagamentos relacionados a este aluno também serão removidos. Esta ação não pode ser desfeita.`)) return
  dataStore.data.events = dataStore.data.events.filter(e => e.id_student !== student.id_student)
  dataStore.data.payments = dataStore.data.payments.filter(p => p.id_student !== student.id_student)
  dataStore.removeStudent(student.id_student)
  router.push('/alunos')
}

// remove new student if no name is given when leaving the page
onBeforeUnmount(() => {
  if(student.student_name) return
  dataStore.removeStudent(student.id_student)
})
const weekDays = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
</script>

<template>
  <div class="section">
    <h2>{{ student.student_name ? `Editar` : 'Novo' }} Aluno</h2>
    <div class="halfContainer">
      <div class="half">
        <label>Nome do aluno
        <input type="text" placeholder="Nome do aluno" v-model="student.student_name" required></label>
        <label>Telefone do Aluno
        <input type="tel" placeholder="Telefone" v-model="student.student_phone"></label>
        <label>Nome do Responsável
        <input type="text" placeholder="Responsável" v-model="student.parent"></label>
        <label>Telefone do Responsável
        <input type="tel" placeholder="Telefone" v-model="student.parent_phone"></label>
        <label>Nome do responsável
        <input type="text" placeholder="Responsável 2" v-model="student.parent_2"></label>
        <label>Telefone do responsável
        <input type="tel" placeholder="Telefone 2" v-model="student.parent_2_phone"></label>
        <label>Endereço
        <input type="text" placeholder="Endereço" v-model="student.address"></label>
        <label>Vídeo chamada
        <input type="text" placeholder="Link para Google Meeting, Zoom, etc" v-model="student.meeting"></label>
        <label>Escola
        <input type="text" placeholder="Escola" v-model="student.scholl"></label>
        <label>Série e ano
        <input type="text" placeholder="Série" v-model="student.year"></label>
      </div>
      <div class="half">
        <label>Dia e horário das aulas
          <div class="inputFlex schedule" v-for="(schedule, j) in student.weekly_schedule" :key="j">
            <select name="diaSemana" v-model="schedule.weekDay" required>
              <option value="" selected>Dia da semana</option>
              <option v-for="(day, i) in weekDays" :key="day" :value="i">{{day}}</option>
            </select>
            <input type="text" placeholder="Horário" onfocus="this.type='time'" onblur="if(!this.value)this.type='text'" v-model="schedule.timeDay">
            <!-- <input type="text" placeholder="Matéria" v-model="schedule.subject"> -->
          </div>
        </label>
        <label>Valor da hora aulas
        <input type="number" min="0" step="0.01" placeholder="Valor da hora aula" v-model.number="student.cost"></label>
        <label>Início e fim de contrato
          <div class="inputFlex">
            <input name="inicioContrato" type="text" placeholder="Início contrato" onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" v-model="student.start_date">
            <input name="fimContrato" type="text" placeholder="Fim contrato" onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" v-model="student.end_date">
          </div>
        </label>
        <label>Observações
          <textarea placeholder="Observações" v-model="student.obs"></textarea>
        </label>
      </div>
    </div>
    <div class="flexContainer">
      <router-link to="/aluno" :id_student="student.id_student"><button>Salvar</button></router-link>
      <button  v-if="isNewStudent" @click="router.push('/alunos')">Cancelar</button>
      <button  v-else @click="removeStudent()">Remover</button>
    </div>
  </div>
</template>

<style>
/* .noinput{border:1px solid transparent;background:transparent}
.hidden{display:none} */
.inputFlex { width: 100%; max-width: 800px; display: flex; flex-wrap: nowrap; gap: 10px}
.inputFlex *{ width: 100% }
/* .schedule *:nth-child(1), .schedule *:nth-child(2){width: 30%}
.schedule *:nth-child(3){width: 40%} */
</style>