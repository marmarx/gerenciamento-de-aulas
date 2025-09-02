<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()

import { computed, watch } from 'vue'
const views = ['agenda','alunos','panorama']
const currentView = computed(() => views.find(v => route.path.toLowerCase().startsWith(`/${v.toLowerCase()}`)) || null)
const lineWidth = computed(() => `${100 / views.length}%`)
const lineLeft = computed(() => `${(views.indexOf(currentView.value) * 100) / views.length}%`)
const lineOpacity = computed(() => views.indexOf(currentView.value)<0 ? 0 : 1)
const toSentenceCase = str => str.charAt(0).toUpperCase() + str.toLowerCase().slice(1)
</script>

<template>
  <header><h1>Gestão de Aulas</h1></header>
  <div class="nav">
    <nav class="container">
      <router-link v-for="view in views" :key="view" :to="`/${view}`" class="tab-label" :class="{ active: view === currentView }">{{ toSentenceCase(view) }}</router-link>
      <div class="line" :style="{ left: lineLeft, width: lineWidth, opacity: lineOpacity }"></div>
    </nav>
  </div>
</template>

<style>
:root{--header-back: linear-gradient(90deg, var(--header-left) 0%, var(--header-right) 100%)}
header { color: var(--head-text); padding: 10px 0 0; background: var(--header-back);}
h1 { padding: 25px 10px; margin: 0; color: currentColor; text-align: center; }

.nav {position: sticky; top:0; margin-top: -1px; width:100%; display: flex; background: var(--header-back); z-index: 1}
nav { position: relative; display: flex; justify-content: space-around; }
.tab-label {
  display: inline-block; flex: 1;
  color: var(--head-text); text-align: center; text-decoration: none;
  padding: 20px; border-radius: 5px 5px 0 0;
  cursor: pointer; transition: 0.25s ease; 
  opacity: 0.7; background:var(--el-back-color); 
}

.tab-label:hover { background:var(--over-trans) }
.tab-label:hover, .tab-label.active { opacity: 1; font-weight: bold; }
.line { left:-100%; position: absolute; bottom: 0; height: 4px; background: var(--nav-line); transition: 0.25s left ease }
</style>