<script setup>
import { computed } from 'vue';
import { safeLink } from '../shared/session.js';
const props = defineProps({ href: String });
const url = computed(() => safeLink(props.href));
</script>

<template>
  <a v-if="url" :href="url" target="_blank" rel="noopener noreferrer"><slot /></a>
  <span v-else><slot /></span>
</template>
