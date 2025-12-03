<script setup>
import { useGestures, transitionName } from '@/modules/gesture/gestureControl'
useGestures()
</script>

<template>
  <div class="view-container">
    <router-view v-slot="{ Component }">
      <transition :name="transitionName">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
.view-container {position:relative; flex:1; overflow:hidden}

.slide-left-enter-active, .slide-right-enter-active {position:relative; z-index:2}
.slide-left-leave-active, .slide-right-leave-active {position:absolute; z-index:1}

.slide-left-enter-from, .slide-right-leave-to {transform:translateX(100%)}
.slide-left-leave-to,   .slide-right-enter-from {transform:translateX(-100%)}

.slide-left-enter-to,  .slide-left-leave-from,
.slide-right-enter-to, .slide-right-leave-from {transform:translateX(0)}

.slide-left-enter-from, .slide-right-enter-from,
.slide-left-leave-to,   .slide-right-leave-to{opacity:0}
</style>