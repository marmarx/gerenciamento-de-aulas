<script setup>
import cardStudent from '@/components/cardStudent.vue'
import { ref, computed } from 'vue'
const filterByName = ref('')

import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()
dataStore.selectedStudent = ''

const activeStudents = computed(() => dataStore.activeStudents.filter(s => s.student_name.toLowerCase().includes(filterByName.value.toLowerCase())))
const pausedStudents = computed(() => dataStore.pausedStudents.filter(s => s.student_name.toLowerCase().includes(filterByName.value.toLowerCase())))
</script>

<template>
  <div class="section">
    <input v-if="activeStudents.length" type="text" name="listFilter" class="listFilter" placeholder="Filtrar por nome" v-model="filterByName" />
    <div class="alunos">
      <h2 v-if="!pausedStudents.length">Alunos</h2>
      <h2 v-else>Alunos Ativos</h2>
      <div v-if="activeStudents.length" class="container grid">
        <cardStudent v-for="student in activeStudents" :key="student.id_student" :id="student.id_student" />
      </div>
      <p v-else class="tac">Nenhum aluno ainda, <a href="/aluno/editar">adicione</a> um.</p>
    </div>

    <div v-if="pausedStudents.length" class="alunos">
      <h2>Alunos Pausados</h2>
      <div class="container grid">
        <cardStudent v-for="student in pausedStudents" :key="student.id_student" :id="student.id_student" />
      </div>
    </div>
  </div>
</template>

<style>
.alunos{width:100%}
.alunos:nth-last-child(1){margin-top:2em}
.alunos h2{margin-bottom:1.5em}
.listFilter { width:80%; max-width: 500px }
.grid{ display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 14px ; margin-top: 1em}
</style>