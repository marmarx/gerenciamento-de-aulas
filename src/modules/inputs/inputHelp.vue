<script setup>
defineProps({modelValue: [String, Number, Date], if: {default: 1}, id: String, placeholder: String, type: {type: String, default: "number"}, numberDefs: Object})
defineEmits(["update:modelValue"])
</script>

<template>
  <div v-if="if" class="form-group inline-label">
    <label :for="id">
      <span>
        <p class="title"><slot name="title"></slot></p>
        <p class="helpText"><slot name="helpText"></slot></p>
      </span>
    </label>
    <input :type="type" :min="numberDefs?.min" :max="numberDefs?.max" :step="numberDefs?.step" class="tac"
      :id="id" :placeholder="placeholder" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)">
  </div>
</template>