// ====== КОНФИГ ======
const API_BASE = 'https://<ТВОЙ_СЕРВИС_НА_KOYEB>.koyeb.app'; // ВСТАВЬ СЮДА БАЗУ API
// пример: https://subtle-annabell-nardy-bot.koyeb.app

// ====== УТИЛЫ ======
const $ = (sel) => document.querySelector(sel);
const show = (id) => { document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); $(id).classList.add('active'); };
const toast = (t) => alert(t); // простая заглушка
const GET = (u) => fetch(u).then(r => r.json());
const POST = (u, body) => fetch(u, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r => r.json());

const storage = {
  get k(){ return JSON.parse(localStorage.getItem('profile')||'{}'); },
  set k(v){ localStorage.setItem('profile', JSON.stringify(v)); }
};

const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

// ====== ТАБЫ ======
document.querySelectorAll('.tabbar .tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tabbar .tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    if (tab==='profile') show('#screen-profile');
    if (tab==='games')   show('#screen-games');
    if (tab==='themes')  show('#screen-themes');
  });
});

// ====== ПРОФИЛЬ ======
const nameInput = $('#nameInput');
const nickInput = $('#nickInput');
const bdInput   = $('#bdInput');

const saved = storage.k;
if (saved.name) nameInput.value = saved.name;
if (saved.nick) nickInput.value = saved.nick;
if (saved.bd)   bdInput.value   = saved.bd;

$('#saveProfileBtn').addEventListener('click', ()=>{
  const name = nameInput.value.trim();
  const nick = nickInput.value.trim();
  const bd   = bdInput.value.trim();
  if (!name || !nick || !bd){ toast('Заполни все поля'); return; }
  storage.k = { name, nick, bd };
  toast('Профиль сохранён ✅');
});

// ====== ИГРЫ ======
const joinSheet = $('#joinSheet');
const openSheet = ()=> joinSheet.classList.add('open');
const closeSheet= ()=> joinSheet.classList.remove('open');
$('#joinBtn').addEventListener('click', openSheet);
$('#closeSheetBtn').addEventListener('click', closeSheet);

$('#createBtn').addEventListener('click', async ()=>{
  const prof = storage.k;
  if (!prof.name){ toast('Сначала сохрани профиль'); return; }

  const userId = (tg && tg.initDataUnsafe?.user?.id) ? String(tg.initDataUnsafe.user.id) : 'web-'+crypto.randomUUID();
  const resp = await POST(`${API_BASE}/api/room/new`, {
    creator_id: userId,
    nickname: prof.nick || prof.name
  });

  if (resp.detail){ toast(resp.detail); return; }
  enterRoom(resp);
});

$('#joinByCodeBtn').addEventListener('click', async ()=>{
  const code = $('#joinCodeInput').value.trim().toUpperCase();
  if (!code) return;
  const prof = storage.k;
  if (!prof.name){ toast('Сначала сохрани профиль'); return; }

  const userId = (tg && tg.initDataUnsafe?.user?.id) ? String(tg.initDataUnsafe.user.id) : 'web-'+crypto.randomUUID();
  const resp = await POST(`${API_BASE}/api/room/join`, {
    code, user_id: userId, nickname: prof.nick || prof.name
  });

  if (resp.detail){ toast(resp.detail); return; }
  closeSheet();
  enterRoom(resp);
});

$('#quickMatchBtn').addEventListener('click', ()=>{
  toast('Скоро сделаем подбор соперника 🙂');
});

// ====== КОМНАТА ======
let current = null;       // текущее состояние
let pollTimer = null;

function enterRoom(state){
  current = state;
  $('#roomCode').textContent = state.code;
  $('#turnWho').textContent  = state.turn || '—';
  $('#d1').textContent = state.dice ? state.dice[0] : '–';
  $('#d2').textContent = state.dice ? state.dice[1] : '–';
  $('#boardBox').textContent = 'Поле скоро появится 🙂';

  show('#screen-room');
  ensureTabsOnGames(); // подсветка таба "Игры"

  // старт пуллинга
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(pollRoom, 1500);
}

async function pollRoom(){
  if (!current) return;
  try{
    const s = await GET(`${API_BASE}/api/room/state?code=${current.code}`);
    if (s.version !== current.version){
      current = s;
      $('#turnWho').textContent  = s.turn || '—';
      $('#d1').textContent = s.dice ? s.dice[0] : '–';
      $('#d2').textContent = s.dice ? s.dice[1] : '–';
    }
  }catch(e){
    // ignore
  }
}

$('#rollBtn').addEventListener('click', async ()=>{
  if (!current) return;
  const userId = (tg && tg.initDataUnsafe?.user?.id) ? String(tg.initDataUnsafe.user.id) : 'web-'+crypto.randomUUID();
  const resp = await POST(`${API_BASE}/api/room/roll`, { code: current.code, user_id: userId });
  if (resp.detail){ toast(resp.detail); return; }
  current = resp;
  $('#d1').textContent = resp.dice ? resp.dice[0] : '–';
  $('#d2').textContent = resp.dice ? resp.dice[1] : '–';
  $('#turnWho').textContent = resp.turn || '—';
});

function ensureTabsOnGames(){
  document.querySelectorAll('.tabbar .tab').forEach(b=>b.classList.remove('active'));
  document.querySelector('.tabbar .tab[data-tab="games"]').classList.add('active');
}

// стартовая вкладка — Профиль
show('#screen-profile');
