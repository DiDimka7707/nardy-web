// tgapp.js v16 — стабильные табы + создание комнаты, ожидание, вход по коду

// ====== НАСТРОЙКА БЭКА ======
const API_BASE = 'https://YOUR-KOYEB-APP-DOMAIN.koyeb.app'; // ← поменяй при необходимости

// ====== УТИЛЫ ======
const $ = (s, r = document) => r.querySelector(s);
const $all = (s, r = document) => Array.from(r.querySelectorAll(s));
function base() { return API_BASE.replace(/\/+$/, ''); }
function toast(m) { alert(m); }

function setBusy(btn, busy, busyText) {
  if (!btn) return;
  if (!btn.__label) btn.__label = btn.textContent?.trim() || '';
  btn.disabled = !!busy;
  btn.textContent = busy ? (busyText || 'Загрузка…') : btn.__label;
}

// API helper
async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(base() + path, opts);
  if (!res.ok) {
    let text = 'HTTP ' + res.status;
    try { const j = await res.json(); if (j.detail) text = j.detail; } catch {}
    throw new Error(text);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

// ====== ГЛОБАЛЬНОЕ СОСТОЯНИЕ ======
let state = {
  waiting: null,    // код комнаты, если ждём
  timer: null,      // id setInterval для пуллинга
};

// ====== ПРОФИЛЬ (для join) ======
function readProfile() {
  const name = $('#profileName')?.value?.trim() || '';
  const nick = $('#profileNick')?.value?.trim() || '';
  const player_id = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || '';
  return { name, nick, player_id };
}

// ====== UI ЭЛЕМЕНТЫ (ожидаем такие id в верстке) ======
const btnCreate = $('#btnCreateGame') || $("[data-tab='games'] .btn-create") || $("[data-action='create']");
const btnOpenJoin = $('#btnOpenJoin') || $("[data-action='open-join']");
const joinInput = $('#joinCode') || $("input[name='join-code']");
const joinGoBtn = $('#btnJoinGo') || $("[data-action='join-go']");

// Если у тебя другие id — не беда: просто навесь нужные id в HTML, как здесь.

// ====== СОЗДАТЬ КОМНАТУ ======
async function onCreate() {
  try {
    setBusy(btnCreate, true, 'Создаём…');
    const { code } = await api('/api/rooms/create', 'POST');
    // Показать код и запустить ожидание
    toast('Код комнаты: ' + code);
    startWaiting(code);
  } catch (e) {
    toast('Не удалось создать игру: ' + e.message);
  } finally {
    setBusy(btnCreate, false);
  }
}

function startWaiting(code) {
  // блокируем кнопки и показываем статус
  state.waiting = code;
  btnCreate.__label = 'Создать игру';
  btnCreate.textContent = 'Ждём соперника…';
  btnCreate.disabled = true;
  if (btnOpenJoin) btnOpenJoin.disabled = true;

  // опрос статуса комнаты
  clearInterval(state.timer);
  state.timer = setInterval(async () => {
    try {
      const st = await api(`/api/rooms/${code}/status`);
      if (st.ready) {
        clearInterval(state.timer);
        state.timer = null;
        state.waiting = null;
        btnCreate.disabled = false;
        if (btnOpenJoin) btnOpenJoin.disabled = false;
        btnCreate.textContent = btnCreate.__label;
        toast('Соперник присоединился! Матч готов.');
        // здесь сможем перейти в "лобби" матча
      }
    } catch (e) {
      // если комната исчезла/ошибка — разжимаем UI
      clearInterval(state.timer);
      state.timer = null;
      state.waiting = null;
      btnCreate.disabled = false;
      if (btnOpenJoin) btnOpenJoin.disabled = false;
      btnCreate.textContent = btnCreate.__label;
      toast('Комната недоступна: ' + e.message);
    }
  }, 2500);
}

// ====== ПРИСОЕДИНИТЬСЯ ПО КОДУ ======
async function onJoinGo() {
  const code = (joinInput?.value || '').trim().toUpperCase();
  if (!code || code.length < 4) {
    toast('Введи код комнаты, например: 7B7FX');
    return;
  }
  try {
    setBusy(joinGoBtn, true, 'Входим…');
    const body = readProfile();
    const res = await api(`/api/rooms/${code}/join`, 'POST', body);
    toast(`Ты в комнате ${res.code}. Твоя роль: ${res.role}`);
    // можно сразу опросить статус, если хочешь поймать «готово»
    try {
      const st = await api(`/api/rooms/${code}/status`);
      if (st.ready) {
        // оба в комнате — можно переключаться в лобби
      }
    } catch {}
  } catch (e) {
    toast('Не удалось войти: ' + e.message);
  } finally {
    setBusy(joinGoBtn, false);
  }
}

// ====== ПРИВЯЗКА СОБЫТИЙ ======
if (btnCreate) btnCreate.addEventListener('click', onCreate);
if (joinGoBtn) joinGoBtn.addEventListener('click', onJoinGo);

// Если у тебя своя нижняя шторка «Присоединиться» — просто оставь её как есть,
// важно, чтобы в ней были input с id="joinCode" и кнопка с id="btnJoinGo".
