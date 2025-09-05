<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

import { ref, computed } from 'vue'
import { dateISO } from '@/stores/utility'
const today = new Date();
const year  = today.getFullYear();
const month = today.getMonth();
const filterStart = ref(dateISO(new Date(year, month, 1)))
const filterEnd   = ref(dateISO(new Date(year, month + 1, 0)))

const panorama = computed(() => {
  const startDate = new Date(filterStart.value) 
  const endDate   = new Date(filterEnd.value)

  const students = dataStore.sortedStudents || []
  const events   = dataStore.sortedEvents   || []
  const payments = dataStore.sortedPayments || []

  return students.map(student => {

    //total student payments in range
    const studentPayments = payments
      .filter(p => p.id_student === student.id_student)
      .filter(p => new Date(p.date) >= startDate && new Date(p.date) <= endDate)
      .reduce((sum, p) => sum + p.value, 0)

    //student events in range
    const studentEvents = events
      .filter(e => e.id_student === student.id_student)
      .filter(e => new Date(e.date) >= startDate && new Date(e.date) <= endDate)

    //student done events in range
    const completedEvents = studentEvents.filter(e => e.status === 'done')
    //student scheduled and done events in range 
    const uncanceledEvents = studentEvents.filter(e => e.status !== 'canceled')
  
    let balance = studentPayments
    let paidEvents = 0

    uncanceledEvents.forEach(e => {
      const eventValue = (e.duration || dataStore.data.config.defaultClassDuration) * (e.cost || student.cost)
      balance -= eventValue
      if(balance >= 0) paidEvents++
      else paidEvents += (balance + eventValue) / eventValue
    })

    return {
      id: student.id_student,
      name: student.name,
      done: completedEvents.length,
      paid: paidEvents.toFixed(2).replace(".",",")
    }
  })
})

const viewReport = id => {
  dataStore.selectedStudent = id
  router.push('/relatorio')
}
</script>

<template>
  <div class="section">
    <h2>Panorama</h2>

    <div class="dateFlex">
      <div class="half">
        <label>Início:</label>
        <input class="dateFilter" type="text" placeholder="Data inicial" onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" v-model="filterStart" :max="filterEnd" />
      </div>
      <div class="half">
        <label>Fim:</label>
        <input class="dateFilter" type="text" placeholder="Data final"   onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" v-model="filterEnd" :min="filterStart" />
      </div>
    </div>

    <div v-if="filterStart && filterEnd" class="container">
      <table>
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Aulas Dadas</th>
            <th>Aulas Pagas</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in panorama" :key="item.nome" @click="viewReport(item.id)">
            <td>{{ item.name }}</td>
            <td>{{ item.done }}</td>
            <td>{{ item.paid }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else>Selecione um período acima.</p>
    <p class="tac">Clique em um aluno para ver o relatório.</p>
    <div class="flexContainer">
      <button @click="router.push('/aulas')">Todas as Aulas</button>
      <button @click="router.push('/pagamentos')">Todos os Pagamentos</button>
    </div>
  </div>
</template>

<style scoped>
tr{cursor:pointer}

</style>
