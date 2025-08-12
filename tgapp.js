// tgapp.js v17 — ждём DOM, стабильные табы (если есть data-атрибуты),
// создание комнаты, ожидание соперника, вход по коду, мягкий debug.

// ===== НАСТРОЙКА БЭКА =====
const API_BASE = 'https://YOUR-KOYEB-APP-DOMAIN.koyeb.app'; // ← ПОМЕНЯЙ при необходимости
function base() { return (API_BASE || '').replace(/\/+$/, ''); }

// ===== УТИЛЫ =====
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
function toast(m){ try{window.Telegram?.WebApp?.showAlert?.(m);}catch{} alert(m); }
function setBusy(btn, busy, busyText){
  if(!btn) return;
  if(!btn.__label) btn.__label = (btn.textContent||'').trim();
  btn.disabled = !!busy;
  btn.textContent = busy ? (busyText || 'Загрузка…') : btn.__label;
}
async function api(path, method='GET', body=null){
  const res = await fetch(base()+path, {
    method,
    headers: { 'Content-Type':'application/json' },
    body: body ? JSON.stringify(body) : null
  });
  if(!res.ok){
    let msg = 'HTTP '+res.status;
    try{ const j=await res.json(); if(j?.detail) msg=j.detail; }catch{}
    throw new Error(msg);
  }
  const ct = res.headers.get('content-type')||'';
  return ct.includes('application/json') ? res.json() : res.text();
}
function readProfile(){
  const id = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  return {
    player_id: id ? String(id) : '',
    name: $('#profileName')?.value?.trim() || '',
    nick: $('#profileNick')?.value?.trim() || ''
  };
}

// ===== ГЛОБАЛЬНОЕ СОСТОЯНИЕ =====
const ST = { waitingCode:null, pollId:null };

// ===== ЛОГИКА ИГРЫ =====
async function onCreate(btn){
  try{
    setBusy(btn, true, 'Создаём…');
    const { code } = await api('/api/rooms/create','POST');
    toast('Код комнаты: ' + code);
    startWaiting(code, btn);
  }catch(e){ toast('Не удалось создать игру: '+e.message); }
  finally{ setBusy(btn, false); }
}
function startWaiting(code, btn){
  ST.waitingCode = code;
  setBusy(btn, true, 'Ждём соперника…');
  const joinOpen = $('#btnOpenJoin') || $('[data-action="open-join"]');
  if(joinOpen) joinOpen.disabled = true;

  clearInterval(ST.pollId);
  ST.pollId = setInterval(async () => {
    try{
      const st = await api(`/api/rooms/${code}/status`);
      if(st.ready){
        clearInterval(ST.pollId); ST.pollId=null; ST.waitingCode=null;
        setBusy(btn, false);
        if(joinOpen) joinOpen.disabled = false;
        toast('Соперник присоединился! Матч готов.');
        // здесь можно переключать экран в "лобби" матча
      }
    }catch(err){
      clearInterval(ST.pollId); ST.pollId=null; ST.waitingCode=null;
      setBusy(btn, false); if(joinOpen) joinOpen.disabled=false;
      toast('Комната недоступна: '+err.message);
    }
  }, 2500);
}
async function onJoin(btn){
  const inp = $('#joinCode') || $('input[name="join-code"]');
  const raw = (inp?.value || '').trim().toUpperCase();
  if(!raw || raw.length < 4){ toast('Введи код комнаты, например 7B7FX'); return; }
  try{
    setBusy(btn, true, 'Входим…');
    const me = readProfile();
    const r = await api(`/api/rooms/${raw}/join`, 'POST', me);
    toast(`Ты в комнате ${r.code}. Твоя роль: ${r.role}`);
    try{
      const st = await api(`/api/rooms/${raw}/status`);
      if(st.ready){
        // можно открыть лобби
      }
    }catch{}
  }catch(e){ toast('Не удалось войти: '+e.message); }
  finally{ setBusy(btn, false); }
}

// ===== ТАБЫ (включатся, если верстка использует data-атрибуты) =====
function initTabs(){
  const views = $$('[data-screen]');
  const tabs  = $$('[data-tab]');
  if(!views.length || !tabs.length) return; // ничего не делаем если разметка другая

  function show(name){
    views.forEach(v => v.hidden = v.dataset.screen !== name);
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    try{ localStorage.setItem('nardy_tab', name); }catch{}
  }
  tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.tab)));
  const initial = localStorage.getItem('nardy_tab') || tabs[0].dataset.tab;
  show(initial);
}

// ===== DEBUG =====
function maybeEnableDebug(){
  const u = new URL(location.href);
  if(u.searchParams.get('debug') === '1'){
    window.addEventListener('error', (e)=> alert('JS error: '+(e?.error?.message || e.message)));
    toast('Debug mode ON');
  }
}

// ===== INIT после загрузки DOM =====
function bindUI(){
  // Кнопки «Создать игру» и «Открыть присоединение»
  const createBtn = $('#btnCreateGame') || $('[data-action="create"]') || $('.btn-create');
  if(createBtn) createBtn.addEventListener('click', ()=>onCreate(createBtn));

  // В модалке «Присоединиться»
  const joinBtn = $('#btnJoinGo') || $('[data-action="join-go"]') || $('.btn-join-go');
  if(joinBtn) joinBtn.addEventListener('click', ()=>onJoin(joinBtn));

  // Инициализируем табы, если разметка поддерживает
  initTabs();

  // Метка версии (для проверки кеша)
  document.documentElement.setAttribute('data-tgapp', 'v17');
  console.log('tgapp.js v17 ready');
}

document.addEventListener('DOMContentLoaded', ()=>{
  maybeEnableDebug();
  bindUI();
});
