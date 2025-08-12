// tgapp.js v14 — табы + создание/вход в комнату

// ==== НАСТРОЙКА БЭКА ====
const API_BASE = 'https://<ТВОЙ-ДОМЕН>.koyeb.app'; // подставь свой публичный домен Koyeb
function base(){ return API_BASE; }

// ==== УТИЛЫ ====
function $(s, r=document){ return r.querySelector(s); }
function $all(s, r=document){ return Array.from(r.querySelectorAll(s)); }
function toast(m){ alert(m); }
function setBusy(btn, busy, busyText, normalText){
  if (!btn) return;
  if (!btn.__label) btn.__label = btn.textContent;
  btn.disabled = !!busy;
  btn.textContent = busy ? (busyText || 'Загрузка…') : (normalText || btn.__label);
}
async function api(path, opts={}){
  const url = `${base()}${path}`;
  const init = { method:'GET', headers:{'Content-Type':'application/json'}, ...opts };
  if (init.body && typeof init.body !== 'string') init.body = JSON.stringify(init.body);
  const res = await fetch(url, init);
  let data=null; try{ data = await res.json(); }catch{}
  if (!res.ok){
    const msg = (data && (data.detail||data.message)) || `HTTP ${res.status}`;
    const e = new Error(msg); e.status = res.status; e.data = data; throw e;
  }
  return data;
}

// ==== ТАБЫ (нижняя навигация) ====
function showScreen(key){
  // ожидаем id у секций: #screen-profile, #screen-games, #screen-themes
  $all('.screen').forEach(s => s.classList.remove('active'));
  const el = $(`#screen-${key}`);
  if (el) el.classList.add('active');

  // подсветка активного таба
  $all('nav.tabbar .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === key));
}

function bindTabs(){
  $all('nav.tabbar .tab').forEach(btn=>{
    if (btn.__bound) return;
    btn.__bound = true;
    btn.addEventListener('click', ()=>{
      const key = btn.dataset.tab; // profile | games | themes
      if (!key) return;
      showScreen(key);
    });
  });
}

// ==== ЛИСТ "ПРИСОЕДИНИТЬСЯ" ====
function openJoinSheet(){ $('#join-sheet')?.classList.add('open'); }
function closeJoinSheet(){ $('#join-sheet')?.classList.remove('open'); }

// ==== ИГРОВЫЕ ДЕЙСТВИЯ ====
async function createRoom(btn){
  try{
    setBusy(btn, true, 'Создаём…', '🎲 Создать игру');
    let data;
    try{ data = await api('/api/room/create', {method:'POST'}); }
    catch(e){ if (e.status===404) data = await api('/api/room', {method:'POST'}); else throw e; }
    const code = (data && (data.code||data.id||data.room)) || '';
    if (!code) throw new Error('Пустой ответ сервера');
    toast(`Код комнаты: ${code}`);
  }catch(e){
    toast(`Не удалось создать игру: ${e.message||e}`);
  }finally{
    setBusy(btn, false);
  }
}

async function joinByCode(btn){
  const input = $('#joinCodeInput');
  const raw = (input?.value||'').trim().toUpperCase();
  if (!raw) return toast('Введи код комнаты');
  try{
    setBusy(btn, true, 'Проверяем…', 'Войти');
    let data;
    try{ data = await api(`/api/room/lookup?code=${encodeURIComponent(raw)}`); }
    catch(e){ if (e.status===404) data = await api(`/api/room?code=${encodeURIComponent(raw)}`); else throw e; }
    toast(`Комната найдена: ${raw}`);
    closeJoinSheet();
    // TODO: переход на экран игры
  }catch(e){
    toast(`Не удалось присоединиться: ${e.message||e}`);
  }finally{
    setBusy(btn, false);
  }
}

// ==== ПРИВЯЗКИ ОБРАБОТЧИКОВ ====
function bindGameButtons(){
  const createBtn = $('#btn-create');
  if (createBtn && !createBtn.__bound){
    createBtn.__bound = true;
    createBtn.addEventListener('click', ()=>createRoom(createBtn));
  }
  const openJoin = $('#btn-join');
  if (openJoin && !openJoin.__bound){
    openJoin.__bound = true;
    openJoin.addEventListener('click', openJoinSheet);
  }
  const joinGo = $('#btn-join-by-code');
  if (joinGo && !joinGo.__bound){
    joinGo.__bound = true;
    joinGo.addEventListener('click', ()=>joinByCode(joinGo));
  }
}

function bindAll(){
  bindTabs();
  bindGameButtons();
  document.body.dataset.app = 'ready';
}

// На случай динамики
const mo = new MutationObserver(()=>bindAll());

// ==== СТАРТ ====
document.addEventListener('DOMContentLoaded', ()=>{
  bindAll();
  // открыть экран "Игры" по умолчанию, если ничего не выбрано
  if (!$('.screen.active')) showScreen('games');

  // быстрый пинг бэка — необязателен
  api('/health').catch(()=>{ /* ок, при нажатии увидим ошибку */ });

  mo.observe(document.documentElement, {subtree:true, childList:true});
});
