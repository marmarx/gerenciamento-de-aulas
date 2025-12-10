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
    <TransitionGroup name="toast-fade" tag="div" class="toast-list">
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
    </TransitionGroup>
  </div>
</template>

<style scoped>
:root { --toastColor: #f5b031; }
::-webkit-scrollbar{width:0}

.toast-stack {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  width: 80%; max-width: 400px; overflow-x: hidden; overflow-y: visible;
  z-index: -1; padding: 0;
  -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;
}
.toast-stack:has(.toast-container) { z-index: 9999; padding: 1em }
.toast-stack:has(.toast-fade-enter-active), .toast-stack:has(.toast-fade-leave-active) { height: 100vh }

.toast-list {
  position: relative; width: 100%; height: 100%;
  display: flex; flex-direction: column-reverse; gap: 10px;
}

.toast-container {
  position: relative; box-sizing: border-box;
  display: flex; flex-direction: row; justify-content: space-between; gap: 1em;
  width: 100%; padding: 1.2em 1.5em; border-radius: 25px;
  font-size: 1em; color: white; line-height: 1.3em; text-align: center;
  overflow: hidden; cursor: pointer; background: rgba(40, 40, 40, 0.85);
  box-shadow: 
    0px 3px 5px -1px rgba(0,0,0,0.2),
    0px 6px 10px 0   rgba(0,0,0,0.14),
    0px 1px 18px 0   rgba(0,0,0,0.12);
}
.toast-container.confirm {cursor: default}

.toast-message { display: flex; flex-direction: column; pointer-events: none }
.toast-title, .toast-text { color: white; text-align: justify }
.toast-title { font-size: 1em; font-weight: bold; margin-bottom: .5em }
.toast-text { font-size: .9em }

.toast-btn { 
  font-weight: bold; letter-spacing: 1px; text-transform: uppercase; line-height: 2.2em;
  color: #f8b857; mix-blend-mode: difference; 
  cursor: pointer; padding-left: 1em; border-left: 1px solid gray; margin: auto .5em auto 0
 }
.toast-btn:hover { color: var(--toastColor, #f5b031) }

.toast-timer {
  position: absolute; bottom: 0; left: 0; 
  width: 100%; height: 3px; background: var(--toastColor, #f5b031);
}

.toast-fade-enter-active, .toast-fade-leave-active, .toast-fade-move { transition: all .5s ease }
.toast-fade-move { transition-delay: .25s }
.toast-fade-leave-active { position: absolute }

.toast-fade-leave-to, .toast-fade-enter-from { opacity: 0; transform: translateY(100%) }

@media screen and (max-width: 992px) { .toast-stack { width: 90%; max-width: min(90%, 400px)} }
</style>
