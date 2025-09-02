<script setup>
defineProps({modelValue: Boolean})
defineEmits(["update:modelValue"])
</script>

<template>
  <label class="switch">
    <span>
      <p class="title"><slot name="title"></slot></p>
      <p class="helpText"><slot name="helpText"></slot></p>
    </span>
    <input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)">
    <span class="slider round"></span>
  </label>
</template>

<style>
:root{--toogle-width: 75px; --toogle-height: 40px; --toggle-padding: 4px}

.switch {
  position: relative; width: 100%;
  display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-between; align-items: center; gap: 2.2em;
  cursor: pointer;
}
.switch > *:first-child{width:80%}
.switch > *:last-child{margin:auto .6em}
.switch input { opacity: 0; width: 0; height: 0; display: none }

.slider {
  position: relative;
  min-width: var(--toogle-width);
  min-height: var(--toogle-height);
  border-radius: 34px; background-color: var(--black-back);
  -webkit-transition: .4s; transition: .4s;
  cursor: pointer;
}
.slider:before {
  content: "";
  width: calc(var(--toogle-height) - 2*var(--toggle-padding));
  aspect-ratio: 1 / 1;
  left: var(--toggle-padding); bottom: var(--toggle-padding);
  position: absolute;
  background-color: var(--head-text); border-radius: 50%;
  -webkit-transition: .4s; transition: .4s;
}

input:checked + .slider:before { left: calc(var(--toogle-width) - var(--toogle-height) + var(--toggle-padding))}
input:checked + .slider { background-color: var(--nav-back);  }
.slider:hover { box-shadow: 0 0 .3em .2em var(--nav-hover) }

span p{ font-size: 1.1em; margin: .5em 0; font-weight: normal; user-select: none }
span p.title { font-weight: bold }
span p.helpText { font-size: 1em; opacity: .9; }
</style>