<script setup>
defineProps({ state: { type: Object, required: true }, busy: Boolean });
defineEmits(['retry']);
</script>

<template>
  <div class="session-notices">
    <div aria-live="polite" role="status"><p v-if="state.phase === 'loading'">Finding your DNS provider and preparing the steps…</p></div>
    <p v-if="state.renewalWarning" class="notice" role="status">{{ state.renewalWarning }}</p>
    <section v-if="state.error" class="panel error" role="alert">
      <p>{{ state.error.message }}</p>
      <ul v-if="state.error.details.length"><li v-for="(detail, index) in state.error.details" :key="index">Record {{ detail.index + 1 }}, {{ detail.field }}: {{ detail.message }}</li></ul>
      <button id="retry-request" type="button" @click="$emit('retry')" :disabled="busy">{{ state.error.restart ? 'Restart setup' : 'Try again' }}</button>
    </section>
  </div>
</template>
