<script setup>
import toast from '@/modules/toast/toast.vue'

import { toastShow } from '@/modules/toast/toastShow'
toastShow('Successfully saved!', 'All changes saved to storage')

const ok = await toastShow('Delete data?', 'This action cannot be undone', true)
if (ok) // confirmed
</script>

<template>
  <toast />
</template>