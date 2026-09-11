<script setup>
import { ref, useId } from 'vue';
const props = defineProps({ step: { type: Object, required: true } });
const id = useId();
const input = ref(null);
const message = ref('');
async function copy() {
  try { await navigator.clipboard.writeText(props.step.value); message.value = 'Copied'; }
  catch { input.value?.select(); message.value = 'Select and copy this value.'; }
}
</script>

<template>
  <p v-if="step.value === ''">{{ step.text }}</p>
  <div v-else class="field-step">
    <label :for="id">{{ step.text }}</label>
    <div class="copy-field">
      <input :id="id" ref="input" :aria-label="step.label" :value="step.value" readonly />
      <button type="button" class="secondary" :aria-label="`Copy ${step.label}`" @click="copy">Copy</button>
    </div>
    <span class="copy-status" role="status">{{ message }}</span>
  </div>
</template>
