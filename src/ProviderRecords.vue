<script setup>
import { computed, useId } from 'vue';
import FieldStep from './FieldStep.vue';
import ExternalLink from './ExternalLink.vue';
import ProviderCopy from './ProviderCopy.vue';
import { recordAddress, safeLink } from '../shared/session.js';
const props = defineProps({ result: { type: Object, required: true }, design: String });
const id = useId();
function automaticUrl(record) {
  return record.automation?.kind === 'domain_connect' ? safeLink(record.automation.url) : null;
}
const groups = computed(() => props.result.domains.map((group) => ({
  ...group,
  providerName: group.provider.name || 'your DNS provider',
  automaticRecords: group.records.filter((record) => automaticUrl(record)),
  manualRecords: group.records.filter((record) => !automaticUrl(record))
})));
</script>

<template>
  <div id="provider-instructions">
    <section v-for="(group, groupIndex) in groups" :key="group.apex_domain" class="panel provider-panel">
      <div class="provider-heading">
        <div><p class="eyebrow">DNS provider</p><h2>{{ group.apex_domain }}</h2></div>
        <span class="status-badge">{{ group.provider.name }}</span>
      </div>
      <section v-if="group.automaticRecords.length" class="automatic-setup" :aria-labelledby="`${id}-automatic-${groupIndex}`">
        <h3 :id="`${id}-automatic-${groupIndex}`">Set up DNS automatically</h3>
        <p v-if="group.automaticRecords.length === 1">Click the button below to review and approve this DNS change at {{ group.providerName }}. Then return here to verify.</p>
        <p v-else>Click each button below to review and approve your DNS changes at {{ group.providerName }}. Each approval sets up only the record shown. Then return here to verify.</p>
        <ul class="automatic-actions">
          <li v-for="(record, index) in group.automaticRecords" :key="index">
            <span class="automatic-record-label">{{ record.type }} {{ recordAddress(record) }}</span>
            <ExternalLink class="automatic-setup-button" :href="automaticUrl(record)">{{ group.automaticRecords.length === 1 ? `Set up with ${group.providerName}` : `Set up ${record.type} ${recordAddress(record)} with ${group.providerName}` }}<span class="visually-hidden"> (opens in a new tab)</span></ExternalLink>
          </li>
        </ul>
        <p class="automatic-help">The provider opens in a new tab.</p>
        <p v-if="group.manualRecords.length" class="manual-required-copy">Still needs manual setup: {{ group.manualRecords.map((record) => `${record.type} ${recordAddress(record)}`).join(', ') }}. Follow the manual steps below for {{ group.manualRecords.length === 1 ? 'this record' : 'these records' }}.</p>
      </section>
      <ProviderCopy v-else :provider="group.provider" />
      <article v-for="(record, recordIndex) in group.records" :key="`${record.domain}-${record.type}-${record.host}-${recordIndex}`" class="record">
        <div class="record-heading"><h3>{{ automaticUrl(record) ? recordAddress(record) : record.title }}</h3><span class="record-type">{{ record.type }}</span></div>
        <p v-if="group.automaticRecords.length && !automaticUrl(record)" class="manual-required-copy">Manual setup required for {{ record.type }} {{ recordAddress(record) }}.</p>
        <ProviderCopy v-if="group.automaticRecords.length && !automaticUrl(record)" :provider="group.provider" />
        <div v-if="design === 'dashboard' && !automaticUrl(record)" class="record-fields">
          <FieldStep v-for="(step, index) in record.steps.filter((step) => step.kind === 'field')" :key="index" :step="step" compact />
        </div>
        <details class="manual-steps" :open="design !== 'dashboard' && !automaticUrl(record)">
          <summary>{{ automaticUrl(record) ? 'Set up manually instead' : design === 'dashboard' ? 'Provider instructions' : 'Manual steps' }}</summary>
          <ProviderCopy v-if="group.automaticRecords.length && automaticUrl(record)" :provider="group.provider" />
          <div v-if="design === 'dashboard' && automaticUrl(record)" class="record-fields">
            <FieldStep v-for="(step, index) in record.steps.filter((step) => step.kind === 'field')" :key="index" :step="step" compact />
          </div>
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
