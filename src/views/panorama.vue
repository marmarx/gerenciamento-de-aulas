<script setup>
import panoramaMeasure from '@/modules/panorama/panoramaMeasure.vue'
import panoramaTable from '@/modules/panorama/panoramaTable.vue'
import { useRouter } from 'vue-router'
const router = useRouter()

import { filterStart, filterEnd } from '@/modules/panorama/dateFilter'

</script>

<template>
  <div class="section">
    <h2>Panorama</h2>

    <div class="dateFlex">
      <div class="alwaysHalf">
        <!-- <label>Início:</label> -->
        <input class="dateFilter" type="text" placeholder="Data inicial" onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" v-model="filterStart" />
      </div>
      <div class="alwaysHalf">
        <!-- <label>Fim:</label> -->
        <input class="dateFilter" type="text" placeholder="Data final"   onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" v-model="filterEnd" />
      </div>
    </div>

    <template v-if="filterStart && filterEnd">
      <div class="container"><panoramaMeasure/></div>
      <h2>Aulas no Período</h2>
      <div class="container"><panoramaTable/></div>
    </template>
    <p v-else>Selecione um período acima.</p>
    
    <div class="flexContainer">
      <button @click="router.push('/aulas')">Todas as Aulas</button>
      <button @click="router.push('/pagamentos')">Todos os Pagamentos</button>
    </div>
  </div>
</template>

<style scoped>
h2{margin-bottom: 0}
.mt10{margin-top: 10px}
</style>