// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;
try { tg?.expand(); tg?.enableClosingConfirmation?.(); } catch(e){}

// ======= Навигация вкладок =======
const sections = {
  profile: document.getElementById('screen-profile'),
  games: document.getElementById('screen-games'),
  themes: document.getElementById('screen-themes'),
};
const tabs = Array.from(document.querySelectorAll('[data-tab]'));

function showTab(name) {
  Object.entries(sections).forEach(([key, el]) => {
    el.classList.toggle('hidden', key !== name);
  });
  tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === name));
  localStorage.setItem('nardy:tab', name);
}

tabs.forEach(btn => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

// восстановим последнюю вкладку
showTab(localStorage.getItem('nardy:tab') || 'profile');

// ======= Профиль (локальное хранение) =======
const inpName = document.getElementById('name');
const inpNick = document.getElementById('nick');
const inpDob  = document.getElementById('dob');
const btnSave = document.getElementById('saveProfile');

const PROFILE_KEY = 'nardy:profile';

function loadProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return;
  try {
    const p = JSON.parse(raw);
    if (p.name) inpName.value = p.name;
    if (p.nick) inpNick.value = p.nick;
    if (p.dob)  inpDob.value  = p.dob;
  } catch(e){}
}
function saveProfile() {
  const p = {
    name: (inpName.value || '').trim(),
    nick: (inpNick.value || '').trim(),
    dob:  (inpDob.value  || '').trim(),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  tg?.showPopup?.({
    title: 'Готово',
    message: 'Профиль сохранён ✅',
    buttons: [{type:'ok'}]
  });
}
btnSave.addEventListener('click', saveProfile);
loadProfile();

// ======= Игры: отправка действий в бота =======
function sendToBot(action, payload) {
  try {
    tg?.sendData?.(JSON.stringify({ action, payload }));
  } catch(e) {
    console.error('sendData error', e);
  }
}

document.getElementById('btnCreate').addEventListener('click', () => {
  // можно приложить профиль к событию
  const profile = localStorage.getItem(PROFILE_KEY);
  sendToBot('create_room', { profile: profile ? JSON.parse(profile) : null });
});

document.getElementById('btnJoin').addEventListener('click', () => {
  document.getElementById('joinCode').focus();
});

document.getElementById('btnJoinGo').addEventListener('click', () => {
  const raw = document.getElementById('joinCode').value.trim();
  if (!raw) {
    tg?.showAlert?.('Введите код комнаты');
    return;
  }
  sendToBot('join_room', { code: raw });
});
