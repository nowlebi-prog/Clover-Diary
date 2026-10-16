import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

async function loadWidget(extra = {}) {
  const module = { exports: {} };
  const source = await fs.readFile(new URL('../widgets/CloverWidget.js', import.meta.url), 'utf8');
  await vm.runInNewContext(`(async () => { ${source}\n })()`, { module, Date, console, ...extra });
  return module.exports;
}

test('widget logic exists as a standalone executable script', async () => {
  let source;
  try { source = await fs.readFile(new URL('../widgets/CloverWidget.js', import.meta.url), 'utf8'); } catch {}
  assert.ok(source, 'standalone widget is not implemented');
  const api = await loadWidget();
  assert.equal(typeof api.selectAgenda, 'function');
});

test('local date and Monday week stay correct over a year boundary', async () => {
  const w = await loadWidget();
  assert.equal(w.dateKey(new Date(2027, 0, 1, 0, 1)), '2027-01-01');
  assert.deepEqual(Array.from(w.weekKeys('2027-01-01')), ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
});

test('agenda includes a continuing event and excludes completed/unscheduled/future records', async () => {
  const w = await loadWidget();
  const rows = w.selectAgenda({ events: [
    { id: 'span', title: '여행', date: '2026-10-16', endDate: '2026-10-18', startTime: '09:00', endTime: '18:00' },
    { id: 'done', date: '2026-10-17', completed: true },
    { id: 'floating', date: '2026-10-17', isUnscheduled: true },
    { id: 'future', date: '2026-10-18' }
  ], todos: [] }, '2026-10-17');
  assert.deepEqual(Array.from(rows, r => [r.id, r.timeLabel]), [['span', '계속']]);
});

test('all-day events sort before timed events and include end time', async () => {
  const w = await loadWidget();
  const rows = w.selectAgenda({ events: [
    { id: 'late', date: '2026-10-17', time: '14:00', endTime: '15:30' },
    { id: 'early', date: '2026-10-17', startTime: '9:00' },
    { id: 'all', date: '2026-10-17', isAllDay: true, startTime: '23:00' }
  ] }, '2026-10-17');
  assert.deepEqual(Array.from(rows, r => [r.id, r.timeLabel]), [['all', '종일'], ['early', '09:00'], ['late', '14:00–15:30']]);
});

test('unfinished overdue and undated tasks remain visible, completed tasks do not', async () => {
  const w = await loadWidget();
  const rows = w.selectAgenda({ todos: [
    { id: 'late', dueDate: '2026-10-16', title: '기한 경과' },
    { id: 'floating', title: '언젠가' },
    { id: 'today', dueDate: '2026-10-17', dueTime: '11:00', title: '오늘' },
    { id: 'done', dueDate: '2026-10-16', completed: true },
    { id: 'future', dueDate: '2026-10-18' }
  ] }, '2026-10-17');
  assert.deepEqual(Array.from(rows, r => r.id).sort(), ['floating', 'late', 'today']);
  assert.equal(rows.find(r => r.id === 'late').timeLabel, '기한 지남');
  assert.equal(rows.find(r => r.id === 'floating').timeLabel, '할 일');
});

const existingSession = (extra = {}) => ({ userId: 'user-a', accessToken: 'old-access', refreshToken: 'old-refresh', expiresAt: 2000, ...extra });
function memoryStore(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { get: key => values.get(key) ?? null, set: (key, value) => values.set(key, value), remove: key => values.delete(key), values };
}

test('expired session refreshes before a user-filtered read and persists rotated tokens', async () => {
  const w = await loadWidget();
  const store = memoryStore({ session: existingSession({ expiresAt: 10 }) });
  const calls = [];
  const transport = async (path, options) => {
    calls.push({ path, options });
    if (path === '/auth/v1/token?grant_type=refresh_token') return { user: { id: 'user-a' }, access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600 };
    assert.match(path, /user_id=eq.user-a/);
    assert.equal(options.token, 'new-access');
    return [{ updated_at: '2026-10-17T01:00:00Z', events: [{ id: 'e', date: '2026-10-17', title: '회의' }], todos: [] }];
  };
  const result = await w.loadAgenda({ store, transport, now: 1000, today: '2026-10-17' });
  assert.equal(result.state, 'fresh');
  assert.equal(result.days['2026-10-17'][0].title, '회의');
  assert.equal(store.get('session').refreshToken, 'new-refresh');
  assert.equal(calls.length, 2);
});

test('network failure uses only the same account cache and retains original fetch time', async () => {
  const w = await loadWidget();
  const store = memoryStore({ session: existingSession(), cache: { userId: 'user-a', fetchedAt: 100, days: { '2026-10-17': [{ title: '보존된 일정' }] } } });
  const result = await w.loadAgenda({ store, transport: async () => { throw new Error('offline'); }, now: 1000, today: '2026-10-17' });
  assert.equal(result.state, 'cached');
  assert.equal(result.fetchedAt, 100);
  assert.equal(result.days['2026-10-17'][0].title, '보존된 일정');
});

test('another account cache can never appear after sign-in or network failure', async () => {
  const w = await loadWidget();
  const store = memoryStore({ session: existingSession(), cache: { userId: 'user-b', days: { '2026-10-17': [{ title: '다른 사람 기록' }] } } });
  const result = await w.loadAgenda({ store, transport: async () => { throw new Error('offline'); }, now: 1000, today: '2026-10-17' });
  assert.equal(result.state, 'error');
  assert.deepEqual(Object.keys(result.days), []);
});

test('revoked refresh session hides cached diary and requires login', async () => {
  const w = await loadWidget();
  const store = memoryStore({ session: existingSession({ expiresAt: 1 }), cache: { userId: 'user-a', days: { '2026-10-17': [{ title: '개인 일정' }] } } });
  const result = await w.loadAgenda({ store, transport: async () => { throw Object.assign(new Error('revoked'), { status: 400 }); }, now: 1000, today: '2026-10-17' });
  assert.equal(result.state, 'login');
  assert.equal(store.get('session'), null);
  assert.equal(store.get('cache'), null);
  assert.deepEqual(Object.keys(result.days), []);
});

test('successful empty server result replaces stale cache instead of resurrecting deletions', async () => {
  const w = await loadWidget();
  const store = memoryStore({ session: existingSession(), cache: { userId: 'user-a', days: { '2026-10-17': [{ title: '삭제한 일정' }] } } });
  const result = await w.loadAgenda({ store, transport: async () => [], now: 1000, today: '2026-10-17' });
  assert.equal(result.state, 'fresh');
  assert.equal(result.days['2026-10-17'].length, 0);
});

test('an HTTP 401 refreshes a still-unexpired token once before reading again', async () => {
  const w = await loadWidget();
  const store = memoryStore({ session: existingSession() });
  let reads = 0;
  const result = await w.loadAgenda({ store, now: 1000, today: '2026-10-17', transport: async (path) => {
    if (path.startsWith('/auth/')) return { user: { id: 'user-a' }, access_token: 'next', refresh_token: 'next-refresh', expires_in: 3600 };
    if (++reads === 1) throw Object.assign(new Error('expired'), { status: 401 });
    return [];
  } });
  assert.equal(result.state, 'fresh');
  assert.equal(reads, 2);
});

test('a refresh response for another identity is discarded without exposing either cache', async () => {
  const w = await loadWidget();
  const store = memoryStore({ session: existingSession({ expiresAt: 1 }) });
  const result = await w.loadAgenda({ store, now: 1000, today: '2026-10-17', transport: async () => ({ user: { id: 'user-b' }, access_token: 'bad', refresh_token: 'bad-refresh', expires_in: 3600 }) });
  assert.equal(result.state, 'login');
  assert.equal(store.get('session'), null);
});

test('build configuration never publishes a secret or service-role key', async () => {
  let builder;
  try { builder = await import('../widgets/buildWidget.js'); } catch {}
  assert.ok(builder, 'widget build configuration is not implemented');
  const template = 'const CLOVER_CONFIG = /*CLOVER_CONFIG*/ null;';
  const serviceKey = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
  for (const key of ['sb_secret_do-not-publish', serviceKey]) {
    assert.throws(() => builder.buildWidgetScript(template, { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: key }), /public|anon/i);
  }
});

test('compiled widget uses only an HTTPS project URL and public key', async () => {
  const { buildWidgetScript } = await import('../widgets/buildWidget.js');
  const source = 'const CLOVER_CONFIG = /*CLOVER_CONFIG*/ null; module.exports = CLOVER_CONFIG;';
  const key = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.signature`;
  const compiled = buildWidgetScript(source, { VITE_SUPABASE_URL: 'https://example.supabase.co/', VITE_SUPABASE_ANON_KEY: key, SUPABASE_SERVICE_ROLE_KEY: 'never-include' });
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module });
  assert.deepEqual(Object.keys(module.exports).sort(), ['key', 'url']);
  assert.equal(module.exports.url, 'https://example.supabase.co');
  assert.equal(module.exports.key, key);
  assert.throws(() => buildWidgetScript(source, { VITE_SUPABASE_URL: 'http://example.supabase.co', VITE_SUPABASE_ANON_KEY: key }), /HTTPS/i);
});

// Native drawing is external to Node; this adapter records the rendered content and tap targets.
class WidgetNode {
  constructor() { this.children = []; }
  addStack() { const node = new WidgetNode(); this.children.push(node); return node; }
  addText(value) { const node = { value, centerAlignText() {} }; this.children.push(node); return node; }
  addSpacer() {}
  centerAlignContent() {}
  layoutVertically() {}
  setPadding() {}
}
const nativeDrawing = { ListWidget: WidgetNode, Color: class { constructor(value) { this.value = value; } }, Size: class {}, Font: { systemFont: n => n, boldSystemFont: n => n } };
function allNodes(node) { return [node, ...(node.children || []).flatMap(allNodes)]; }

test('login tap targets preserve a separate demo profile and do not open diary without login', async () => {
  const w = await loadWidget(nativeDrawing);
  const widget = w.renderWidget({ state: 'login', days: {} }, { today: '2026-10-17', profile: 'demo', scriptName: 'Clover Widget' });
  assert.equal(widget.url, 'scriptable:///run?scriptName=Clover%20Widget&profile=demo');
  assert.equal(allNodes(widget).filter(node => node.url && node.url.startsWith('https:')).length, 0);
});

test('all widget sizes render real agenda text with a last-fetch timestamp', async () => {
  const w = await loadWidget(nativeDrawing);
  for (const family of ['small', 'medium', 'large']) {
    const widget = w.renderWidget({ state: 'cached', fetchedAt: new Date(2026, 9, 17, 9, 15).getTime() / 1000, days: { '2026-10-17': [{ kind: 'event', title: '실제 서버 일정', timeLabel: '10:00' }] } }, { today: '2026-10-17', family });
    const text = allNodes(widget).map(node => node.value || '').join(' ');
    assert.match(text, /실제 서버 일정/);
    assert.match(text, /저장된 사본 · 09:15/);
  }
});

for (const operation of ['switch', 'disconnect', 'same-account-relogin']) {
  test(`pending refresh cannot undo ${operation}`, async () => {
    const w = await loadWidget();
    const store = memoryStore({ session: existingSession({ expiresAt: 1, connectionId: 'connection-a' }) });
    let resolveRefresh;
    const pending = w.loadAgenda({ store, now: 1000, today: '2026-10-17', transport: path => path.startsWith('/auth/') ? new Promise(resolve => { resolveRefresh = resolve; }) : Promise.resolve([{ events: [{ title: 'Previous private data', date: '2026-10-17' }] }]) });
    if (operation === 'disconnect') store.remove('session');
    else store.set('session', existingSession({ userId: operation === 'switch' ? 'user-b' : 'user-a', connectionId: 'connection-b' }));
    resolveRefresh({ user: { id: 'user-a' }, access_token: 'late-access', refresh_token: 'late-refresh', expires_in: 3600 });
    const result = await pending;
    assert.deepEqual(Object.keys(result.days), []);
    assert.equal(store.get('session')?.connectionId ?? null, operation === 'disconnect' ? null : 'connection-b');
    assert.equal(store.get('cache'), null);
  });
}

test('a delayed read cannot display previous-account content or replace new-account cache', async () => {
  const w = await loadWidget();
  const store = memoryStore({ session: existingSession({ connectionId: 'a' }) });
  let resolveRead;
  const pending = w.loadAgenda({ store, now: 1000, today: '2026-10-17', transport: () => new Promise(resolve => { resolveRead = resolve; }) });
  store.set('session', existingSession({ userId: 'user-b', connectionId: 'b' }));
  store.set('cache', { userId: 'user-b', days: {} });
  resolveRead([{ events: [{ title: 'Previous private data', date: '2026-10-17' }] }]);
  const result = await pending;
  assert.deepEqual(Object.keys(result.days), []);
  assert.equal(store.get('cache').userId, 'user-b');
});

test('a late auth rejection cannot disconnect the newly selected account', async () => {
  const w = await loadWidget();
  const store = memoryStore({ session: existingSession({ expiresAt: 1, connectionId: 'a' }) });
  let rejectRefresh;
  const pending = w.loadAgenda({ store, now: 1000, today: '2026-10-17', transport: () => new Promise((resolve, reject) => { rejectRefresh = reject; }) });
  store.set('session', existingSession({ userId: 'user-b', connectionId: 'b' }));
  rejectRefresh(Object.assign(new Error('revoked'), { status: 400 }));
  await pending;
  assert.equal(store.get('session').userId, 'user-b');
});
