<!-- Floating Action Buttons -->

<script setup>
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

const reset = () => {
  dataStore.selectedStudent = ''
  dataStore.selectedEvent   = ''
  dataStore.selectedPayment = ''
}

const toggleFab = () => {
  // toggle button animation
  document.getElementById('floatButton').classList.toggle('fab-open');

  // toggle options visibility
  const options = document.querySelectorAll('.fab-option');
  options.forEach(opt => opt.classList.toggle('fab-visible'));

  // toggle overlay
  document.getElementById('overlay').classList.toggle('visible');
  document.getElementById('overlay').classList.toggle('negative-z-index');

  // toggle fab z-index
  document.querySelector('.fab-container').classList.toggle('negative-z-index');

  // set today day for icon
  const today = new Date()
  document.documentElement.style.setProperty('--today-day', `"${today.getDate()}"`)
  reset()
}

// text, icon, link
const fabs = [
  ['Aluno','student','aluno/editar'],
  ['Aula','event','aula'],
  ['Pagamento','payment','pagamento'],
  ['Configurações','config','config']
]
</script>

<template>
  <div id="overlay" class="negative-z-index" @click="toggleFab()"></div>
  <div class="fab-container negative-z-index">
    <router-link v-for="fab in fabs" :key="`btn-${fab[0]}`" :to="`/${fab[2]}`" @click="toggleFab()" class="fab-option">
      <div class="fab-label">{{ fab[0] }}</div>
      <div class="fab"><div class="icon" :class="`icon-${fab[1]}`"></div></div>
    </router-link>
  </div>
  <div id="floatButton" class="fab" @click="toggleFab()">+</div>
</template>

<style>
@import "../assets/icons.css";

#overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.5); z-index: 4;
  opacity: 0; pointer-events: none; visibility: hidden;
}
#overlay.visible { opacity: 1; pointer-events: auto; visibility: visible; }

#floatButton, .fab-container {position: fixed; right: 20px; z-index: 5}
#floatButton {bottom: 20px;}
.fab-container { display: flex; flex-direction: column; align-items: flex-end; gap: 15px; bottom: 91px }
.negative-z-index {z-index: -1}

.fab {
  box-sizing: border-box;
  display: flex; justify-content:center; align-items: center;
  width: 56px; height: 56px;
  padding: 10px; border: none; border-radius: 50%;
  font-size: 2em; color: var(--head-text);
  background-color: var(--nav-back); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.fab-open {transform: rotate(45deg)}
.fab-open, .fab:hover {background-color: var(--nav-hover)}

.fab-option {
  display: flex; align-items: center;
  opacity: 0; pointer-events: none;
  transform: translateY(20px);
  text-decoration: none
}

.fab-option.fab-visible { opacity: 1; transform: translateY(0); pointer-events: auto }

.fab-label {
  font-size: 1em; color: var(--white);
  padding: 6px 10px; border-radius: 4px; margin-right: 10px;
  background-color: var(--black-washed);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
</style>