// ====== НАСТРОЙКИ API ======
const API_BASE = 'https://eldest-gabbey-didimka-team-ba6a197d.koyeb.app'; // твой Koyeb

// ====== УТИЛИТЫ ======
const $ = (sel) => document.querySelector(sel);
const byId = (id) => document.getElementById(id);

function toast(msg){ alert(msg); } // простой алерт; при желании заменим на красиво

function setVisible(el, v){
  if (!el) return;
  el.style.display = v ? '' : 'none';
}

// ====== ВКЛАДКИ ======
function showScreen(name){
  ['profile','games','themes'].forEach(n=>{
    const scr = byId(`screen-${n}`);
    const tab = document.querySelector(`.tab[data-tab="${n}"]`);
    if (scr) scr.classList.toggle('active', n===name);
    if (tab) tab.classList.toggle('active', n===name);
  });
}

function bindTabs(){
  document.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=> showScreen(btn.dataset.tab));
  });
}

// ====== ПРОФИЛЬ ======
const LS = {
  name: 'nardy_name',
  nick: 'nardy_nick',
  birth: 'nardy_birth',
};

function loadProfile(){
  const name = localStorage.getItem(LS.name) || '';
  const nick = localStorage.getItem(LS.nick) || '';
  const birth = localStorage.getItem(LS.birth) || '';
  byId('in-name').value = name;
  byId('in-nick').value = nick;
  if (birth) byId('in-birth').value = birth;
}

function saveProfile(){
  const name = byId('in-name').value.trim();
  const nick = byId('in-nick').value.trim();
  const birth = byId('in-birth').value;
  localStorage.setItem(LS.name, name);
  localStorage.setItem(LS.nick, nick);
  localStorage.setItem(LS.birth, birth || '');
  toast('Профиль сохранён ✅');
}

// ====== JOIN SHEET ======
function openJoinSheet(open){
  const back = byId('join-backdrop');
  const sheet = byId('join-sheet');
  if (open){
    setVisible(back,true);
    back.style.display = 'block';
    sheet.classList.add('open');
  } else {
    setVisible(back,false);
    sheet.classList.remove('open');
  }
}

// ====== API ВСПОМОГАТЕЛЬНЫЕ ======
async function apiCreateRoom(){
  const r = await fetch(`${API_BASE}/api/rooms/create`, { method:'POST' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function apiGetRoom(code){
  const r = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(code)}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ====== BIND UI ======
function bindUI(){
  // профиль
  byId('btn-save-profile')?.addEventListener('click', saveProfile);

  // игры
  byId('btn-create-game')?.addEventListener('click', async (ev)=>{
    const btn = ev.currentTarget;
    try{
      btn.disabled = true; btn.textContent = 'Создаём...';
      const data = await apiCreateRoom();
      toast(`Код комнаты: ${data.code}`);
      // тут позже — переход на экран игры
    }catch(e){
      toast(`Не удалось создать игру: ${e.message}`);
    }finally{
      btn.disabled = false; btn.textContent = '🎲 Создать игру';
    }
  });

  byId('btn-open-join')?.addEventListener('click', ()=> openJoinSheet(true));
  byId('btn-close-join')?.addEventListener('click', ()=> openJoinSheet(false));
  byId('join-backdrop')?.addEventListener('click', ()=> openJoinSheet(false));

  byId('btn-join-by-code')?.addEventListener('click', async ()=>{
    const code = (byId('join-code-input').value || '').trim();
    if (!code){ toast('Введи код комнаты'); return; }
    try{
      const data = await apiGetRoom(code);
      toast(`Комната найдена: ${data.code}`);
      // тут позже — вход в комнату/экран ожидания
      openJoinSheet(false);
    }catch(e){
      toast(`Не удалось войти: ${e.message}`);
    }
  });

  byId('btn-quick-match')?.addEventListener('click', ()=>{
    toast('Скоро добавим быстрый матч 🔜');
  });
}

// ====== ИНИЦ ======
document.addEventListener('DOMContentLoaded', async ()=>{
  bindTabs();
  bindUI();
  loadProfile();

  // быстрая проверка API, чтобы сразу было ясно если домен не тот
  try{
    const r = await fetch(`${API_BASE}/health`);
    if (!r.ok){ console.warn('health not ok', r.status); }
  }catch(e){
    console.warn('health error', e);
    toast('⚠️ Не могу достучаться до API. Проверь домен в tgapp.js (API_BASE).');
  }
});
