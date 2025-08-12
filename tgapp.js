// tgapp.js v15 — стабильные табы, создание/вход, баланс, донат

// ====== НАСТРОЙКА БЭКА ======
const API_BASE = 'https://eldest-gabbey-didimka-team-ba6a197d.koyeb.app' ; // ← ПОМЕНЯЙ на свой Koyeb домен

// ====== УТИЛЫ ======
const $ = (s,r=document)=>r.querySelector(s);
const $all = (s,r=document)=>Array.from(r.querySelectorAll(s));
function base(){ return API_BASE.replace(/\/$/,''); }
function toast(m){ alert(m); }
function setBusy(btn, busy, busyText){
  if (!btn) return;
  if (!btn.__label) btn.__label = btn.textContent;
  btn.disabled = !!busy;
  btn.textContent = busy ? (busyText || 'Загрузка…') : btn.__label;
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

// ====== ТАБЫ ======
function showScreen(key){
  $all('.screen').forEach(s=>s.classList.remove('active'));
  const el = $(`#screen-${key}`); if (el) el.classList.add('active');
  $all('nav.tabbar .tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===key));
}
function bindTabs(){
  $all('nav.tabbar .tab').forEach(btn=>{
    if (btn.__bound) return;
    btn.__bound = true;
    btn.addEventListener('click', ()=>showScreen(btn.dataset.tab));
  });
}

// ====== БАЛАНС ======
const BAL_KEY = 'nardy.balance';
function getLocalBalance(){ return Number(localStorage.getItem(BAL_KEY)||0) }
function setLocalBalance(v){
  localStorage.setItem(BAL_KEY, String(v));
  const el = $('#balance-amount'); if (el) el.textContent = v;
}
async function fetchBalance(){
  // Пытаемся спросить у бэка, иначе — локально
  try{
    // поддержка двух вариантов: /api/balance или /api/user/balance
    let data;
    try { data = await api('/api/balance'); }
    catch(e){ if (e.status===404) data = await api('/api/user/balance'); else throw e; }
    const amount = Number((data&&data.balance)||0);
    setLocalBalance(amount);
  }catch{
    setLocalBalance(getLocalBalance()); // инициализация локалкой
  }
}

// ====== ДОНАТ (демо, увеличивает баланс локально или через бэк) ======
async function donate(amount){
  amount = Number(amount||0);
  if (!amount) return;
  try{
    // если на бэке есть /api/donate — используем
    try { await api('/api/donate', {method:'POST', body:{amount}}); }
    catch(e){ if (e.status!==404) throw e; else setLocalBalance(getLocalBalance()+amount); }
    await fetchBalance();
    toast(`Спасибо! +${amount} монет на баланс 🥳`);
  }catch(e){
    toast(`Не удалось пополнить: ${e.message||e}`);
  }
}

// ====== ПРИСОЕДИНЕНИЕ: шит-диалог ======
function openJoinSheet(){ $('#join-sheet')?.classList.add('open'); }
function closeJoinSheet(){ $('#join-sheet')?.classList.remove('open'); }

// ====== ИГРОВАЯ ЛОГИКА ======
async function createRoom(btn){
  try{
    setBusy(btn, true, 'Создаём…');
    let data;
    // поддерживаем два апи: /api/room/create (рекоменд.) и /api/room (устар.)
    try{ data = await api('/api/room/create', {method:'POST'}); }
    catch(e){ if (e.status===404) data = await api('/api/room', {method:'POST'}); else throw e; }
    const code = (data && (data.code||data.id||data.room)) || '';
    if (!code) throw new Error('Пустой ответ сервера');
    toast(`Код комнаты: ${code}`);
  }catch(e){
    toast(`Не удалось создать игру: ${e.message||e}`);
  }finally{
    setBusy(btn,false);
  }
}

async function joinByCode(btn){
  const input = $('#joinCodeInput');
  const code = (input?.value||'').trim().toUpperCase();
  if (!code) return toast('Введи код комнаты');
  try{
    setBusy(btn,true,'Проверяем…');
    let data;
    try{ data = await api(`/api/room/lookup?code=${encodeURIComponent(code)}`); }
    catch(e){ if (e.status===404) data = await api(`/api/room?code=${encodeURIComponent(code)}`); else throw e; }
    // допустим, успешный ответ = {ok:true}
    toast(`Комната найдена: ${code}`);
    closeJoinSheet();
    // TODO: навигация в саму игру
  }catch(e){
    toast(`Не удалось присоединиться: ${e.message||e}`);
  }finally{
    setBusy(btn,false);
  }
}

async function quickMatch(btn){
  setBusy(btn,true,'Ищем…');
  // Плейсхолдер — в проде тут будет сокет/очередь
  setTimeout(()=>{
    setBusy(btn,false);
    toast('Соперник найден! (демо)');
  }, 700);
}

// ====== ПРИВЯЗКА КНОПОК ======
function bindGameButtons(){
  const bCreate = $('#btn-create');
  if (bCreate && !bCreate.__b){ bCreate.__b=true; bCreate.addEventListener('click', ()=>createRoom(bCreate)); }

  const bJoin = $('#btn-join');
  if (bJoin && !bJoin.__b){ bJoin.__b=true; bJoin.addEventListener('click', openJoinSheet); }

  const bJoinGo = $('#btn-join-by-code');
  if (bJoinGo && !bJoinGo.__b){ bJoinGo.__b=true; bJoinGo.addEventListener('click', ()=>joinByCode(bJoinGo)); }

  const bQm = $('#btn-quick-match');
  if (bQm && !bQm.__b){ bQm.__b=true; bQm.addEventListener('click', ()=>quickMatch(bQm)); }

  const closeA = $('#join-close'), closeB = $('#join-cancel');
  [closeA, closeB].forEach(x=>{ if(x && !x.__b){ x.__b=true; x.addEventListener('click', closeJoinSheet); }});

  // Donate grid
  $all('[data-donate]').forEach(btn=>{
    if (btn.__b) return; btn.__b=true;
    btn.addEventListener('click', ()=>donate(btn.dataset.donate));
  });
  const bDonateCustom = $('#btn-donate-custom');
  if (bDonateCustom && !bDonateCustom.__b){
    bDonateCustom.__b=true;
    bDonateCustom.addEventListener('click', ()=>{
      const raw = prompt('Сколько монет пополнить?');
      const val = Number(raw||0);
      if (val>0) donate(val);
    });
  }

  const saveProfile = $('#btn-save-profile');
  if (saveProfile && !saveProfile.__b){
    saveProfile.__b=true;
    saveProfile.addEventListener('click', ()=>{
      // демо: просто тост
      toast('Профиль сохранён ✅');
    });
  }
}

function bindAll(){
  bindTabs();
  bindGameButtons();
  document.body.dataset.app = 'ready';
}

// на всякий — следим за динамикой DOM
const mo = new MutationObserver(()=>bindAll());

// ====== СТАРТ ======
document.addEventListener('DOMContentLoaded', async ()=>{
  bindAll();
  if (!$('.screen.active')) showScreen('games');
  mo.observe(document.documentElement, {subtree:true, childList:true});

  // пингуем бэк, чтобы Koyeb прогрелся
  try { await api('/health'); } catch {}

  // подтянуть баланс
  await fetchBalance();
});
