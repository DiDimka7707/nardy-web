// tgapp.js — ПОЛНАЯ ЗАМЕНА

// ==== НАСТРОЙКИ ====
// !!! ЗАМЕНИ на свой домен Koyeb:
const API_BASE = localStorage.getItem('NARDY_API_BASE') ||
  'https://eldest-gabbey-didimka-team-ba6a197d.koyeb.app';

// ==== TELEGRAM WEBAPP ====
const TG = window.Telegram?.WebApp;
if (TG) {
  try { TG.expand(); } catch {}
}

function pop(msg, title = 'Готово') {
  if (TG?.showPopup) TG.showPopup({ title, message: msg, buttons: [{ type: 'ok' }] });
  else alert(msg);
}

function haptic(type = 'impact') {
  try { TG?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

// ==== УТИЛИТЫ ====
function uid() {
  return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getPlayerId() {
  let id = localStorage.getItem('NARDY_PLAYER_ID');
  if (!id) {
    id = uid();
    localStorage.setItem('NARDY_PLAYER_ID', id);
  }
  return id;
}

function getProfile() {
  const raw = localStorage.getItem('NARDY_PROFILE');
  let p = raw ? JSON.parse(raw) : {};
  if (!p.name) p.name = document.querySelector('#name')?.value?.trim();
  if (!p.nick) p.nick = document.querySelector('#nick')?.value?.trim();
  if (!p.name) p.name = (TG?.initDataUnsafe?.user?.first_name || 'Игрок');
  if (!p.nick) p.nick = (TG?.initDataUnsafe?.user?.username || 'guest');
  return p;
}

function saveProfile() {
  const p = {
    name: document.querySelector('#name')?.value?.trim() || '',
    nick: document.querySelector('#nick')?.value?.trim() || '',
    dob:  document.querySelector('#dob')?.value?.trim()  || ''
  };
  localStorage.setItem('NARDY_PROFILE', JSON.stringify(p));
  haptic('soft');
  pop('Профиль сохранён');
}

async function api(path, { method = 'GET', body, headers } = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + path, opts);
  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) data = await res.json();
  else data = await res.text();

  if (!res.ok) {
    const msg = typeof data === 'string' ? data : (data?.detail || JSON.stringify(data));
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  return data;
}

function setLoading(btn, isLoading, textWhile = 'Загрузка…') {
  if (!btn) return;
  if (!btn.dataset._orig) btn.dataset._orig = btn.textContent;
  btn.disabled = !!isLoading;
  btn.textContent = isLoading ? textWhile : btn.dataset._orig;
}

// ==== ЭЛЕМЕНТЫ ====
const el = {
  btnCreate: document.querySelector('#createGameBtn'),
  joinInput: document.querySelector('#joinCodeInput'),
  btnJoin:   document.querySelector('#joinSubmitBtn'),
  btnQueue:  document.querySelector('#quickMatchBtn'),
  btnSave:   document.querySelector('#saveProfileBtn'),
};

let pollTimer = null;

// ==== ДЕЙСТВИЯ ====
async function createRoom() {
  const pid = getPlayerId();
  const prof = getProfile();
  setLoading(el.btnCreate, true, 'Создаём…');
  try {
    const r = await api('/api/rooms/create', {
      method: 'POST',
      body: { host_id: pid, host_name: prof.name || prof.nick || 'Игрок' }
    });
    haptic('rigid');
    pop(`Код комнаты: ${r.code}`, 'Комната создана');
  } catch (e) {
    pop('Не удалось создать игру: ' + e.message, 'Ошибка');
  } finally {
    setLoading(el.btnCreate, false);
  }
}

async function joinByCode() {
  const codeRaw = el.joinInput?.value || '';
  const code = codeRaw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  if (!code) return pop('Введи код комнаты (5 символов)', 'Подсказка');

  const pid = getPlayerId();
  const prof = getProfile();
  setLoading(el.btnJoin, true, 'Входим…');
  try {
    await api(`/api/rooms/${code}/join`, {
      method: 'POST',
      body: { player_id: pid, player_name: prof.name || prof.nick || 'Игрок' }
    });
    haptic('soft');
    pop(`Комната найдена: ${code}`, 'Успешно');
  } catch (e) {
    pop('Не удалось войти: ' + e.message, 'Ошибка');
  } finally {
    setLoading(el.btnJoin, false);
  }
}

async function quickMatch() {
  const pid = getPlayerId();
  const prof = getProfile();
  setLoading(el.btnQueue, true, 'Ищем…');
  try {
    const r = await api('/api/matchmaking/enqueue', {
      method: 'POST',
      body: { player_id: pid, player_name: prof.name || prof.nick || 'Игрок' }
    });
    if (r.matched && r.code) {
      haptic('rigid');
      setLoading(el.btnQueue, false);
      return pop(`Соперник найден! Код: ${r.code}`, 'Быстрый матч');
    }
    // ждём
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      try {
        const p = await api(`/api/matchmaking/poll?player_id=${encodeURIComponent(pid)}`);
        if (p.matched && p.code) {
          clearInterval(pollTimer);
          pollTimer = null;
          setLoading(el.btnQueue, false);
          haptic('rigid');
          pop(`Соперник найден! Код: ${p.code}`, 'Быстрый матч');
        }
      } catch (e) {
        // в случае ошибки остановим и дадим попробовать ещё раз
        clearInterval(pollTimer);
        pollTimer = null;
        setLoading(el.btnQueue, false);
        pop('Поиск прерван: ' + e.message, 'Ошибка');
      }
    }, 1800);
  } catch (e) {
    setLoading(el.btnQueue, false);
    pop('Не удалось встать в очередь: ' + e.message, 'Ошибка');
  }
}

// ==== ПРОФИЛЬ / ТАБЫ (минимум) ====
function initProfileForm() {
  const stored = getProfile();
  if (stored.name && document.querySelector('#name')) document.querySelector('#name').value = stored.name;
  if (stored.nick && document.querySelector('#nick')) document.querySelector('#nick').value = stored.nick;
  if (stored.dob  && document.querySelector('#dob'))  document.querySelector('#dob').value  = stored.dob;
}

function bindUI() {
  el.btnCreate?.addEventListener('click', createRoom);
  el.btnJoin?.addEventListener('click', joinByCode);
  el.btnQueue?.addEventListener('click', quickMatch);
  el.btnSave?.addEventListener('click', (e) => {
    e.preventDefault();
    saveProfile();
  });

  // ограничим ввод кода
  el.joinInput?.addEventListener('input', () => {
    el.joinInput.value = el.joinInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initProfileForm();
  bindUI();
  // Проверка доступности API (не обязательно)
  fetch(API_BASE + '/health').catch(() => {
    pop('API недоступно. Проверь адрес сервера в tgapp.js (API_BASE).', 'Внимание');
  });
});

// Экспорт вспомогательной функции (если захочешь сменить домен без редеплоя)
window.nardySetApiBase = (url) => {
  if (!/^https?:\/\//.test(url)) return pop('Нужен полный URL, например: https://xxx.koyeb.app', 'Подсказка');
  localStorage.setItem('NARDY_API_BASE', url.replace(/\/+$/, ''));
  pop('API-адрес сохранён. Перезагрузи мини-app.');
};
