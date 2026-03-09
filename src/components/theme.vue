<script setup>
import { computed, watch } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const dataStore = useDataStore()
const selectedTheme = computed(() => dataStore.sortedConfig.systemTheme ? 'system' : (dataStore.sortedConfig.darkTheme ? 'dark' : 'light'))

watch(selectedTheme, (newTheme) => {
  if(!newTheme) return

  if (!document.startViewTransition) {
    updateTheme(newTheme);
    return;
  }

  document.startViewTransition(() => updateTheme(newTheme));
}, { immediate: true })

const updateTheme = (theme) => {
  if (theme === 'system') document.documentElement.style.removeProperty('--theme');
  else document.documentElement.style.setProperty('--theme', theme);
}
</script>

<template></template>

<style>
::view-transition-old(root) { animation-delay: .4s }
::view-transition-new(root) { animation: circle-in .4s ease-out }

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(root) { animation: none } /* group = new + old */
}

@keyframes circle-in {
  from { clip-path: circle(0% at 50% 50%) }
  to { clip-path: circle(80% at 50% 50%) }
}

:root {
  @media (prefers-color-scheme: light) {
    --theme: light; color-scheme: light;
  }
  
  @media (prefers-color-scheme: dark) {
    --theme: dark; color-scheme: dark;
  }
}

body{
  color-scheme: light;
  --body-back: #f6f6f6; --tab-back: #ccc;
  --black-main:#777777; --black-washed:#555555; --black-back:#c3c3c3;
  --black: #1f2937; --white:#fff; --over-trans:#ffffff3b;
  --table-head: #bbb; --table-odd: #f2f2f2; --table-hover: #ddd; --table-balance: #0e0d0d; --table-border: #ddd;
  --card-bg: #fff; --card-br: #e6e6e6; --accent: #111827; --btn-br: #d1d5db; --label-text: #555555;
  --green: green; --red: red;

  @container style(--theme: dark) {
    color-scheme: dark;
    --body-back: #1f1f2e; --tab-back: #2a2a3b;
    --black-main: #b6b4b4; --black-washed: #808080; --black-back: #333333;
    /* #ccc, #aaa */
    --black: #e5e7eb; --white: #111111; --over-trans: #0000004d;
    --table-head: #1d1d29; --table-odd: #2a2a3b; --table-hover: #242435; --table-balance: #ffffff; --table-border: #444;
    --card-bg: #2c2c3d; --card-br: #444; --accent: #f5f5f5; --btn-br: #555; --label-text: #b3b3b3;
    --green: #49e048; --red: red;
  }
}
</style>