import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createServer } from 'vite';
import config from '../vite.config.mjs';

async function loadComponent(t, path) {
  const server = await createServer({
    ...config,
    server: { ...config.server, middlewareMode: true, hmr: false },
    appType: 'custom'
  });
  t.after(() => server.close());
  const { default: Component } = await server.ssrLoadModule(path);
  return Component;
}

async function renderComponent(t, path, props = {}) {
  return renderToString(createSSRApp(await loadComponent(t, path), props));
}

test('compact fields show provider labels with unmodified display values', async (t) => {
  const html = await renderComponent(t, '/FieldStep.vue', { compact: true, step: {
    kind: 'field', label: 'TTL', value: 'Auto', text: 'Choose Auto for the TTL.'
  } });
  assert.match(html, /<label[^>]*>TTL<\/label>/);
  assert.match(html, /Choose Auto for the TTL\./);
  assert.match(html, /aria-label="TTL"[^>]*value="Auto"/);
  assert.match(html, /aria-label="Copy TTL"/);
});

test('compact blank fields keep their label and leave-blank instruction without a copy action', async (t) => {
  const html = await renderComponent(t, '/FieldStep.vue', { compact: true, step: {
    kind: 'field', label: 'Record name', value: '', text: 'Leave the Name field blank.'
  } });
  assert.match(html, />Record name<\/span>/);
  assert.match(html, /Leave the Name field blank\./);
  assert.doesNotMatch(html, /<input|<button/);
});


test('the initial design exposes one selected tab connected to the setup panel', async (t) => {
  const html = await renderComponent(t, '/App.vue');
  const tabs = [...html.matchAll(/<button\b[^>]*role="tab"[^>]*>/g)].map((match) => match[0]);
  assert.equal(tabs.length, 3);
  assert.match(tabs[0], /id="design-tab-simple"/);
  assert.match(tabs[0], /aria-selected="true"/);
  assert.match(tabs[0], /tabindex="0"/);
  for (const tab of tabs.slice(1)) {
    assert.match(tab, /aria-selected="false"/);
    assert.match(tab, /tabindex="-1"/);
  }
  for (const tab of tabs) assert.match(tab, /aria-controls="dns-design-panel"/);
  assert.match(html, /<[^>]*id="dns-design-panel"[^>]*role="tabpanel"[^>]*aria-labelledby="design-tab-simple"/);
});


test('modified design navigation keeps native shortcuts and the selected design', async (t) => {
  const App = await loadComponent(t, '/App.vue');
  let bindings;
  await renderToString(createSSRApp({
    setup(props, context) {
      bindings = App.setup(props, context);
      return () => null;
    }
  }));
  for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
    for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
      bindings.design.value = 'dashboard';
      await bindings.changeDesignWithKeyboard({
        key,
        [modifier]: true,
        preventDefault() { assert.fail(`${modifier} + ${key} must preserve the native shortcut`); }
      });
      assert.equal(bindings.design.value, 'dashboard', `${modifier} + ${key} must preserve the selected design`);
    }
  }
});


