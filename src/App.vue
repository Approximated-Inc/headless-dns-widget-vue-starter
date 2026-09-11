<script setup>
import { computed, nextTick, onUnmounted, ref } from 'vue';
import DomainForm from './DomainForm.vue';
import SessionNotices from './SessionNotices.vue';
import GuideHeading from './GuideHeading.vue';
import ProviderRecords from './ProviderRecords.vue';
import VerificationPanel from './VerificationPanel.vue';
import { createDnsSetup, initialState } from '../shared/session.js';
import { cnameTarget, createClient } from '../shared/browser.js';
import { designOptions, nextDesign, guidedSteps } from '../shared/design.js';

const domain = ref('shop.customer.com');
const state = ref(initialState());
const design = ref('simple');
const session = createDnsSetup({ onChange: (next) => { state.value = next; }, createClient });
onUnmounted(() => session.dispose());
const busy = computed(() => ['loading', 'checking'].includes(state.value.phase));
const selectedDesign = computed(() => designOptions.find((option) => option.id === design.value));
const steps = computed(() => guidedSteps(state.value));
const start = () => session.start(domain.value, cnameTarget);
const retry = () => state.value.error?.operation === 'verify' && !state.value.error.restart ? session.verify() : start();
function changeDomain(value) { domain.value = value; session.reset(); }
async function changeDesignWithKeyboard(event) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const next = nextDesign(design.value, event.key);
  if (!next) return;
  event.preventDefault();
  design.value = next;
  await nextTick();
  document.getElementById(`design-tab-${next}`)?.focus();
}
</script>

<template>
  <main :data-design="design">
    <header class="demo-header"><p class="eyebrow">Custom domain setup</p><h1>Connect your domain</h1><p>Add a DNS record to point your domain to this application.</p></header>
    <div class="design-picker">
      <span class="design-label">Choose a layout</span>
      <div class="design-tabs" role="tablist" aria-label="Setup design">
        <button v-for="option in designOptions" :key="option.id" :id="`design-tab-${option.id}`" class="design-tab" type="button" role="tab" :aria-selected="design === option.id" :tabindex="design === option.id ? 0 : -1" aria-controls="dns-design-panel" @click="design = option.id" @keydown="changeDesignWithKeyboard">{{ option.label }}</button>
      </div>
      <p id="design-description" class="design-description">{{ selectedDesign.description }}</p>
    </div>
    <div id="dns-design-panel" class="design-panel" role="tabpanel" :aria-labelledby="`design-tab-${design}`" aria-describedby="design-description">
      <div v-if="design === 'guided'" class="guided-layout">
        <section class="guide-section" :data-step-state="steps[0].state" aria-labelledby="domain-step-heading">
          <GuideHeading id="domain-step-heading" :number="1" title="Choose your domain" :step="steps[0]" />
          <div class="guide-content">
            <DomainForm :domain="domain" :cname-target="cnameTarget" :phase="state.phase" :busy="busy" @start="start" @change="changeDomain" />
            <SessionNotices :state="state" :busy="busy" @retry="retry" />
          </div>
        </section>
        <section class="guide-section" :data-step-state="steps[1].state" aria-labelledby="records-step-heading">
          <GuideHeading id="records-step-heading" :number="2" title="Add your DNS records" :step="steps[1]" />
          <div class="guide-content">
            <ProviderRecords v-if="state.result" :result="state.result" :design="design" />
            <div v-else class="panel empty-state"><h3>Your records will appear here</h3><p>Get setup instructions for your domain to see the DNS provider and the exact values to add.</p></div>
          </div>
        </section>
        <section class="guide-section" :data-step-state="steps[2].state" aria-labelledby="verify-step-heading">
          <GuideHeading id="verify-step-heading" :number="3" title="Verify your DNS records" :step="steps[2]" />
          <div class="guide-content">
            <VerificationPanel v-if="state.result" :state="state" :busy="busy" guided @verify="session.verify" @reload="start" />
            <div v-else class="panel empty-state"><p>Once you have saved your DNS changes, check them here. DNS updates can take time to become visible.</p></div>
          </div>
        </section>
      </div>
      <div v-else class="setup-layout">
        <div class="setup-controls">
          <DomainForm :domain="domain" :cname-target="cnameTarget" :phase="state.phase" :busy="busy" @start="start" @change="changeDomain" />
          <SessionNotices :state="state" :busy="busy" @retry="retry" />
        </div>
        <div class="setup-workspace">
          <div v-if="design === 'dashboard'" class="workspace-header"><div><p class="eyebrow">Record workspace</p><h2>DNS setup</h2><p>Use your provider’s values below, then check the published records.</p></div></div>
          <ProviderRecords v-if="state.result" :result="state.result" :design="design" />
          <div v-else-if="design === 'dashboard'" class="panel empty-state"><h3>Your records will appear here</h3><p>Get setup instructions for your domain to see the DNS provider and the exact values to add.</p></div>
          <VerificationPanel v-if="state.result" :state="state" :busy="busy" @verify="session.verify" @reload="start" />
        </div>
      </div>
    </div>
  </main>
</template>
