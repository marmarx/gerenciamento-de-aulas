<script setup>
const props = defineProps({
  modelValue: [String, Number], id: String,
  defaultText: String, defaultDisabled: {type:Boolean, default: true}, placeholder: String,
  options: Array, value: String, label: String
})
defineEmits(["update:modelValue"])
</script>

<template>
  <div class="form-group">
    <label :for="id">{{ placeholder }}</label>

    <select :id="id" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" required>
      <option v-if="defaultText" value="" selected :disabled="defaultDisabled">{{ defaultText }}</option>

      <template v-if="value && label">
        <option v-for="option in options" :key="option" :value="option[value]">{{ option[label] }}</option>
      </template>

      <template v-else>
        <option v-for="(option, i) in options" :key="option" :value="i">{{ option }}</option>
      </template>
      
    </select>
  </div>
</template>

<style scoped>
@import "@/assets/labelOver.css";
label { pointer-events: none }
</style>