<script setup>
import { computed } from 'vue'
import { useToastStore } from '@/modules/toast/toastStore'

const store = useToastStore()
const toasts  = computed(() => store.toasts)

const pause   = id => store.pauseTimer(id)
const resume  = id => store.resumeTimer(id)
const confirm = id => store.confirm(id)
const remove  = id => store.remove(id)

const timerWidth = (toast) => `${ Math.round( Math.max(0, toast.remaining / toast.duration) * 100 ) }%`
</script>

<template>
  <div class="toast-stack">
    <transition-group name="toast-fade">
      <div v-for="toast in toasts" :key="toast.id"
        class="toast-container" :class="{ confirm: toast.confirm }"
        @mouseenter="pause(toast.id)" @mouseleave="resume(toast.id)" @click="!toast.confirm && remove(toast.id)">

        <div class="toast-message">
          <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
          <div v-if="toast.text" class="toast-text">{{ toast.text }}</div>
        </div>
        <div v-if="toast.confirm" class="toast-btn" @click.stop="confirm(toast.id)">OK</div>
        <div class="toast-timer" :style="{ width: timerWidth(toast) }"></div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
:root { --toastColor: #f5b031 }

.toast-stack {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); 
  display: flex; flex-direction: column-reverse; gap: 10px;
  width: 80%; max-width: 400px; max-height: 60vh; overflow: hidden;
  z-index: -1; padding: 0
}
.toast-stack:has(.toast-container) { z-index: 9999; padding: 1em }

.toast-container {
  position: relative; box-sizing: border-box;
  display: flex; flex-direction: row; justify-content: space-between; gap: 1em;
  width: 100%; min-height: fit-content; padding: 1.2em 1.5em; border-radius: 25px;
  font-size: 1em; color: white; line-height: 1.3em; text-align: center;
  overflow: hidden; cursor: pointer;
  background: rgba(40, 40, 40, 0.85); transition: all .5s;
  box-shadow: 
    0px 3px 5px -1px rgba(0,0,0,0.2),
    0px 6px 10px 0   rgba(0,0,0,0.14),
    0px 1px 18px 0   rgba(0,0,0,0.12);
}
.toast-container.confirm {cursor: default}

.toast-message { display: flex; flex-direction: column }
.toast-title, .toast-text { color: white; text-align: justify }
.toast-title { font-size: 1em; font-weight: bold; margin-bottom: .5em }
.toast-text { font-size: .9em; }

.toast-btn { 
  font-weight: bold; letter-spacing: 1px; text-transform: uppercase; line-height: 2.2em;
  color: #f8b857; mix-blend-mode: difference; 
  cursor: pointer; padding-left: 1em; border-left: 1px solid gray; margin: auto .5em auto 0
 }
.toast-btn:hover { color: var(--toastColor, #f5b031) }

.toast-timer {
  position: absolute; bottom: 0; left: 0; 
  width: 100%; height: 3px; background: var(--toastColor, #f5b031);
  transition: width 50ms linear;
}

/* .toast-fade-enter-to, .toast-fade-leave-from { opacity: 1; transform: scale(1) }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: scale(.98) } */

.toast-slide-enter-active, .toast-slide-leave-active { transition: all .25s ease }
.toast-slide-enter-from { opacity: 0; transform: translateY(10px) }
.toast-slide-leave-to   { opacity: 0; transform: translateY(-10px) }

@media screen and (max-width: 992px) { .toast-stack { width: 90% } }
</style>
