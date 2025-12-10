<!-- Floating Action Buttons -->

<script setup>
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

const reset = () => {
  dataStore.selectedStudent = ''
  dataStore.selectedEvent   = ''
  dataStore.selectedPayment = ''
}

const togglefm = () => {
  // toggle button animation
  document.getElementById('floatButton').classList.toggle('fm-open');

  // toggle options visibility
  const options = document.querySelectorAll('.fm-option');
  options.forEach(opt => opt.classList.toggle('fm-visible'));

  // toggle classes
  document.getElementById('overlay').classList.toggle('visible');
  document.getElementById('overlay').classList.toggle('negative-z-index');
  document.querySelector('.fm-container').classList.toggle('negative-z-index');

  // set today day for icon
  const today = new Date()
  document.documentElement.style.setProperty('--today-day', `"${today.getDate()}"`)
  // reset()
}

// text, icon, link
const buttons = [
  ['Aluno','student','aluno/editar'],
  ['Aula','event','aula'],
  ['Pagamento','payment','pagamento'],
  ['Configurações','config','config']
]
</script>

<template>
  <div id="overlay" class="negative-z-index" @click="togglefm()"></div>
  <div class="fm-container negative-z-index">
    <router-link v-for="button in buttons" :key="`btn-${button[0]}`" :to="`/${button[2]}`" @click="togglefm();reset()" class="fm-option">
      <div class="fm-label">{{ button[0] }}</div>
      <div class="fm"><div class="icon" :class="`icon-${button[1]}`"></div></div>
    </router-link>
  </div>
  <div id="floatButton" class="fm" @click="togglefm()">+</div>
</template>

<style>
@import "floatingIcons.css"; 

#overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.5); z-index: 4;
  opacity: 0; pointer-events: none; visibility: hidden;
}
#overlay.visible { opacity: 1; pointer-events: auto; visibility: visible; }

#floatButton, .fm-container {position: fixed; right: 20px; z-index: 5}
#floatButton {bottom: 20px;}
.fm-container { display: flex; flex-direction: column; align-items: flex-end; gap: 15px; bottom: 91px }
.negative-z-index {z-index: -1}

.fm {
  box-sizing: border-box;
  display: flex; justify-content:center; align-items: center;
  width: 56px; height: 56px;
  padding: 10px; border: none; border-radius: 50%;
  font-size: 2em; color: var(--head-text);
  background-color: var(--nav-back); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.fm-open {transform: rotate(45deg)}
.fm-open, .fm:hover {background-color: var(--nav-hover)}

.fm-option {
  display: flex; align-items: center;
  opacity: 0; pointer-events: none;
  transform: translateY(20px);
  text-decoration: none
}

.fm-option.fm-visible { opacity: 1; transform: translateY(0); pointer-events: auto }

.fm-label {
  font-size: 1em; color: var(--white);
  padding: 6px 10px; border-radius: 4px; margin-right: 10px;
  background-color: var(--black-washed);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
</style>