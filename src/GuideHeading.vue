<script setup>
defineProps({ id: String, number: Number, title: String, step: { type: Object, required: true } });
</script>

<template>
  <div class="guide-heading">
    <span class="step-number" role="img" :aria-label="`Step ${number}, ${step.state}`">{{ step.state === 'complete' ? '✓' : number }}</span>
    <div>
      <h2 :id="id">{{ title }}</h2>
      <p class="step-caption"><span v-if="step.state !== 'waiting'" class="step-state">{{ step.state === 'complete' ? 'Complete' : 'Current step' }}.</span> {{ step.caption }}</p>
    </div>
  </div>
</template>
