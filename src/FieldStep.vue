<script setup>
import { ref, useId } from 'vue';
const props = defineProps({ step: { type: Object, required: true }, compact: Boolean });
const id = useId();
const input = ref(null);
const message = ref('');
async function copy() {
  try { await navigator.clipboard.writeText(props.step.value); message.value = 'Copied'; }
  catch { input.value?.select(); message.value = 'Select and copy this value.'; }
}
</script>

<template>
  <div v-if="step.value === ''" class="field-step" :class="{ 'blank-field': compact }">
    <span v-if="compact" class="field-label">{{ step.label }}</span>
    <p>{{ step.text }}</p>
  </div>
  <div v-else class="field-step">
    <label :for="id" class="field-label">{{ compact ? step.label : step.text }}</label>
    <div class="copy-field">
      <input :id="id" ref="input" :aria-label="step.label" :value="step.value" :aria-describedby="compact ? `${id}-help` : undefined" readonly />
      <button type="button" class="secondary" :aria-label="`Copy ${step.label}`" @click="copy">Copy</button>
    </div>
    <p v-if="compact" :id="`${id}-help`" class="field-help">{{ step.text }}</p>
    <span class="copy-status" role="status">{{ message }}</span>
  </div>
</template>
