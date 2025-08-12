// tgapp.js v13 — стабильные обработчики для кнопок "Создать игру" и "Присоединиться"

// >>> ВСТАВЬ сюда свой публичный домен Koyeb <<<
const API_BASE = 'https://<ТВОЙ-ДОМЕН>.koyeb.app'; 
// Пример: 'https://eldest-gabbey-didimka-team-ba6a197d.koyeb.app'
// Если оставишь плейсхолдер — код сам не угадает. Обязательно подставь!

function base() { return API_BASE; }

async function api(path, opts = {}) {
  const url = `${base()}${path}`;
  const init = {
    method: 'GET',
    headers: {'Content-Type':'application/json'},
    ...opts
  };
  if (init.body && typeof init.body !== 'string') init.body = JSON.stringify(init.body);

  const res = await fetch(url, init);
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    const e = new Error(msg); e.status = res.status; e.data = data; throw e;
  }
  return data;
}

function $(s){ return document.querySelector(s); }
function toast(m){ alert(m); }
function setBusy(btn, busy, busyText, normalText){
  if (!btn) return;
  if (!btn.__label) btn.__label = btn.textContent;
  btn.disabled = !!busy;
  btn.textContent = busy ? (busyText || 'Загрузка…') : (normalText || btn.__label);
}

// Открытие/закрытие листа по join
function openJoinSheet(){
  const sheet = $('#join-sheet');
  if (sheet) sheet.classList.add('open');
}
function closeJoinSheet(){
  const sheet = $('#join-sheet');
  if (sheet) sheet.classList.remove('open');
}

// Создать комнату
async function createRoom(btn){
  try {
    setBusy(btn, true, 'Создаём…', '🎲 Создать игру');
    let data;
    try {
      data = await api('/api/room/create', {method:'POST'});
    } catch(e) {
      if (e.status === 404) data = await api('/api/room', {method:'POST'});
      else throw e;
    }
    const code = (data && (data.code || data.id || data.room)) || '';
    if (!code) throw new Error('Пустой ответ сервера');
    toast(`Код комнаты: ${code}`);
  } catch (e) {
    toast(`Не удалось создать игру: ${e.message || e}`);
  } finally {
    setBusy(btn, false);
  }
}

// Присоединиться по коду
async function joinByCode(btn){
  const input = $('#joinCodeInput');
  const raw = (input && input.value || '').trim().toUpperCase();
  if (!raw) return toast('Введи код комнаты');
  try {
    setBusy(btn, true, 'Проверяем…', 'Войти');
    let data;
    try {
      data = await api(`/api/room/lookup?code=${encodeURIComponent(raw)}`);
    } catch (e) {
      if (e.status === 404) data = await api(`/api/room?code=${encodeURIComponent(raw)}`);
      else throw e;
    }
    toast(`Комната найдена: ${raw}`);
    // TODO: переход в игру, когда появится экран игры
    closeJoinSheet();
  } catch (e) {
    toast(`Не удалось присоединиться: ${e.message || e}`);
  } finally {
    setBusy(btn, false);
  }
}

// Привязки (жёстко к id, без делегирования — чтобы исключить конфликт стилей/оверлеев)
function bind(){
  const createBtn = $('#btn-create');
  const openJoin  = $('#btn-join');
  const joinGo    = $('#btn-join-by-code');

  if (createBtn && !createBtn.__bound) {
    createBtn.addEventListener('click', () => createRoom(createBtn));
    createBtn.__bound = true;
  }
  if (openJoin && !openJoin.__bound) {
    openJoin.addEventListener('click', openJoinSheet);
    openJoin.__bound = true;
  }
  if (joinGo && !joinGo.__bound) {
    joinGo.addEventListener('click', () => joinByCode(joinGo));
    joinGo.__bound = true;
  }

  // Маркер, что скрипт реально загрузился
  document.body.dataset.app = 'ready';
}

// На случай динамических перерисовок — ребиндим
const mo = new MutationObserver(()=>bind());
document.addEventListener('DOMContentLoaded', ()=>{
  bind();
  // быстрый пинг бэка — если упадёт, сразу увидим алерт по действиям
  api('/health').catch(()=>{ /* молчим, кнопки сами покажут ошибку при нажатии */ });
});
mo.observe(document.documentElement, {subtree:true, childList:true});
