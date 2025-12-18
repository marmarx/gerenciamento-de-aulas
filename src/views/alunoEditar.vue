<script setup>
import inputToggle from '@/modules/inputs/inputToggle.vue'
import inputText from '@/modules/inputs/inputText.vue'
import inputSelect from '@/modules/inputs/inputSelect.vue'
import inputHelp from '@/modules/inputs/inputHelp.vue'

import { parseDate, longWeekdays, formatDuration, currency } from '@/composables/utility'
import { ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { toastShow } from '@/modules/toast/toastShow'

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

import { useRouter } from 'vue-router'
const router = useRouter()

const exitView = () => {
  if (router.options.history.state.back) router.back()
  else router.push('/alunos')
}

const isNewStudent = ref(false)

if(!dataStore.selectedStudent) {
  const newStudent = dataStore.newStudent()
  dataStore.data.students.push(newStudent)
  dataStore.selectedStudent = newStudent.id_student
  isNewStudent.value = true
}

const student = dataStore.student
student.minutesBefore = (student?.minutesBefore || student?.minutesBefore === 0) ? student.minutesBefore : dataStore.sortedConfig.minutesBefore
student.weekly_schedule.push({ weekDay: null, timeDay: '', subject: '' })

const hasContent = (item) => item.weekDay || item.timeDay || item.subject //true if any subitem has content, false if all are empty

const normalizeSchedule = () => {
  student.weekly_schedule = student.weekly_schedule.filter(item => hasContent(item))
  student.weekly_schedule.push({ weekDay: null, timeDay: '', subject: '' })
}

// add or remove items to schedule whenever it is changed
watch(
  () => student.weekly_schedule.map(r => `${r.weekDay ?? ''}|${r.timeDay ?? ''}|${r.subject ?? ''}`).join('||'),
  () => normalizeSchedule(),
  { immediate: true }
)

// update all future events of this particular student when certain fields are changed -> update only the specific field
const updateKeys = ['cost', 'duration', 'variableCost', 'chargeCancelation', 'freeCancelationBefore', 'cancelationFee', 'minutesBefore']

watch(
  () => updateKeys.map(key => student[key]),
  (newVals, oldVals) => newVals.forEach((val, i) => { if (val !== oldVals[i]) updateEvents(updateKeys[i]) })
)

const updateEvents = (key) => {
  dataStore.sortedEvents.forEach(e => {
    if (e.id_student === student.id_student && parseDate(e.date, e.time) >= new Date()) {
      e[key] = student[key] || dataStore.sortedConfig[key]
    }
  })
}

// remove existing student on user request
const deleteStudent = async () => {
  const ok = await toastShow(`Apagar aluno ${student.student_name}?`, 'Todos os dados serão apagados. Esta ação não pode ser desfeita.', true)
  if(!ok) return

  dataStore.data.events = [...dataStore.data.events].filter(e => e.id_student !== student.id_student)
  dataStore.data.payments = [...dataStore.data.payments].filter(p => p.id_student !== student.id_student)
  dataStore.removeStudent(student.id_student)
  router.push('/alunos')
}

// remove new student if no name is given when leaving the page
const isDisabled = () => !student.student_name?.trim()
const handleBeforeUnload = () => {
  console.log('handleBeforeUnload', isNewStudent.value, isDisabled())
  if(isNewStudent.value && isDisabled()) {
    dataStore.removeStudent(student.id_student);
    console.log('removed student!')
  }
}

onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload))
onBeforeUnmount(async () => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  handleBeforeUnload()
})
</script>

