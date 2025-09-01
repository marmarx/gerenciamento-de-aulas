<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()

import { computed } from 'vue'
const views = ['agenda','alunos','panorama']
const currentView = computed(() => views.find(v => route.path.toLowerCase().startsWith(`/${v.toLowerCase()}`)) || null)
const lineWidth = computed(() => `${100 / views.length}%`)
const lineLeft = computed(() => `${(views.indexOf(currentView.value) * 100) / views.length}%`)
const toSentenceCase = str => str.charAt(0).toUpperCase() + str.toLowerCase().slice(1)
</script>

<template>
  <header><h1>Gestão de Aulas</h1></header>
  <nav>
    <router-link v-for="view in views" :key="view" :to="`/${view}`" class="tab-label" :class="{ active: view === currentView }">{{ toSentenceCase(view) }}</router-link>
    <div class="line" :style="{ left: lineLeft, width: lineWidth }"></div>
  </nav>
</template>

<style>
header { color: var(--head-text); padding: 10px 0 0; background: var(--nav-hover);}
h1 { padding: 25px 10px; margin: 0; color: currentColor; text-align: center; }
nav { position: sticky; top:0; width: 100%; margin-top: -1px; display: inline-flex; justify-content: space-around; background: var(--nav-hover); z-index: 1 }
.tab-label {
  display: inline-block; flex: 1;
  color: var(--head-text); text-align: center; text-decoration: none;
  padding: 20px; border-radius: 5px 5px 0 0;
  cursor: pointer; transition: 0.25s ease; 
  opacity: 0.7; background:var(--el-back-color); 
}

.tab-label:hover { background:var(--over-trans) }
.tab-label:hover, .tab-label.active { opacity: 1; font-weight: bold; }
.line { position: absolute; bottom: 0; height: 4px; background: var(--nav-main); transition: 0.25s left ease }
</style>