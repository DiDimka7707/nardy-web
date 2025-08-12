// tgapp.js — ПОЛНАЯ ЗАМЕНА

// ==== НАСТРОЙКИ ====
// при необходимости поменяй домен на свой
const API_BASE = localStorage.getItem('NARDY_API_BASE') ||
  'https://eldest-gabbey-didimka-team-ba6a197d.koyeb.app';

// ==== TELEGRAM WEBAPP ====
const TG = window.Telegram?.WebApp;
if (TG) { try { TG.expand(); } catch {} }

function pop(msg, title = 'Готово') {
  if (TG?.showPopup) TG.showPopup({ title, message: msg, buttons: [{ type: 'ok' }] });
  else alert(msg);
}
function haptic(type = 'impact') { try { TG?.HapticFeedback?.impactOccurred?.(type); } catch {} }

// ==== УТИЛИТЫ ====
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);

function uid(){ return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
function getPlayerId(){
  let id = localStorage.getItem('NARDY_PLAYER_ID');
  if (!id){ id = uid(); localStorage.setItem('NARDY_PLAYER_ID', id); }
  return id;
}
function getProfile(){
  const raw = localStorage.getItem('NARDY_PROFILE');
  let p = raw ? JSON.parse(raw) : {};
  if (!p.name) p.name = $('#name')?.value?.trim() || TG?.initDataUnsafe?.user?.first_name || 'Игрок';
  if (!p.nick) p.nick = $('#nick')?.value?.trim() || TG?.initDataUnsafe?.user?.username || 'guest';
  return p;
}
function saveProfile(){
  const p = {
    name: $('#name')?.value?.trim() || '',
    nick: $('#nick')?.value?.trim() || '',
    dob:  $('#dob')?.value?.trim()  || ''
  };
  localStorage.setItem('NARDY_PROFILE', JSON.stringify(p));
  haptic('soft'); pop('Профиль сохранён');
}
async function api(path, { method='GET', body, headers } = {}){
  const res = await fetch(API_BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers||{}) },
    body: body===undefined ? undefined : JSON.stringify(body)
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(typeof data==='string' ? data : (data?.detail||`HTTP ${res.status}`));
  return data;
}
function setLoading(btn, on, text='Загрузка…'){
  if (!btn) return;
  if (!btn.dataset._orig) btn.dataset._orig = btn.textContent;
  btn.disabled = !!on; btn.textContent = on ? text : btn.dataset._orig;
}

// ==== ТАБЫ (нижние кнопки) ====
function showScreen(name){
  // экраны имеют id: screen-profile / screen-games / screen-themes
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === `screen-${name}`));
  $$('.tabbar .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
}
function initTabs(){
  // навешиваем клики на нижние кнопки
  $$('.tabbar .tab').forEach(btn=>{
    btn.addEventListener('click', ()=> showScreen(btn.dataset.tab));
  });
  // стартовый таб — тот, что уже помечен active, иначе profile
  const active = $('.tabbar .tab.active') || $('.tabbar .tab[data-tab="profile"]');
  showScreen(active?.dataset.tab || 'profile');
}

// ==== ЭЛЕМЕНТЫ ====
const el = {
  btnCreate: $('#createGameBtn'),
  joinInput: $('#joinCodeInput'),
  btnJoin:   $('#joinSubmitBtn'),
  btnQueue:  $('#quickMatchBtn'),
  btnSave:   $('#saveProfileBtn'),
};

// ==== ДЕЙСТВИЯ ====
async function createRoom(){
  const pid = getPlayerId();
  const prof = getProfile();
  setLoading(el.btnCreate, true, 'Создаём…');
  try{
    const r = await api('/api/rooms/create', { method:'POST', body:{ host_id: pid, host_name: prof.name || prof.nick || 'Игрок' }});
    haptic('rigid'); pop(`Код комнаты: ${r.code}`, 'Комната создана');
  }catch(e){ pop('Не удалось создать игру: ' + e.message, 'Ошибка'); }
  finally{ setLoading(el.btnCreate, false); }
}
async function joinByCode(){
  const raw = el.joinInput?.value || '';
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);
  if (!code) return pop('Введи код комнаты (5 символов)', 'Подсказка');
  const pid = getPlayerId(); const prof = getProfile();
  setLoading(el.btnJoin, true, 'Входим…');
  try{
    await api(`/api/rooms/${code}/join`, { method:'POST', body:{ player_id: pid, player_name: prof.name || prof.nick || 'Игрок' }});
    haptic('soft'); pop(`Комната найдена: ${code}`, 'Успешно');
  }catch(e){ pop('Не удалось войти: ' + e.message, 'Ошибка'); }
  finally{ setLoading(el.btnJoin, false); }
}
async function quickMatch(){
  const pid = getPlayerId(); const prof = getProfile();
  setLoading(el.btnQueue, true, 'Ищем…');
  try{
    const r = await api('/api/matchmaking/enqueue', { method:'POST', body:{ player_id: pid, player_name: prof.name || prof.nick || 'Игрок' }});
    if (r.matched && r.code){ setLoading(el.btnQueue,false); haptic('rigid'); return pop(`Соперник найден! Код: ${r.code}`, 'Быстрый матч'); }
    // поллинг
    const timer = setInterval(async ()=>{
      try{
        const p = await api(`/api/matchmaking/poll?player_id=${encodeURIComponent(pid)}`);
        if (p.matched && p.code){ clearInterval(timer); setLoading(el.btnQueue,false); haptic('rigid'); pop(`Соперник найден! Код: ${p.code}`, 'Быстрый матч'); }
      }catch{ clearInterval(timer); setLoading(el.btnQueue,false); pop('Поиск прерван. Попробуй ещё раз.', 'Ошибка'); }
    }, 1800);
  }catch(e){ setLoading(el.btnQueue,false); pop('Не удалось встать в очередь: ' + e.message, 'Ошибка'); }
}

// ==== BIND/UI ====
function initProfileForm(){
  const p = getProfile();
  if ($('#name')) $('#name').value = p.name || '';
  if ($('#nick')) $('#nick').value = p.nick || '';
  if ($('#dob'))  $('#dob').value  = p.dob  || '';
}
function bindUI(){
  el.btnSave?.addEventListener('click', (e)=>{ e.preventDefault(); saveProfile(); });
  el.btnCreate?.addEventListener('click', createRoom);
  el.btnJoin?.addEventListener('click', joinByCode);
  el.btnQueue?.addEventListener('click', quickMatch);
  el.joinInput?.addEventListener('input', ()=>{ el.joinInput.value = el.joinInput.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5); });
}

// ==== STARTUP ====
document.addEventListener('DOMContentLoaded', ()=>{
  initTabs();         // ← добавили это: включает нижние кнопки
  initProfileForm();
  bindUI();
  // быстрая проверка доступности API
  fetch(API_BASE + '/health').catch(()=> pop('API недоступно. Проверь адрес в tgapp.js', 'Внимание'));
});

// Возможность сменить API без редеплоя
window.nardySetApiBase = (url)=>{
  if (!/^https?:\/\//.test(url)) return pop('Полный URL, напр. https://xxx.koyeb.app', 'Подсказка');
  localStorage.setItem('NARDY_API_BASE', url.replace(/\/+$/,''));
  pop('API-адрес сохранён. Перезапусти мини-app.');
};
