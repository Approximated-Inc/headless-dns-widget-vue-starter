<script setup>
import ExternalLink from './ExternalLink.vue';
import { safeLink } from '../shared/session.js';
defineProps({ provider: { type: Object, required: true } });
</script>

<template>
  <div class="provider-copy">
    <p>{{ provider.message }}</p>
    <p v-if="provider.message_link"><ExternalLink :href="provider.message_link.url">{{ provider.message_link.text }}</ExternalLink></p>
    <p v-if="safeLink(provider.login_url)"><ExternalLink :href="provider.login_url">Open {{ provider.name }} DNS settings</ExternalLink></p>
    <p v-if="provider.lookup_status !== 'ok'" class="notice">We could not complete the provider lookup. Use these general instructions, check the domain spelling, or reload the instructions.</p>
  </div>
</template>
