<script setup>
import { ref, computed } from 'vue'
import { studentStats } from '@/modules/panorama/panoramaStats'
import { isMob } from '@/modules/gesture/gestureControl'

import { useRouter } from 'vue-router'
const router = useRouter()

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

const tableColumns = [
  { key: 'name',       label: 'Aluno',        shLabel: 'Aluno' },
  { key: 'scheduled',  label: 'Agendadas',    shLabel: 'Ag'    },
  { key: 'canceled',   label: 'Canceladas',   shLabel: 'Ca'    },
  { key: 'done',       label: 'Finalizadas',  shLabel: 'Fi'    },
  { key: 'chargable',  label: 'Faturadas',    shLabel: 'Fa',    hide: true },
  { key: 'paid',       label: 'Pagas',        shLabel: 'Pg'    },
]

const sortKey = ref('name')
const sortReverse = ref(false)

const sortBy = (key) => {
  if (sortKey.value === key) sortReverse.value = !sortReverse.value
  else {
    sortKey.value = key
    sortReverse.value = false
  }
}

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
  const sorted = [...studentStats.value].sort((a, b) => {
    if (sortKey.value === 'name') return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    // if (sortKey.value === 'done') return a.done - b.done
    else return parseNumeric(a[sortKey.value]) - parseNumeric(b[sortKey.value])
  })
  return sortReverse.value ? sorted.reverse() : sorted
})

const viewReport = id => {
  dataStore.selectedStudent = id
  router.push('/relatorio')
}
</script>

<template>
  <div v-if="studentStats.length">
    <table>
      <thead>
        <tr>
          <th v-for="col in tableColumns" :key="col.key" @click="sortBy(col.key)">
            <span v-if="isMob">{{ col.shLabel }}</span>
            <span v-else>{{ col.label }}</span>
            <span v-if="sortKey === col.key">{{ sortReverse ? '▲' : '▼' }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in sortedPanorama" :key="item.id" @click="viewReport(item.id)">
          <td v-for="col in tableColumns" :key="`${item.id}_${col.key}`">
            {{ item[col.key] }}
          </td>
        </tr>
      </tbody>
    </table>
    <p class="tac mt10"><span v-if="isMob">Legenda: Ag - agendadas, Ca - canceladas, Fi - pagas, Fa - faturadas, Pg - pagas<br/></span>Clique em um aluno para ver o relatório.  Clique no cabeçalho para organizar.</p>
  </div>

  <div v-else>
    <p class="tac">Sem dados para mostrar.</p>
  </div>
</template>


<style scoped>
table{table-layout: fixed}
th:first-child, td:first-child {width:30%}
tr{cursor:pointer}
.mt10{margin-top: 10px}
@media screen and (max-width: 992px) { .mt10 { font-size: .9em } }
</style>