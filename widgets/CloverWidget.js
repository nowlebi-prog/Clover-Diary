// Clover Diary · Scriptable · v1.1 · 로그인 오류 진단
// 아이폰 Scriptable에서 실행하세요. 비밀번호는 저장하지 않습니다.
// 웹 다이어리와 같은 이메일로 로그인하세요. 위젯은 기록을 읽기만 합니다.
const CLOVER_CONFIG = /*CLOVER_CONFIG*/ null;
const CLOVER_SITE = 'https://clover-diary-orpin.vercel.app';

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function addDays(key, count) {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + count);
  return dateKey(d);
}
function weekKeys(today) {
  const weekday = new Date(`${today}T12:00:00`).getDay();
  const mondayOffset = -((weekday + 6) % 7);
  return Array.from({ length: 7 }, (_, i) => addDays(today, mondayOffset + i));
}
function clockTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ''));
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return '';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}
function selectAgenda(data, today) {
  const rows = [];
  const append = (item, kind) => {
    if (!item || typeof item !== 'object' || item.completed || item.archived || item.isUnscheduled) return;
    const start = kind === 'todo' ? item.dueDate : item.date;
    if (kind === 'event' && !start) return;
    const end = item.endDate && item.endDate >= start ? item.endDate : start;
    const continuing = start && start < today && end >= today;
    const overdue = kind === 'todo' && start && end < today;
    if (start && !(start <= today && today <= end) && !overdue) return;
    const allDay = Boolean(item.allDay || item.isAllDay);
    const from = clockTime(item.startTime || item.time || item.dueTime);
    const to = clockTime(item.endTime);
    let timeLabel = allDay ? '종일' : continuing ? '계속' : from ? `${from}${to ? `–${to}` : ''}` : kind === 'todo' ? '할 일' : '시간 미정';
    if (overdue) timeLabel = '기한 지남';
    rows.push({ id: String(item.id || ''), kind, title: String(item.title || item.name || '제목 없는 일정').slice(0, 160), timeLabel,
      sort: overdue ? '25:00' : allDay ? '00:00' : continuing ? '00:01' : from || '24:00',
      important: Boolean(item.todayMust || item.important || item.priority === 'high') });
  };
  (Array.isArray(data.events) ? data.events : []).forEach(item => append(item, 'event'));
  (Array.isArray(data.todos) ? data.todos : []).forEach(item => append(item, 'todo'));
  return rows.sort((a, b) => a.sort.localeCompare(b.sort) || Number(b.important) - Number(a.important) || a.title.localeCompare(b.title));
}
function sessionFromResponse(result, now, expectedUser, connectionId) {
  if (!result || !result.user || !result.user.id || !result.access_token || !result.refresh_token || (expectedUser && result.user.id !== expectedUser)) {
    throw Object.assign(new Error('로그인이 필요해요.'), { auth: true });
  }
  return { userId: result.user.id, connectionId: connectionId || `${now}-${Math.random().toString(36).slice(2)}`, email: result.user.email || '', accessToken: result.access_token,
    refreshToken: result.refresh_token, expiresAt: Number(result.expires_at) || now + Number(result.expires_in || 3600) };
}
async function loadAgenda({ store, transport, now = Date.now() / 1000, today = dateKey(new Date()) }) {
  let session = store.get('session');
  if (!session || !session.userId || !session.refreshToken) return { state: 'login', days: {} };
  const userId = session.userId;
  const connectionId = session.connectionId || userId;
  const isActive = () => {
    const current = store.get('session');
    return current && current.userId === userId && (current.connectionId || current.userId) === connectionId;
  };
  const requireActive = () => { if (!isActive()) throw Object.assign(new Error('계정 연결이 바뀌었어요.'), { changed: true }); };
  const refresh = async () => {
    requireActive();
    // Another widget may already have rotated the session in the same Keychain.
    const current = store.get('session');
    if (current && current.userId === session.userId && current.accessToken !== session.accessToken && current.expiresAt > now + 90) {
      session = current;
      return;
    }
    let response;
    try {
      response = await transport('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refreshToken } });
    } catch (error) {
      if (error.status === 400 || error.status === 401 || error.status === 403) error.auth = true;
      throw error;
    }
    requireActive();
    session = sessionFromResponse(response, now, userId, connectionId);
    store.set('session', session);
  };
  try {
    if (!session.accessToken || session.expiresAt <= now + 90) await refresh();
    requireActive();
    const read = () => transport(`/rest/v1/app_data?user_id=eq.${encodeURIComponent(session.userId)}&select=updated_at,events:data->events,todos:data->todos&limit=1`, { token: session.accessToken });
    let response;
    try { response = await read(); }
    catch (error) {
      requireActive();
      if (error.status !== 401) throw error;
      await refresh();
      requireActive();
      try { response = await read(); }
      catch (retryError) { if (retryError.status === 401 || retryError.status === 403) retryError.auth = true; throw retryError; }
    }
    requireActive();
    if (!Array.isArray(response) || response.length > 1) throw new Error('서버 응답을 확인할 수 없어요.');
    const snapshot = response[0] || {};
    if ((snapshot.events != null && !Array.isArray(snapshot.events)) || (snapshot.todos != null && !Array.isArray(snapshot.todos))) throw new Error('일정 형식을 확인할 수 없어요.');
    const days = Object.fromEntries(weekKeys(today).map(day => [day, selectAgenda(snapshot, day).slice(0, 30)]));
    const cache = { userId, connectionId, fetchedAt: now, days };
    requireActive();
    store.set('cache', cache);
    requireActive();
    return { ...cache, state: 'fresh' };
  } catch (error) {
    if (!isActive() || error.changed) return { state: 'changed', days: {} };
    if (error.auth || error.status === 403) {
      store.remove('session'); store.remove('cache');
      return { state: 'login', days: {} };
    }
    const cache = store.get('cache');
    if (cache && cache.userId === userId && (!cache.connectionId || cache.connectionId === connectionId) && cache.days) return { ...cache, state: 'cached' };
    return { state: 'error', days: {} };
  }
}

function keychainStore(profile) {
  const prefix = `clover-widget:v1:${CLOVER_CONFIG.url}:${profile}:`;
  return {
    get(key) { try { return Keychain.contains(prefix + key) ? JSON.parse(Keychain.get(prefix + key)) : null; } catch { return null; } },
    set(key, value) { Keychain.set(prefix + key, JSON.stringify(value)); },
    remove(key) { if (Keychain.contains(prefix + key)) Keychain.remove(prefix + key); }
  };
}
async function requestCloud(path, options = {}) {
  const request = new Request(CLOVER_CONFIG.url + path);
  request.method = options.method || 'GET';
  request.timeoutInterval = 12;
  // Do not forward authenticated requests to another host through a redirect.
  request.onRedirect = () => null;
  const headers = { apikey: CLOVER_CONFIG.key, Accept: 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body) { headers['Content-Type'] = 'application/json'; request.body = JSON.stringify(options.body); }
  request.headers = headers;
  const raw = await request.loadString();
  const status = request.response && request.response.statusCode;
  if (!status || status < 200 || status >= 300) {
    let payload; try { payload = JSON.parse(raw); } catch {}
    const knownCodes = ['invalid_credentials', 'email_not_confirmed', 'user_banned', 'over_request_rate_limit', 'over_email_send_rate_limit', 'captcha_failed', 'validation_failed', 'provider_disabled', 'unexpected_failure'];
    const code = knownCodes.includes(payload?.error_code) ? payload.error_code : /invalid api key/i.test(payload?.message || '') ? 'invalid_api_key' : 'unknown';
    throw Object.assign(new Error('서버에 연결하지 못했어요.'), { status, code });
  }
  try { return JSON.parse(raw); } catch { throw new Error('서버 응답을 확인할 수 없어요.'); }
}
async function signIn(store) {
  const alert = new Alert();
  alert.title = '클로버 위젯 로그인';
  alert.message = '다이어리에서 쓰는 이메일·비밀번호를 입력하세요. 비밀번호는 저장하지 않고, 로그인 연결과 일정 사본은 아이폰 Keychain에 보관합니다.';
  alert.addTextField('이메일');
  alert.addSecureTextField('비밀번호');
  alert.addAction('로그인'); alert.addCancelAction('취소');
  if (await alert.presentAlert() === -1) return false;
  try {
    const email = alert.textFieldValue(0).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Object.assign(new Error('이메일 주소가 필요해요.'), { code: 'email_required' });
    const response = await requestCloud('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password: alert.textFieldValue(1) } });
    const session = sessionFromResponse(response, Date.now() / 1000);
    // Remove the old account's agenda before exposing the new identity.
    store.remove('cache'); store.set('session', session);
    return true;
  } catch (error) {
    const failure = new Alert(); failure.title = '로그인하지 못했어요';
    const messages = {
      email_required: '아이디 대신 @가 포함된 다이어리 계정 이메일을 입력해주세요. 예전 로컬 아이디와 Supabase 대시보드 로그인은 별도입니다.',
      invalid_credentials: '서버가 이메일·비밀번호 조합을 거절했어요. Safari의 다이어리에서 같은 이메일·비밀번호로 새로 로그인되는지 확인해주세요. 기존 로그인 상태만으로는 비밀번호 확인이 되지 않습니다.',
      email_not_confirmed: '이메일 인증이 완료되지 않았어요. 가입 확인 메일의 인증을 완료해주세요.',
      invalid_api_key: '위젯의 서버 연결 설정을 확인해야 해요. 설치 안내에서 최신 코드를 다시 복사해주세요.',
      user_banned: '서버에서 이 계정의 로그인을 제한했어요.',
      captcha_failed: '서버에서 CAPTCHA 확인을 요청했어요. 위젯 연결 방식을 확인해야 합니다.',
      provider_disabled: '서버에서 이메일 로그인을 허용하지 않고 있어요.'
    };
    const message = messages[error.code] || (error.status === 429 ? '로그인 요청이 많아요. 잠시 후 다시 시도해주세요.' : error.status ? '로그인 서버가 요청을 거절했어요. 아래 진단 코드를 알려주세요.' : '서버 응답을 받지 못했어요. 네트워크와 Supabase 프로젝트 상태를 확인해주세요.');
    failure.message = `${message}\n\n위젯 v1.1 · HTTP ${error.status || '없음'} · ${error.code || 'network_or_response'}`;
    failure.addAction('확인'); await failure.presentAlert();
    return false;
  }
}
function renderWidget(result, { today = dateKey(new Date()), family = 'medium', profile = 'personal', scriptName = 'CloverWidget' } = {}) {
  const large = family === 'large';
  const small = family === 'small';
  const ink = new Color('#17372D');
  const muted = new Color('#78867F');
  const green = new Color('#298261');
  const connected = result.state === 'fresh' || result.state === 'cached';
  const widget = new ListWidget();
  widget.backgroundColor = new Color('#FCFDFC');
  widget.setPadding(large ? 16 : 10, large ? 16 : 12, 10, large ? 16 : 12);
  widget.url = `${CLOVER_SITE}/schedule?date=${today}`;
  widget.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  const text = (parent, value, size, color = ink, bold = false) => {
    const node = parent.addText(String(value));
    node.font = bold ? Font.boldSystemFont(size) : Font.systemFont(size);
    node.textColor = color; node.lineLimit = 1; node.minimumScaleFactor = 0.8;
    return node;
  };
  const header = widget.addStack(); header.centerAlignContent();
  text(header, 'Clover Diary', large ? 16 : 13, ink, true);
  header.addSpacer();
  if (!small) {
    const plus = header.addStack(); if (connected) plus.url = `${CLOVER_SITE}/schedule?date=${today}`;
    text(plus, '+', 21, green);
  }
  widget.addSpacer(large ? 10 : 4);
  if (!small) {
    const week = widget.addStack();
    weekKeys(today).forEach((day, index) => {
      if (index) week.addSpacer();
      const cell = week.addStack(); cell.layoutVertically(); cell.centerAlignContent();
      cell.size = new Size(large ? 34 : 28, large ? 42 : 31);
      cell.cornerRadius = 8; if (connected) cell.url = `${CLOVER_SITE}/schedule?date=${day}`;
      if (day === today) cell.backgroundColor = new Color('#E7F4EC');
      text(cell, ['월', '화', '수', '목', '금', '토', '일'][index], large ? 10 : 8, muted).centerAlignText();
      cell.addSpacer(2);
      text(cell, Number(day.slice(-2)), large ? 16 : 13, day === today ? green : ink, true).centerAlignText();
    });
  } else text(widget, `${Number(today.slice(5, 7))}월 ${Number(today.slice(8))}일`, 19, green, true);
  widget.addSpacer(large ? 12 : 5);
  const statusMessage = { login: 'Scriptable에서 로그인해주세요', changed: '계정이 바뀌었어요. 다시 실행해주세요', error: '연결을 확인하고 다시 실행해주세요', setup: '설치 안내에서 코드를 다시 복사해주세요' }[result.state];
  if (statusMessage) {
    text(widget, statusMessage, 12, muted);
    widget.url = `scriptable:///run?scriptName=${encodeURIComponent(scriptName)}&profile=${encodeURIComponent(profile)}`;
  } else {
    if (large) { text(widget, '오늘의 일정과 할 일', 11, muted, true); widget.addSpacer(7); }
    const items = result.days[today] || [];
    const count = small ? 2 : large ? 7 : 3;
    if (!items.length) text(widget, result.state === 'cached' && !result.days[today] ? '오늘 기록을 새로 불러와주세요' : '오늘 예정된 일정이 없어요', 12, muted);
    items.slice(0, count).forEach(item => {
      const row = widget.addStack(); row.centerAlignContent(); row.size = new Size(0, large ? 28 : 20);
      row.url = item.kind === 'todo' ? `${CLOVER_SITE}/tasks` : `${CLOVER_SITE}/schedule?date=${today}`;
      text(row, item.kind === 'todo' ? '○' : '·', 14, green, true); row.addSpacer(6);
      text(row, item.title, large ? 13 : 11, ink, item.important); row.addSpacer();
      if (!small) text(row, item.timeLabel, large ? 11 : 9, item.timeLabel === '기한 지남' ? new Color('#B96A51') : muted);
    });
    if (large && items.length > count) text(widget, `외 ${items.length - count}개 · 눌러서 전체 보기`, 10, muted);
  }
  widget.addSpacer();
  let stamp = '로그인 연결 필요';
  if (result.fetchedAt) {
    const fetched = new Date(result.fetchedAt * 1000);
    const time = `${String(fetched.getHours()).padStart(2, '0')}:${String(fetched.getMinutes()).padStart(2, '0')}`;
    const date = dateKey(fetched) === today ? '' : `${Number(dateKey(fetched).slice(5, 7))}/${Number(dateKey(fetched).slice(8))} `;
    stamp = `${result.state === 'cached' ? '저장된 사본' : '최근 확인'} · ${date}${time}`;
  }
  if (profile !== 'personal') stamp += ` · ${profile}`;
  text(widget, stamp, 8, result.state === 'cached' ? new Color('#B17D37') : muted);
  return widget;
}
async function runScriptable() {
  const rawProfile = String(args.widgetParameter || args.queryParameters.profile || 'personal');
  const profile = /^[a-zA-Z0-9_-]{1,32}$/.test(rawProfile) ? rawProfile : 'personal';
  let family = config.widgetFamily || 'medium';
  if (!CLOVER_CONFIG || !CLOVER_CONFIG.url || !CLOVER_CONFIG.key) {
    const widget = renderWidget({ state: 'setup', days: {} }, { family, profile, scriptName: Script.name() });
    Script.setWidget(widget);
    if (!config.runsInWidget) await widget.presentMedium();
    Script.complete(); return;
  }
  const store = keychainStore(profile);
  if (!config.runsInWidget) {
    if (!store.get('session')) { if (!await signIn(store)) { Script.complete(); return; } }
    else {
      const menu = new Alert(); menu.title = '클로버 위젯';
      menu.message = `${store.get('session').email || '연결된 계정'}\n프로필: ${profile}`;
      menu.addAction('중간 위젯 새로고침'); menu.addAction('큰 위젯 새로고침');
      menu.addAction('계정 바꾸기'); menu.addDestructiveAction('이 위젯 연결 해제'); menu.addCancelAction('취소');
      const choice = await menu.presentSheet();
      if (choice === -1) { Script.complete(); return; }
      if (choice === 3) { store.remove('session'); store.remove('cache'); Script.complete(); return; }
      if (choice === 2 && !await signIn(store)) { Script.complete(); return; }
      family = choice === 1 ? 'large' : 'medium';
    }
  }
  const result = await loadAgenda({ store, transport: requestCloud });
  const widget = renderWidget(result, { family, profile, scriptName: Script.name() });
  Script.setWidget(widget);
  if (!config.runsInWidget) { if (family === 'large') await widget.presentLarge(); else await widget.presentMedium(); }
  Script.complete();
}

if (typeof module !== 'undefined') module.exports = { dateKey, weekKeys, selectAgenda, loadAgenda, sessionFromResponse, renderWidget };
if (typeof Script !== 'undefined') await runScriptable();
