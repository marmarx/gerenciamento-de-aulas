<script setup>
import cardStudent from '@/components/cardStudent.vue'
import { ref, computed } from 'vue'
const filterByName = ref('')

import { useDataStore } from "@/stores/datastore"
const dataStore = useDataStore()
dataStore.selectedStudent = null

const students = computed(() => dataStore.data.students.filter(s => s.student_name.toLowerCase().includes(filterByName.value.toLowerCase())))
</script>

<template>
  <div class="section">
    <h2>Lista de Alunos</h2>
    <input type="text" name="listFilter" class="listFilter" placeholder="Filtrar por nome" v-model="filterByName" />
    <div class="container grid">
      <cardStudent v-for="student in students" :key="student.id_student" :id="student.id_student" />
    </div>
  </div>
</template>

<style>
.listFilter { width:80%; max-width: 500px }
.grid{ display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 14px ; margin-top: 1em}
</style>