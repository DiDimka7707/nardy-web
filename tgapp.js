// tgapp.js v12 — обработчики для "Создать игру" и "Присоединиться"

// 1) ВСТАВЬ сюда свой публичный URL сервиса Koyeb (Overview → Public URL)
const API_BASE = 'https://<ТВОЙ-домен>.koyeb.app';

// Если забудешь поменять — попробуем угадать из location.origin
const _apiBase = API_BASE.includes('<ТВОЙ-домен>') ? null : API_BASE;
function base() {
  return _apiBase || (location.origin.includes('koyeb.app') ? location.origin : API_BASE);
}

// Универсальный fetch с JSON/ошибками
async function api(path, opts = {}) {
  const url = `${base()}${path}`;
  const init = {
    method: 'GET',
    headers: {'Content-Type': 'application/json'},
    ...opts
  };
  if (init.body && typeof init.body !== 'string') init.body = JSON.stringify(init.body);

  const res = await fetch(url, init);
  let data = null;
  try { data = await res.json(); } catch { /* текст/пусто — ок */ }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// UI helpers
function toast(msg){ alert(msg); }
function $(sel){ return document.querySelector(sel); }
function setBusy(btn, busy, textWhenBusy, textNormal){
  if (!btn) return;
  if (!btn.__label) btn.__label = btn.textContent;
  btn.disabled = !!busy;
  btn.textContent = busy ? (textWhenBusy || 'Загрузка…') : (textNormal || btn.__label);
}

// ====== ЛОГИКА ИГРЫ ======

// Создать комнату: сначала пытаемся /api/room/create, если 404 — /api/room (обратная совместимость)
async function createRoom(btn){
  try{
    setBusy(btn, true, 'Создаём…', '🎲 Создать игру');
    let data;
    try {
      data = await api('/api/room/create', {method: 'POST'});
    } catch (e) {
      if (e.status === 404) data = await api('/api/room', {method: 'POST'});
      else throw e;
    }
    const code = (data && (data.code || data.id || data.room)) || '';
    if (!code) throw new Error('Пустой ответ сервера');
    toast(`Код комнаты: ${code}`);
  } catch (e){
    toast(`Не удалось создать игру: ${e.message || e}`);
  } finally {
    setBusy(btn, false);
  }
}

// Открыть нижнюю панель/лист для присоединения (если он у тебя есть)
function openJoinSheet(){
  // Если у тебя модал с id="join-sheet"
  const sheet = $('#join-sheet');
  if (sheet) sheet.classList.add('open');
  // Если вместо модала отдельный экран — просто переключи вкладку
  const joinSection = $('#join-block');
  if (joinSection) joinSection.scrollIntoView({behavior:'smooth', block:'start'});
}

// Присоединиться по коду (из поля ввода)
async function joinByCode(btn){
  try{
    const input = $('#joinCodeInput, #joinCode, input[name="roomCode"]');
    const raw = (input && input.value || '').trim().toUpperCase();
    if (!raw) return toast('Введи код комнаты');

    setBusy(btn, true, 'Проверяем…', 'Войти');

    // сначала /api/room/lookup?code=, если 404 — /api/room?code=
    let data;
    try {
      data = await api(`/api/room/lookup?code=${encodeURIComponent(raw)}`);
    } catch (e){
      if (e.status === 404) data = await api(`/api/room?code=${encodeURIComponent(raw)}`);
      else throw e;
    }
    // считаем, что успех, если вернулся объект/строка без ошибки
    toast(`Комната найдена: ${raw}`);
    // тут можно сделать переход в саму игру, когда она будет готова
  } catch (e){
    toast(`Не удалось присоединиться: ${e.message || e}`);
  } finally {
    setBusy(btn, false);
  }
}

// ====== ПРИВЯЗКА КНОПОК (делегирование) ======
function initButtons(){
  document.addEventListener('click', (e)=>{
    const b = e.target.closest('button');
    if (!b) return;
    const id = (b.id || '').toLowerCase();

    // поддерживаем несколько вариантов id, чтобы не лазить в вёрстку
    if (['btn-create','creategamebtn','create_game_btn'].includes(id)) {
      e.preventDefault(); createRoom(b); return;
    }
    if (['btn-join','joinopenbtn','openjoinbtn','join_btn'].includes(id)) {
      e.preventDefault(); openJoinSheet(); return;
    }
    if (['btn-join-by-code','joingo','joingobtn','join_by_code_btn'].includes(id)) {
      e.preventDefault(); joinByCode(b); return;
    }
  });
}

// На всякий — проверка здоровья, чтобы быстрее поймать проблемы с бэкендом
async function quickHealthPing(){
  try { await api('/health'); } catch(e){
    console.warn('Health check failed:', e);
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  initButtons();
  quickHealthPing();
});
