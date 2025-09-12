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
  const startDate = filterStart.value ? new Date(filterStart.value) : new Date("2000-01-01")
  const endDate   = filterEnd.value ? new Date(filterEnd.value) : new Date("3000-01-01")

  const students = dataStore.sortedStudents || []
  const events   = dataStore.sortedEvents   || []
  const payments = dataStore.sortedPayments || []

  const eventCost = (student, event) => {
    const duration = Number(event.duration) || Number(dataStore.data.config.defaultClassDuration) // 0 is not valid
    const cost = !isNaN(event.cost) ? Number(event.cost) : (!isNaN(student.cost) ? Number(student.cost) : Number(dataStore.data.config.defaultClassCost)) // 0 is valid
    return duration * cost
    // a || b -> 0, '', null and undefined are falsy and defaults to b
    // a ?? b -> only null and undefined are falsy -> 0 and '' are truthy
  }

  return students.map(student => {
    // All payments until endDate -> initial balance
    let balance = payments
      .filter(p => p.id_student === student.id_student)
      .filter(p => new Date(p.date) <= endDate)
      .reduce((sum, p) => sum + p.value, 0)

    // Lessons before startDate -> reduces balance
    const previousEvents = events.filter(e => e.id_student === student.id_student && new Date(e.date) < startDate)
    for (const event of previousEvents) { balance -= eventCost(student, event) }

    // Events in range - from startDate to endDate - by student
    const eventsInRange = events
      .filter(e => e.id_student === student.id_student && new Date(e.date) >= startDate && new Date(e.date) <= endDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    const doneEvents = eventsInRange.filter(e => e.status === 'done')
    const uncanceledEvents = eventsInRange.filter(e => e.status !== 'canceled')

    let paid = 0
    if(balance < 0){ paid = '0-' }  //in case previousEvents aren't fully paid 
    else {
      // Counting lessons with fractions
      for (const event of uncanceledEvents) {
        const evCost = eventCost(student, event)
        if (balance >= evCost) { paid++; balance -= evCost }
        else if (balance > 0) { paid += balance / evCost; balance = 0 }
      }
      // As there may be fewer scheduled classes (depends on each user settings), balance may remain above 0
      paid = `${parseFloat(paid.toFixed(2))}${balance>0?'+':''}`
    }

    return {
      id: student.id_student,
      name: student.student_name,
      done: doneEvents.length,
      paid
    }
  })
})

const viewReport = id => {
  dataStore.selectedStudent = id
  router.push('/relatorio')
}

const sortKey = ref('name')
const sortReverse = ref(false)

const parseNumeric = (val) => {
  if (typeof val === 'number') return val
  if (!val) return 0
  if (val === '<0') return -0.5
  if (/^\d+\+$/.test(val)) return parseInt(val) + 0.5 // handle "3+", "4+", etc.
  // fallback: try parsing normally
  const num = parseFloat(val)
  return isNaN(num) ? 0 : num
}

const sortedPanorama = computed(() => {
  const sorted = [...panorama.value].sort((a, b) => {
    if (sortKey.value === 'name') return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    if (sortKey.value === 'done') return a.done - b.done
    else return parseNumeric(a[sortKey.value]) - parseNumeric(b[sortKey.value])
  })
  return sortReverse.value ? sorted.reverse() : sorted
})

const sortBy = (key) => {
  if (sortKey.value === key) sortReverse.value = !sortReverse.value
  else {
    sortKey.value = key
    sortReverse.value = false
  }
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
            <th @click="sortBy('name')">Aluno      <span v-if="sortKey === 'name'">{{ sortReverse ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('done')">Aulas Dadas<span v-if="sortKey === 'done'">{{ sortReverse ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('paid')">Aulas Pagas<span v-if="sortKey === 'paid'">{{ sortReverse ? '▲' : '▼' }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in sortedPanorama" :key="item.nome" @click="viewReport(item.id)">
            <td>{{ item.name }}</td>
            <td>{{ item.done }}</td>
            <td>{{ item.paid }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else>Selecione um período acima.</p>
    <p class="tac">Clique em um aluno para ver o relatório.  Clique no cabeçalho para organizar.</p>
    <div class="flexContainer">
      <button @click="router.push('/aulas')">Todas as Aulas</button>
      <button @click="router.push('/pagamentos')">Todos os Pagamentos</button>
    </div>
  </div>
</template>

<style scoped>
tr{cursor:pointer}
</style>