<script setup>
const props = defineProps({
  title: String,
  for: String
})
</script>

<template>
  <div>
    <label v-if="title && props.for" :for="for">{{ title }}</label>
    <span v-else-if="title" :for="for">{{ title }}</span>
    <slot/>
  </div>
</template>

<style scoped>
label, span { user-select: none; }
</style>