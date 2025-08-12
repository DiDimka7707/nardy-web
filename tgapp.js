// tgapp.js v18 — делегирование кликов, безопасный старт, debug, API-утилы.

// ====== НАСТРОЙКА БЭКА ======
const API_BASE =
  (window.__API_BASE__ || '').trim() ||
  'https://YOUR-KOYEB-APP-DOMAIN.koyeb.app'; // ← ПОМЕНЯЙ на свой домен
const API = () => (API_BASE || '').replace(/\/+$/,'');

// ====== УТИЛИТЫ ======
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
  const res = await fetch(API()+path, {
    method,
    headers: { 'Content-Type':'application/json' },
    body: body ? JSON.stringify(body) : null
  });
  if(!res.ok){
    let msg = 'HTTP '+res.status;
    try { const j = await res.json(); if(j?.detail) msg = j.detail; } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get('content-type') || '';
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

// ====== ГЛОБАЛЬНО ======
const ST = { waitCode:null, poll:null };

// ====== ЛОГИКА ======
async function doCreate(btn){
  try{
    setBusy(btn, true, 'Создаём…');
    const { code } = await api('/api/rooms/create','POST');
    toast('Код комнаты: ' + code);
    startWait(code, btn);
  }catch(e){ toast('Не удалось создать игру: ' + e.message); }
  finally{ setBusy(btn, false); }
}
function startWait(code, btn){
  ST.waitCode = code;
  setBusy(btn, true, 'Ждём соперника…');
  const joinOpen = $('#btnOpenJoin') || $('[data-action="open-join"]');
  if(joinOpen) joinOpen.disabled = true;

  clearInterval(ST.poll);
  ST.poll = setInterval(async ()=>{
    try{
      const st = await api(`/api/rooms/${code}/status`);
      if(st.ready){
        clearInterval(ST.poll); ST.poll=null; ST.waitCode=null;
        setBusy(btn, false); if(joinOpen) joinOpen.disabled=false;
        toast('Соперник присоединился! Матч готов.');
      }
    }catch(err){
      clearInterval(ST.poll); ST.poll=null; ST.waitCode=null;
      setBusy(btn, false); if(joinOpen) joinOpen.disabled=false;
      toast('Комната недоступна: '+err.message);
    }
  }, 2500);
}
async function doJoin(btn){
  const inp = $('#joinCode') || $('input[name="join-code"]');
  const code = (inp?.value || '').trim().toUpperCase();
  if(!code || code.length<4){ toast('Введи код комнаты, например 7B7FX'); return; }
  try{
    setBusy(btn, true, 'Входим…');
    const me = readProfile();
    const r = await api(`/api/rooms/${code}/join`, 'POST', me);
    toast(`Ты в комнате ${r.code}. Роль: ${r.role}`);
  }catch(e){ toast('Не удалось войти: ' + e.message); }
  finally{ setBusy(btn, false); }
}

// ====== ДЕЛЕГИРОВАНИЕ КЛИКОВ ======
function bindDelegatedClicks(){
  document.addEventListener('click', (ev)=>{
    const createBtn = ev.target.closest('#btnCreateGame, [data-action="create"], .btn-create');
    if(createBtn){ ev.preventDefault(); doCreate(createBtn); return; }

    const joinBtn = ev.target.closest('#btnJoinGo, [data-action="join-go"], .btn-join-go');
    if(joinBtn){ ev.preventDefault(); doJoin(joinBtn); return; }
  }, { passive:true });
}

// ====== ТАБЫ (если есть data-атрибуты) ======
function initTabsIfAny(){
  const views = $$('[data-screen]');
  const tabs  = $$('[data-tab]');
  if(!views.length || !tabs.length) return;
  const show = (n)=>{
    views.forEach(v=> v.hidden = v.dataset.screen!==n);
    tabs.forEach(t=> t.classList.toggle('active', t.dataset.tab===n));
    try{ localStorage.setItem('nardy_tab', n); }catch{}
  };
  tabs.forEach(t=> t.addEventListener('click', ()=>show(t.dataset.tab)));
  show(localStorage.getItem('nardy_tab') || tabs[0].dataset.tab);
}

// ====== DEBUG ======
function enableDebugIfAsked(){
  const u = new URL(location.href);
  if(u.searchParams.get('debug')==='1'){
    window.addEventListener('error', e => alert('JS error: '+(e?.error?.message||e.message)));
    toast('Debug ON');
  }
}

// ====== START ======
(function start(){
  enableDebugIfAsked();
  bindDelegatedClicks();
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initTabsIfAny, { once:true });
  } else {
    initTabsIfAny();
  }
  document.documentElement.setAttribute('data-tgapp','v18');
  console.log('tgapp.js v18 ready');
})();
