<script setup>
import FieldStep from './FieldStep.vue';
import ExternalLink from './ExternalLink.vue';
import { safeLink } from '../shared/session.js';
defineProps({ result: { type: Object, required: true }, design: String });
</script>

<template>
  <div id="provider-instructions">
    <section v-for="group in result.domains" :key="group.apex_domain" class="panel provider-panel">
      <div class="provider-heading">
        <div><p class="eyebrow">DNS provider</p><h2>{{ group.apex_domain }}</h2></div>
        <span class="status-badge">{{ group.provider.name }}</span>
      </div>
      <div class="provider-copy">
        <p>{{ group.provider.message }}</p>
        <p v-if="group.provider.message_link"><ExternalLink :href="group.provider.message_link.url">{{ group.provider.message_link.text }}</ExternalLink></p>
        <p v-if="safeLink(group.provider.login_url)"><ExternalLink :href="group.provider.login_url">Open {{ group.provider.name }} DNS settings</ExternalLink></p>
        <p v-if="group.provider.lookup_status !== 'ok'" class="notice">We could not complete the provider lookup. Use these general instructions, check the domain spelling, or reload the instructions.</p>
      </div>
      <article v-for="(record, recordIndex) in group.records" :key="`${record.domain}-${record.type}-${record.host}-${recordIndex}`" class="record">
        <div class="record-heading"><h3>{{ record.title }}</h3><span class="record-type">{{ record.type }}</span></div>
        <p v-if="safeLink(record.automation?.url)" class="automation-link"><ExternalLink :href="record.automation.url">Set up this record automatically</ExternalLink></p>
        <div v-if="design === 'dashboard'" class="record-fields">
          <FieldStep v-for="(step, index) in record.steps.filter((step) => step.kind === 'field')" :key="index" :step="step" compact />
        </div>
        <details class="manual-steps" :open="design !== 'dashboard' && !safeLink(record.automation?.url)">
          <summary>{{ design === 'dashboard' ? 'Provider instructions' : 'Manual steps' }}</summary>
          <ol class="steps"><li v-for="(step, index) in record.steps" :key="index">
            <template v-if="step.kind === 'field'">
              <p v-if="design === 'dashboard'">{{ step.text }}</p>
              <FieldStep v-else :step="step" />
            </template>
            <ExternalLink v-else-if="step.kind === 'link'" :href="step.url">{{ step.text }}</ExternalLink>
            <p v-else>{{ step.text }}</p>
          </li></ol>
        </details>
      </article>
    </section>
  </div>
</template>
