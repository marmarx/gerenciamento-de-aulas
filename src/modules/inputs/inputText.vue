<script setup>
const inputsWithPlaceholder = ['date', 'time', 'datetime-local', 'month', 'week']

const props = defineProps({modelValue: [String, Number, Date], id: String, placeholder: String, type: {type: String, default: "text"}, numberDefs: Object})

const handleFocus = ev => ev.target.type = props.type
const handleBlur  = ev => { if (!ev.target.value) ev.target.type = 'text' }

defineEmits(["update:modelValue"])
</script>

<template>
  <div class="form-group" :data-has-icon="inputsWithPlaceholder.includes(type)">
    <label :for="id">{{ placeholder }}</label>

    <input v-if="inputsWithPlaceholder.includes(props.type)" type="text" @focus="handleFocus" @blur="handleBlur" :min="numberDefs?.min" :max="numberDefs?.max"
      :id="id" :placeholder="placeholder" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)">

    <input v-else-if="type === 'number'" type="number" :step="numberDefs?.step" :min="numberDefs?.min" :max="numberDefs?.max"
      :id="id" :placeholder="placeholder" :value="modelValue" @input="$emit('update:modelValue', Number($event.target.value))">

    <input v-else :type="type"
      :id="id" :placeholder="placeholder" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)">
  </div>
</template>

<style scoped>
@import "inputLabelOver.css"; 
</style>