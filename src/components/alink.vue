<script setup>
defineProps({
  title: {type: String, default: ''},
  class: {type: String, default: ''},
  href:  {type: String, default: '/'}
})
</script>

<template>
  <a :title="title" :class="class" :href="href" target="_blank" rel="noopener noreferrer" @click.stop>
    <slot></slot>
  </a>
</template>