<script setup>
import inputToggle from '@/modules/inputs/inputToggle.vue'
import { toastShow } from '@/modules/toast/toastShow'

import { computed } from 'vue'
import { shortDateLabel } from '@/composables/utility'
import { filterStart, filterEnd } from '@/modules/panorama/dateFilter'
import { report } from '@/modules/panorama/panoramaReport'

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
const students = dataStore.sortedStudents || []

const reportContent = computed(() => {
  const details = `<b>Aluno(a)</b>: ${dataStore.student.student_name}<br><br><b>Período</b>: de ${shortDateLabel(filterStart.value)} à ${shortDateLabel(filterEnd.value)}<br><br>`

  return (details + report.value)
    .replace(/<\/?b>/gi, "*")       // Replace <b> tags with asterisks
    .replace(/<br\s*\/?>/gi, "\n")  // Replace <br> and <br/> with newline
    .replace(/<[^>]+>/g, "")        // Remove any other HTML tags just in case
})

const copyToClipboard = () => {
  navigator.clipboard.writeText(reportContent.value)
    .then(() => toastShow('Copiado!','Relatório adicionado na área de transferência') )
    .catch(err => {
      console.error('Failure to copy to clipboard:', err);
      toastShow('Erro','Erro ao copiar o relatório.');
  });
}

const sendParent = (parent, phone) => {
  const message = `Olá, ${parent},\nSegue o fechamento do pacote de aulas:\n\n${reportContent.value}`
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
}
</script>

<template>
  <div class="section">
    <h2>Relatório</h2>

    <div class="container">
      <label>
        Aluno:
        <select name="aluno" v-model="dataStore.selectedStudent" required>
          <option value="" selected disabled>Selecione um aluno</option>
          <option v-for="student in students" :key="student.id_student" :value="student.id_student">{{student.student_name}}</option>
        </select>
      </label>

      <div class="flexContainer">
        <label class="half">
          Início:
          <input class="dateFilter" type="text" placeholder="Data inicial" onfocus="this.type='date'" onblur="if(!this.value) this.type='text'" v-model="filterStart" />
        </label>
        <label class="half">
          Fim:
          <input class="dateFilter" type="text" placeholder="Data final"   onfocus="this.type='date'" onblur="if(!this.value) this.type='text'" v-model="filterEnd" />
        </label>
      </div>
    </div>

    <div class="container">
      <inputToggle v-model="dataStore.data.config.canceledOnReport">
        <template #title>{{ dataStore.sortedConfig.canceledOnReport ? 'M' : 'Não m' }}ostrar aulas canceladas</template>
        <template #helpText>Aulas canceladas {{ dataStore.sortedConfig.canceledOnReport ? '' : 'não ' }} serão mostradas no relatório.</template>
      </inputToggle>
      <hr/>
    </div>

    <div v-if="dataStore.selectedStudent && filterStart && filterEnd" v-html="report" style="line-height: 2em;"></div>
    <p v-else>Selecione nos campos acima.</p>

    <div class="flexContainer">
      <button @click="copyToClipboard()" :disabled="!dataStore.selectedStudent || !filterStart || !filterEnd">Copiar</button>

      <button v-if="dataStore.student.parent && dataStore.student.parent_phone" :disabled="!dataStore.selectedStudent || !filterStart || !filterEnd"
        @click="sendParent(dataStore.student.parent, dataStore.student.parent_phone)">
        Enviar para {{ dataStore.student.parent }}
      </button>

      <button v-if="dataStore.student.parent_2 && dataStore.student.parent_2_phone" :disabled="!dataStore.selectedStudent || !filterStart || !filterEnd"
        @click="sendParent(dataStore.student.parent_2, dataStore.student.parent_2_phone)">
        Enviar para {{ dataStore.student.parent_2 }}
      </button>
    </div>
  </div>
</template>