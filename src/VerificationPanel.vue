<script setup>
import { recordAddress, actualValues, verificationMessages } from '../shared/session.js';
defineProps({ state: { type: Object, required: true }, busy: Boolean, guided: Boolean });
defineEmits(['verify', 'reload']);
</script>

<template>
  <section class="panel verification-panel" :aria-labelledby="guided ? 'verify-step-heading' : 'verify-heading'">
    <h2 v-if="!guided" id="verify-heading">Check your DNS changes</h2>
    <p>After completing setup at your DNS provider, check your records here. DNS updates can take time to become visible.</p>
    <div class="actions">
      <button id="verify-records" type="button" @click="$emit('verify')" :disabled="busy || state.phase === 'complete' || state.error?.restart">
        {{ state.phase === 'checking' ? 'Checking DNS…' : state.phase === 'complete' ? 'DNS verified' : 'Check DNS records' }}
      </button>
      <button id="reload-instructions" type="button" class="secondary" @click="$emit('reload')" :disabled="busy">Reload instructions</button>
    </div>
    <p id="verification-status" role="status" aria-live="polite">{{ state.phase === 'checking' ? 'Looking up the current DNS records…' : verificationMessages[state.phase] }}</p>
    <ul v-if="state.check" id="verification-records" class="checks"><li v-for="(record, index) in state.check.records" :key="index" :data-match="record.match === true">
      <strong>{{ recordAddress(record) }} · {{ record.type }}</strong>
      <span>{{ record.match === true ? 'Matches' : 'Not matched yet' }}</span>
      <div>Expected: <code>{{ record.match_against }}</code></div>
      <div>Found: <code>{{ actualValues(record) }}</code></div>
    </li></ul>
  </section>
</template>