function dnsRecord(overrides = {}) {
  return {
    domain: 'customer.com', host: 'shop', type: 'CNAME', title: 'Connect shop.customer.com',
    match_against: 'domains.example.com', automation: { kind: 'domain_connect', url: 'https://dash.cloudflare.com/connect?record=shop' },
    steps: [
      { kind: 'instruction', text: 'Add a record in your DNS settings.' },
      { kind: 'field', label: 'Name', value: 'shop', text: 'Enter shop in the Name field.' },
      { kind: 'field', label: 'Target', value: 'domains.example.com', text: 'Enter the target value.' },
      { kind: 'field', label: 'TTL', value: 'Auto', text: 'Choose Auto for the TTL.' },
      { kind: 'link', text: 'Read the provider guide', url: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/' }
    ],
    ...overrides
  };
}

function dnsResult(records, providerOverrides = {}) {
  return { domains: [{ apex_domain: 'customer.com', provider: {
    name: 'Cloudflare', message: 'Manage these records in Cloudflare.', lookup_status: 'ok',
    login_url: 'https://dash.cloudflare.com/dns',
    message_link: { text: 'Provider DNS help', url: 'https://developers.cloudflare.com/dns/' },
    ...providerOverrides
  }, records }] };
}

const manualDetails = (html) => [...html.matchAll(/<details\b[^>]*class="manual-steps"[^>]*>[\s\S]*?<\/details>/g)].map((match) => match[0]);
const withoutDetails = (html) => html.replace(/<details\b[^>]*>[\s\S]*?<\/details>/g, '');
const automaticLinks = (html) => [...html.matchAll(/<a\b[^>]*class="automatic-setup-button"[^>]*>[\s\S]*?<\/a>/g)].map((match) => match[0]);

for (const design of ['simple', 'dashboard', 'guided']) {
  test(`${design}: automatic setup is the first provider action and manual inputs stay collapsed`, async (t) => {
    const html = await renderComponent(t, '/ProviderRecords.vue', { design, result: dnsResult([dnsRecord()]) });
    assert.match(html, /<h3[^>]*>Set up DNS automatically<\/h3>/);
    const links = automaticLinks(html);
    assert.equal(links.length, 1);
    assert.match(links[0], /Set up with Cloudflare/);
    assert.match(links[0], /href="https:\/\/dash.cloudflare.com\/connect\?record=shop"/);
    assert.match(links[0], /target="_blank"/);
    assert.match(links[0], /rel="noopener noreferrer"/);
    assert.ok(html.indexOf(links[0]) < html.indexOf('Open Cloudflare DNS settings'));
    assert.ok(html.indexOf(links[0]) < html.indexOf('Provider DNS help'));
    assert.ok(html.indexOf(links[0]) < html.indexOf('<input'));
    assert.match(html, /review and approve/i);
    assert.match(html, /return here to verify/i);
    const details = manualDetails(html);
    assert.equal(details.length, 1);
    assert.doesNotMatch(details[0].match(/^<details[^>]*>/)[0], /\bopen\b/);
    assert.match(details[0], /<summary>Set up manually instead<\/summary>/);
    assert.match(details[0], /Open Cloudflare DNS settings/);
    assert.match(details[0], /value="domains.example.com"/);
    assert.match(details[0], /value="Auto"/);
    assert.match(details[0], /aria-label="Copy Target"/);
    assert.doesNotMatch(withoutDetails(html), /<input|Open Cloudflare DNS settings|Provider DNS help/);
    if (design === 'dashboard') assert.match(details[0], /class="record-fields"/);
  });

  test(`${design}: multiple automatic records retain separate approvals identified by type and address`, async (t) => {
    const html = await renderComponent(t, '/ProviderRecords.vue', { design, result: dnsResult([
      dnsRecord(), dnsRecord({ host: '@', type: 'TXT', title: 'Verify customer.com', automation: {
        kind: 'domain_connect', url: 'https://dash.cloudflare.com/connect?record=ownership'
      } })
    ]) });
    const links = automaticLinks(html);
    assert.equal(links.length, 2);
    assert.match(links[0], /CNAME shop.customer.com/);
    assert.match(links[1], /TXT customer.com/);
    assert.match(links[1], /href="https:\/\/dash.cloudflare.com\/connect\?record=ownership"/);
    assert.match(html, /Each approval sets up only the record shown\./);
    assert.equal(manualDetails(html).length, 2);
  });

  test(`${design}: mixed groups identify the manual record and keep its fields available`, async (t) => {
    const html = await renderComponent(t, '/ProviderRecords.vue', { design, result: dnsResult([
      dnsRecord(), dnsRecord({ host: '_verify', type: 'TXT', title: 'Verify ownership', automation: null })
    ]) });
    assert.equal(automaticLinks(html).length, 1);
    assert.match(html, /Still needs manual setup:[\s\S]*TXT _verify.customer.com/);
    const records = [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map((match) => match[0]);
    assert.equal(records.length, 2);
    assert.match(records[1], /Manual setup required/);
    if (design === 'dashboard') assert.match(withoutDetails(records[1]), /<input/);
    else assert.match(manualDetails(records[1])[0].match(/^<details[^>]*>/)[0], /\bopen\b/);
    assert.doesNotMatch(withoutDetails(records[0]), /<input/);
  });

  test(`${design}: unsupported or unsafe automation falls back to usable manual setup`, async (t) => {
    const Component = await loadComponent(t, '/ProviderRecords.vue');
    for (const automation of [
      { kind: 'unknown', url: 'https://dash.cloudflare.com/unsupported' },
      { url: 'https://dash.cloudflare.com/missing-kind' },
      { kind: 'domain_connect', url: 'javascript:alert(1)' },
      { kind: 'domain_connect', url: 'http://dash.cloudflare.com/insecure' },
      { kind: 'domain_connect', url: 'https://user:password@dash.cloudflare.com/private' },
      { kind: 'domain_connect', url: '' }
    ]) {
      const html = await renderToString(createSSRApp(Component, { design, result: dnsResult([dnsRecord({ automation })]) }));
      assert.equal(automaticLinks(html).length, 0, JSON.stringify(automation));
      assert.doesNotMatch(html, /Set up DNS automatically|Set up manually instead|Set up this record automatically/);
      assert.match(html, /Open Cloudflare DNS settings/);
      assert.match(html, /value="domains.example.com"/);
      if (design === 'dashboard') assert.match(withoutDetails(html), /<input/);
      else assert.match(manualDetails(html)[0].match(/^<details[^>]*>/)[0], /\bopen\b/);
    }
  });

  test(`${design}: manual-only groups retain provider guidance and safe external links`, async (t) => {
    const html = await renderComponent(t, '/ProviderRecords.vue', { design, result: dnsResult([dnsRecord({ automation: null })], {
      lookup_status: 'failed', message_link: { text: 'Unsafe provider help', url: 'javascript:alert(1)' }
    }) });
    assert.equal(automaticLinks(html).length, 0);
    assert.match(html, /We could not complete the provider lookup/);
    assert.match(html, /Open Cloudflare DNS settings/);
    assert.match(html, /Read the provider guide/);
    assert.doesNotMatch(html, /href="javascript:/);
    assert.match(html, /value="Auto"/);
  });
}

test('automatic setup uses the returned provider name', async (t) => {
  const html = await renderComponent(t, '/ProviderRecords.vue', { design: 'simple', result: dnsResult([dnsRecord()], { name: 'GoDaddy' }) });
  assert.match(automaticLinks(html)[0] || '', /Set up with GoDaddy/);
});
