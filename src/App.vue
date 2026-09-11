<script setup>
import { computed, onUnmounted, ref } from 'vue';
import FieldStep from './FieldStep.vue';
import ExternalLink from './ExternalLink.vue';
import { createDnsSetup, initialState, safeLink, recordAddress, actualValues, verificationMessages } from '../shared/session.js';
import { cnameTarget, createClient } from '../shared/browser.js';

const domain = ref('shop.customer.com');
const state = ref(initialState());
const session = createDnsSetup({ onChange: (next) => { state.value = next; }, createClient });
onUnmounted(() => session.dispose());
const busy = computed(() => ['loading', 'checking'].includes(state.value.phase));
const start = () => session.start(domain.value, cnameTarget);
const retry = () => state.value.error?.operation === 'verify' && !state.value.error.restart ? session.verify() : start();
function changeDomain(event) { domain.value = event.target.value; session.reset(); }
</script>

<template>
  <main>
    <header><p class="eyebrow">Custom domain setup</p><h1>Connect your domain</h1><p>Add a DNS record to point your domain to this application.</p></header>
    <form id="domain-form" class="panel" @submit.prevent="start">
      <label for="domain">Your custom domain</label>
      <input id="domain" name="domain" type="text" autocapitalize="none" autocorrect="off" spellcheck="false" required :value="domain" @input="changeDomain" aria-describedby="domain-help" />
      <p id="domain-help" class="muted">For example, shop.customer.com. The CNAME target is <code>{{ cnameTarget }}</code>.</p>
      <button id="load-instructions" type="submit" :disabled="busy">{{ state.phase === 'loading' ? 'Loading instructions…' : 'Get setup instructions' }}</button>
    </form>
    <div aria-live="polite" role="status"><p v-if="state.phase === 'loading'">Finding your DNS provider and preparing the steps…</p></div>
    <p v-if="state.renewalWarning" class="notice" role="status">{{ state.renewalWarning }}</p>
    <section v-if="state.error" class="panel error" role="alert">
      <p>{{ state.error.message }}</p>
      <ul v-if="state.error.details.length"><li v-for="(detail, index) in state.error.details" :key="index">Record {{ detail.index + 1 }}, {{ detail.field }}: {{ detail.message }}</li></ul>
      <button id="retry-request" type="button" @click="retry" :disabled="busy">{{ state.error.restart ? 'Restart setup' : 'Try again' }}</button>
    </section>
    <template v-if="state.result">
      <div id="provider-instructions">
        <section v-for="group in state.result.domains" :key="group.apex_domain" class="panel">
          <h2>{{ group.apex_domain }}</h2>
          <p>{{ group.provider.message }}</p>
          <p v-if="group.provider.message_link"><ExternalLink :href="group.provider.message_link.url">{{ group.provider.message_link.text }}</ExternalLink></p>
          <p v-if="safeLink(group.provider.login_url)"><ExternalLink :href="group.provider.login_url">Open {{ group.provider.name }} DNS settings</ExternalLink></p>
          <p v-if="group.provider.lookup_status !== 'ok'" class="notice">We could not complete the provider lookup. Use these general instructions, check the domain spelling, or reload the instructions.</p>
          <article v-for="(record, recordIndex) in group.records" :key="`${record.domain}-${record.type}-${record.host}-${recordIndex}`" class="record">
            <h3>{{ record.title }}</h3>
            <p v-if="safeLink(record.automation?.url)"><ExternalLink :href="record.automation.url">Set up this record automatically</ExternalLink></p>
            <details :open="!safeLink(record.automation?.url)">
              <summary>Manual steps</summary>
              <ol class="steps"><li v-for="(step, index) in record.steps" :key="index">
                <FieldStep v-if="step.kind === 'field'" :step="step" />
                <ExternalLink v-else-if="step.kind === 'link'" :href="step.url">{{ step.text }}</ExternalLink>
                <p v-else>{{ step.text }}</p>
              </li></ol>
            </details>
          </article>
        </section>
      </div>
      <section class="panel" aria-labelledby="verify-heading">
        <h2 id="verify-heading">Check your DNS changes</h2>
        <p>Save the record at your DNS provider, then check it here. DNS updates can take time to become visible.</p>
        <div class="actions">
          <button id="verify-records" type="button" @click="session.verify" :disabled="busy || state.phase === 'complete' || state.error?.restart">
            {{ state.phase === 'checking' ? 'Checking DNS…' : state.phase === 'complete' ? 'DNS verified' : 'Check DNS records' }}
          </button>
          <button type="button" class="secondary" @click="start" :disabled="busy">Reload instructions</button>
        </div>
        <p id="verification-status" role="status" aria-live="polite">{{ state.phase === 'checking' ? 'Looking up the current DNS records…' : verificationMessages[state.phase] }}</p>
        <ul v-if="state.check" id="verification-records" class="checks"><li v-for="(record, index) in state.check.records" :key="index">
          <strong>{{ recordAddress(record) }} · {{ record.type }}</strong>
          <span>{{ record.match === true ? 'Matches' : 'Not matched yet' }}</span>
          <div>Expected: <code>{{ record.match_against }}</code></div>
          <div>Found: <code>{{ actualValues(record) }}</code></div>
        </li></ul>
      </section>
    </template>
  </main>
</template>
