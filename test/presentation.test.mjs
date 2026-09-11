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
