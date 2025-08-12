// tgapp.js v19 — делегирование кликов + поддержка всех наших id/классов,
// создание комнаты, ожидание соперника, вход по коду, простой debug.

// ===== НАСТРОЙКА БЭКА (ПОДСТАВЬ СВОЙ ДОМЕН) =====
const API_BASE = 'https://<ТВОЙ-ДОМЕН>.koyeb.app'; // например: https://eldest-gabbey-didimka-team-ba6a197d.koyeb.app
const API = () => API_BASE.replace(/\/+$/,'');

// ===== УТИЛЫ =====
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
function toast(m){ alert(m); }
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
    try{ const j=await res.json(); if(j?.detail) msg=j.detail; }catch{}
    throw new Error(msg);
  }
  const ct = res.headers.get('content-type')||'';
  return ct.includes('application/json') ? res.json() : res.text();
}

// ===== СОСТОЯНИЕ =====
const ST = { waitCode:null, poll:null };

// ===== ЛОГИКА =====
async function createRoom(btn){
  try{
    setBusy(btn,true,'Создаём…');
    // пробуем основной путь, если 404 — алиас
    let data;
    try{ data = await api('/api/rooms/create','POST'); }
    catch(e){ if(e.status===404) data = await api('/api/room/create','POST'); else throw e; }
    const code = data?.code;
    if(!code) throw new Error('Пустой ответ');
    toast('Код комнаты: '+code);
    startWaiting(code, btn);
  }catch(e){
    toast('Не удалось создать игру: '+e.message);
  }finally{
    setBusy(btn,false);
  }
}
function startWaiting(code, btn){
  ST.waitCode = code;
  setBusy(btn,true,'Ждём соперника…');
  const openJoin = $('#btn-join') || $('#btnOpenJoin') || $('[data-action="open-join"]');
  if(openJoin) openJoin.disabled = true;

  clearInterval(ST.poll);
  ST.poll = setInterval(async ()=>{
    try{
      const st = await api(`/api/rooms/${code}/status`);
      if(st.ready){
        clearInterval(ST.poll); ST.poll=null; ST.waitCode=null;
        setBusy(btn,false); if(openJoin) openJoin.disabled=false;
        toast('Соперник присоединился! Матч готов.');
      }
    }catch(err){
      clearInterval(ST.poll); ST.poll=null; ST.waitCode=null;
      setBusy(btn,false); if(openJoin) openJoin.disabled=false;
      toast('Комната недоступна: '+err.message);
    }
  }, 2500);
}

async function joinByCode(btn){
  const input = $('#joinCodeInput') || $('#joinCode') || $('input[name="join-code"]');
  const code = (input?.value||'').trim().toUpperCase();
  if(!code){ toast('Введи код комнаты'); return; }
  try{
    setBusy(btn,true,'Входим…');
    // минимальные данные игрока (если нужны — расширим)
    const me = { player_id:'', name:'', nick:'' };
    const r = await api(`/api/rooms/${code}/join`, 'POST', me);
    toast(`Ты в комнате ${r.code}. Роль: ${r.role}`);
    closeJoinSheet();
  }catch(e){
    toast('Не удалось войти: '+e.message);
  }finally{
    setBusy(btn,false);
  }
}

function openJoinSheet(){
  // если есть шторка
  const sheet = $('#join-sheet'); if(sheet){ sheet.classList.add('open'); return; }
  // fallback: плавно пролистать к блоку ввода
  const field = $('#joinCodeInput') || $('#joinCode') || $('input[name="join-code"]');
  if(field) field.scrollIntoView({behavior:'smooth', block:'center'});
}
function closeJoinSheet(){
  const sheet = $('#join-sheet'); if(sheet) sheet.classList.remove('open');
}

// ===== ДЕЛЕГИРОВАНИЕ КЛИКОВ (работает даже если кнопки появились позже) =====
function bindDelegated(){
  document.addEventListener('click', (ev)=>{
    const target = ev.target;

    // СОЗДАТЬ ИГРУ — поддерживаем разные id/классы
    const createBtn = target.closest('#btn-create, #btnCreateGame, .btn-create, [data-action="create"]');
    if(createBtn){ ev.preventDefault(); createRoom(createBtn); return; }

    // ОТКРЫТЬ «ПРИСОЕДИНИТЬСЯ»
    const openJoin = target.closest('#btn-join, #btnOpenJoin, .btn-open-join, [data-action="open-join"]');
    if(openJoin){ ev.preventDefault(); openJoinSheet(); return; }

    // ВОЙТИ ПО КОДУ
    const joinGo = target.closest('#btn-join-by-code, #btnJoinGo, .btn-join-go, [data-action="join-go"]');
    if(joinGo){ ev.preventDefault(); joinByCode(joinGo); return; }

    // Закрыть шторку
    const joinClose = target.closest('#join-close, #join-cancel, .btn-join-close');
    if(joinClose){ ev.preventDefault(); closeJoinSheet(); return; }
  }, { passive:true });
}

// ===== ТАБЫ (если разметка использует data-атрибуты — активируем) =====
function initTabsIfPresent(){
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

// ===== DEBUG =====
function enableDebug(){
  const u = new URL(location.href);
  if(u.searchParams.get('debug')==='1'){
    window.addEventListener('error', e=> alert('JS error: '+(e?.error?.message||e.message)));
    toast('Script ready v19');
  }
}

// ===== START =====
(function start(){
  enableDebug();
  bindDelegated();
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initTabsIfPresent, { once:true });
  } else {
    initTabsIfPresent();
  }
  document.documentElement.setAttribute('data-tgapp','v19');
  // быстрый пинг бэка — если упадёт, увидим при нажатии на кнопки
  fetch(API()+'/health').catch(()=>{});
})();
