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
  const startDate = filterStart.value ? new Date(filterStart.value) : new Date(-8640000000000000)
  const endDate   = filterEnd.value ? new Date(filterEnd.value) : new Date(8640000000000000)

  const students = dataStore.sortedStudents || []
  const events   = dataStore.sortedEvents   || []
  const payments = dataStore.sortedPayments || []

  return students.map(student => {
    // Payments until endDate -> initial balance
    let balance = payments
      .filter(p => p.id_student === student.id_student)
      .filter(p => new Date(p.date) <= endDate)
      .reduce((sum, p) => sum + p.value, 0)

    // Lessons before startDate -> reduces balance
    const previousEvents = events.filter(e => e.id_student === student.id_student && new Date(e.date) < startDate)
    for (const event of previousEvents) { balance -= (event.duration || 1) * (event.cost || student.cost) }

    // Events in range - from startDate to endDate - by student
    const eventsInRange = events
      .filter(e => e.id_student === student.id_student && new Date(e.date) >= startDate && new Date(e.date) <= endDate)
      // .sort((a, b) => new Date(a.date) - new Date(b.date))

    const doneEventsInRange = eventsInRange.filter(e => e.status === 'done')

    // Counting lessons with fractions
    let paid = 0
    for (const event of eventsInRange) {
      const eventCost = (event.duration || 1) * (event.cost || student.cost)
      if (balance >= eventCost) { paid += 1; balance -= eventCost }
      else if (balance > 0) { paid += balance / eventCost; balance = 0 }
    }

    return {
      id: student.id_student,
      name: student.student_name,
      done: doneEventsInRange.length,
      paid: parseFloat(paid.toFixed(2))
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
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in panorama" :key="item.nome" @click="viewReport(item.id)">
            <td>{{ item.name }}</td>
            <td>{{ item.done }}</td>
            <td>{{ item.paid }}</td>
            <td>{{ item.bal }}</td>
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