<template>
  <div class="section">
    <h2>{{ isNewStudent ? 'Novo' : 'Editar' }} Aluno</h2>

    <div class="halfContainer">
      <div class="half">
        <h4 class="noMob">Detalhes do Aluno</h4>
        <inputText id="name"   type="text"  placeholder="Nome do aluno"       v-model="student.student_name" />
        <inputText id="tel"    type="tel"   placeholder="Telefone"            v-model="student.student_phone" />
        <inputText id="dob"    type="date"  placeholder="Data de nascimento"  v-model="student.dob" />
        <inputText id="scholl" type="text"  placeholder="Escola"              v-model="student.scholl" />
        <inputText id="year"   type="text"  placeholder="Série"               v-model="student.year" />
        <hr/>

        <h4>Aulas e horários</h4>
        <div class="inputFlex schedule" v-for="(schedule, j) in student.weekly_schedule" :key="j">
          <inputSelect :id="`wday-${j}`" :defaultDisabled="false" defaultText="Dia da semana" placeholder="Dia" :options="longWeekdays" label="" value="" v-model="schedule.weekDay" />
          <inputText   :id="`time-${j}`" type="time"  placeholder="Horário"  v-model="schedule.timeDay" />
          <!-- <inputText   :id="`subj-${j}`" type="text"  placeholder="Matéria"  v-model="schedule.subject" /> -->
        </div>

        <inputText id="address" type="text"  placeholder="Endereço"       v-model="student.address" />
        <inputText id="meeting" type="text"  placeholder="Vídeo chamada"  v-model="student.meeting" />
        <hr/>

        <h4>Responsáveis</h4>
        <inputText id="parent1" type="text"  placeholder="Nome"       v-model="student.parent" />
        <inputText id="p1phone" type="tel"   placeholder="Telefone"   v-model="student.parent_phone" />
        <inputText id="parent2" type="text"  placeholder="Nome"       v-model="student.parent_2" />
        <inputText id="p2phone" type="tel"   placeholder="Telefone"   v-model="student.parent_2_phone" />
        <hr/>

        <h4>Contrato</h4>
        <div class="inputFlex">
          <inputText id="inicioContrato"  type="date" placeholder="Início"  v-model="student.start_date" />
          <inputText id="fimContrato"     type="date" placeholder="Fim"     v-model="student.end_date" />
        </div>

        <hr class="noWeb"/>
      </div>

      <div class="half">

        <h4>Política de precificação</h4>
        <p>Afeta todas as aulas futuras deste aluno</p>
        <inputToggle v-model="student.variableCost">
          <template #title>Valor {{student.variableCost?'variável':'fixo'}}</template>
          <template #helpText>O valor das aulas deste aluno {{student.variableCost?'':'in'}}depende da respectiva duração</template>
        </inputToggle>

        <inputHelp id="cost" :placeholder="`Valor (${currency(0).slice(0,2)}${student.variableCost ? '/h' : ''})`" :numberDefs="{min: 0, step: .5}" v-model.number="student.cost">
          <template #title>Valor padrão da {{ student.variableCost ? 'hora' : 'aula' }}</template>
          <template #helpText>As aulas deste aluno custam {{ currency(student.cost) }} por {{ student.variableCost ? 'hora' : 'aula' }}</template>
        </inputHelp>

        <inputHelp id="duration" placeholder="Horas" :numberDefs="{min: 0, step: .1}" v-model.number="student.duration">
          <template #title>Duração padrão</template>
          <template #helpText>As aulas deste aluno tem por padrão {{ formatDuration(student.duration) }} de duração</template>
        </inputHelp>

        <hr/>

        <h4>Política de cancelamento</h4>
        <p>Afeta todas as aulas futuras deste aluno</p>
        <inputToggle v-model="student.chargeCancelation">
          <template #title>Cancelamento {{ student.chargeCancelation?'cobrado':'gratuito' }}</template>
          <template #helpText>Cancelamentos deste aluno {{ student.chargeCancelation?'':'não ' }}são cobrados {{ student.chargeCancelation?'conforme baixo':'' }}</template>
        </inputToggle>

        <inputHelp id="freeBefore" if="student.chargeCancelation" placeholder="horas" :numberDefs="{min: 0, step: .25}" v-model.number="student.freeCancelationBefore">
          <template #title>Período de gratuidade</template>
          <template #helpText>Não serão cobrados cancelamentos que ocorram {{ student.freeCancelationBefore ? `com no mínimo ${formatDuration(student.freeCancelationBefore)} de antecedência` : 'até o horário da aula' }}</template>
        </inputHelp>

        <inputHelp id="cancelFee" :if="student.chargeCancelation" placeholder="%" :numberDefs="{min: 0, max: 200, step: 5}" v-model.number="student.cancelationFee">
          <template #title>Taxa de cancelamento</template>
          <template #helpText>Cancelamentos {{student.cancelationFee ? `acarretam a cobrança de ${student.cancelationFee}% do valor da aula` : 'são gratuitos'}}</template>
        </inputHelp>

        <hr/>

        <h4>Notificação</h4>
        <p>Afeta todas as aulas futuras deste aluno</p>
        <inputHelp id="minutesBefore" placeholder="min" :numberDefs="{min: 0, max: 120, step: 5}" v-model.number="student.minutesBefore">
          <template #title>Período de notificações</template>
          <template #helpText>Notificações serão enviadas {{ formatDuration(student.minutesBefore/60) }} antes de cada aula deste aluno</template>
        </inputHelp>

        <hr/>

        <h4>Observações</h4>
        <div class="form-group">
          <textarea id="obs" placeholder="Observações" v-model="student.obs"></textarea>
        </div>
        
      </div>
    </div>

    <div class="flexContainer">
      <button @click="exitView()" :id_student="student.id_student" :disabled="isDisabled()">Salvar</button>
      <button  v-if="isNewStudent" @click="exitView()">Cancelar</button>
      <button  v-else @click="deleteStudent()">Apagar</button>
    </div>

  </div>
</template>

<style scoped>
h4 { font-size: 1.2em; margin-top: 2em; text-align: center }
hr{ margin: 2em 0 }
.inputFlex { width: 100%; display: flex; flex-wrap: nowrap; gap: 10px}
.inputFlex .form-group { width: 100% }
.noWeb { display: none }
p{text-align: center; margin-top: -.5em}

@media screen and (max-width: 992px) { 
  /* hr{ display: none } */
  hr { width: 80%; margin: 2em auto }
  .noWeb { display: block; margin-bottom: 0; }
  .noMob{ display: none }
}
/* .schedule *:nth-child(1), .schedule *:nth-child(2){width: 30%}
.schedule *:nth-child(3){width: 40%} */
</style>