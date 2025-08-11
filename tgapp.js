// Telegram WebApp bootstrap
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Тема из Telegram
function applyTheme() {
  const dark = (tg.colorScheme || 'dark') === 'dark';
  document.documentElement.style.setProperty('--bg', dark ? '#0e1116' : '#f6f7fb');
  document.documentElement.style.setProperty('--fg', dark ? '#e8ecf1' : '#121417');
  document.documentElement.style.setProperty('--muted', dark ? '#9aa4b2' : '#5b6676');
  document.documentElement.style.setProperty('--card', dark ? '#151a22' : '#ffffff');
}
applyTheme();
tg.onEvent('themeChanged', applyTheme);

// UI элементы
const $auth = document.getElementById('auth');
const $game = document.getElementById('game');
const $hello = document.getElementById('hello');
const $dice = document.getElementById('dice');

const $name = document.getElementById('name');
const $nick = document.getElementById('nick');
const $dob  = document.getElementById('dob');

const $nameErr = document.getElementById('nameErr');
const $nickErr = document.getElementById('nickErr');
const $dobErr  = document.getElementById('dobErr');

// Хелперы
const user = (tg.initDataUnsafe && tg.initDataUnsafe.user) || null;

function showAuth() {
  $auth.style.display = 'block';
  $game.style.display = 'none';
  tg.MainButton.setParams({ text: 'Сохранить' });
  tg.MainButton.show();
}

function showGame(profile) {
  $auth.style.display = 'none';
  $game.style.display = 'block';
  const name = profile?.name || user?.first_name || 'Игрок';
  $hello.innerHTML = `Привет, <b>${name}</b>! Мини-приложение подключено <span class="ok">✔</span>`;
  tg.MainButton.setParams({ text: 'Играть' });
  tg.MainButton.show();
}

// Валидация
const rxNick = /^[a-zA-Z0-9_]{3,20}$/;

function validateProfile() {
  let ok = true;

  const name = ($name.value || '').trim();
  const nick = ($nick.value || '').trim();
  const dob  = $dob.value;

  $nameErr.style.display = (name.length >= 2 && name.length <= 40) ? 'none' : (ok=false,'block');
  $nickErr.style.display = rxNick.test(nick) ? 'none' : (ok=false,'block');
  const validDob = !!dob && !Number.isNaN(Date.parse(dob));
  $dobErr.style.display  = validDob ? 'none' : (ok=false,'block');

  return ok ? { name, nickname: nick, dob } : null;
}

// Сохранение/загрузка профиля
function saveProfile(p) {
  localStorage.setItem('nardy_profile', JSON.stringify(p));
}
function loadProfile() {
  try { return JSON.parse(localStorage.getItem('nardy_profile') || 'null'); }
  catch { return null; }
}

// Бросок кости
function rollDice() {
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
  $dice.classList.add('roll');
  setTimeout(() => {
    const val = Math.floor(Math.random() * 6) + 1;
    const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    $dice.textContent = faces[val - 1];
    $dice.classList.remove('roll');
  }, 180);
}

// Логика главной кнопки
let mode = 'auth'; // 'auth' | 'play'

tg.onEvent('mainButtonClicked', () => {
  if (mode === 'auth') {
    const profile = validateProfile();
    if (!profile) {
      // Покажем системный алерт
      if (tg.showAlert) tg.showAlert('Проверь заполнение полей');
      return;
    }

    saveProfile(profile);

    // Отправим в бота, если запущено из бота
    try {
      if (tg.initData && tg.sendData) {
        tg.sendData(JSON.stringify({ type: 'profile', ...profile }));
      }
    } catch(_) {}

    mode = 'play';
    showGame(profile);
    if (tg.showPopup) tg.showPopup({ title: 'Готово', message: 'Профиль сохранён' });
  } else {
    rollDice();
  }
});

// Первичная инициализация
(function init() {
  const profile = loadProfile();
  if (profile) {
    mode = 'play';
    showGame(profile);
  } else {
    mode = 'auth';
    showAuth();
  }
})();
