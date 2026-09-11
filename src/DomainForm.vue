<script setup>
defineProps({ domain: String, cnameTarget: String, phase: String, busy: Boolean });
defineEmits(['start', 'change']);
</script>

<template>
  <form id="domain-form" class="panel domain-panel" @submit.prevent="$emit('start')">
    <label for="domain">Your custom domain</label>
    <input id="domain" name="domain" type="text" autocapitalize="none" autocorrect="off" spellcheck="false" required :value="domain" @input="$emit('change', $event.target.value)" aria-describedby="domain-help" />
    <p id="domain-help" class="muted">For example, shop.customer.com. The CNAME target is <code>{{ cnameTarget }}</code>.</p>
    <button id="load-instructions" type="submit" :disabled="busy">{{ phase === 'loading' ? 'Loading instructions…' : 'Get setup instructions' }}</button>
  </form>
</template>
