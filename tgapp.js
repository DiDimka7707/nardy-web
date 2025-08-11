// tgapp.js v7
const tg = window.Telegram?.WebApp;

// --- утилиты профиля ---
function getProfile() {
  try { return JSON.parse(localStorage.getItem('profile') || '{}'); }
  catch { return {}; }
}
function isProfileComplete() {
  const p = getProfile();
  return Boolean(p.name && p.nickname && p.dob);
}
function setActiveTab(id) {
  document.querySelectorAll('section.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById('screen-' + id)?.classList.remove('hidden');
  document.querySelectorAll('button.tab').forEach(b => b.classList.remove('active'));
  document.querySelector(`button.tab[data-tab="${id}"]`)?.classList.add('active');
}
function toast(msg) {
  if (tg?.showPopup) tg.showPopup({ title: 'Готово', message: msg, buttons: [{id:'ok', type:'ok'}] });
  else alert(msg);
}

// --- инициализация ---
document.addEventListener('DOMContentLoaded', () => {
  // подсветим вкладку по умолчанию
  setActiveTab('games');

  // включаем/выключаем игровые кнопки по заполненности профиля
  syncButtons();

  // вкладки
  document.querySelectorAll('button.tab').forEach(btn => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
  });

  // сохранить профиль
  const form = document.getElementById('profile-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('name')?.value || '').trim();
      const nickname = (document.getElementById('nickname')?.value || '').trim();
      const dob = (document.getElementById('dob')?.value || '').trim();
      localStorage.setItem('profile', JSON.stringify({ name, nickname, dob }));
      syncButtons();
      toast('Профиль сохранён ✅');
    });
  }

  // СОЗДАТЬ ИГРУ
  const btnCreate = document.getElementById('btnCreate');
  if (btnCreate) {
    btnCreate.addEventListener('click', () => {
      if (!isProfileComplete()) {
        setActiveTab('profile');
        toast('Заполни профиль перед игрой 🙂');
        return;
      }
      // отправляем боту
      tg?.sendData?.(JSON.stringify({ type: 'create_room', payload: {} }));
      toast('Запрос на создание комнаты отправлен боту.\nСмотри чат.');
    });
  }

  // ОТКРЫТЬ БОТТОМ-ЛИСТ «ПРИСОЕДИНИТЬСЯ»
  const btnJoinOpen = document.getElementById('btnJoinOpen');
  if (btnJoinOpen) {
    btnJoinOpen.addEventListener('click', () => {
      if (!isProfileComplete()) {
        setActiveTab('profile');
        toast('Заполни профиль перед игрой 🙂');
        return;
      }
      document.getElementById('joinSheet')?.classList.add('open');
    });
  }
  document.getElementById('joinClose')?.addEventListener('click', () => {
    document.getElementById('joinSheet')?.classList.remove('open');
  });

  // ВОЙТИ ПО КОДУ
  const btnJoinCode = document.getElementById('btnJoinCode');
  if (btnJoinCode) {
    btnJoinCode.addEventListener('click', () => {
      const code = (document.getElementById('joinCode')?.value || '').trim().toUpperCase();
      if (!code) { toast('Введи код комнаты'); return; }
      tg?.sendData?.(JSON.stringify({ type: 'join_by_code', payload: { code } }));
      toast('Пробуем войти по коду… смотри чат бота.');
      document.getElementById('joinSheet')?.classList.remove('open');
    });
  }

  // БЫСТРЫЙ МАТЧ
  const btnQuick = document.getElementById('btnQuick');
  if (btnQuick) {
    btnQuick.addEventListener('click', () => {
      tg?.sendData?.(JSON.stringify({ type: 'quick_match', payload: {} }));
      toast('Ищем соперника… Я напишу в чат, когда кто-то найдётся.');
      document.getElementById('joinSheet')?.classList.remove('open');
    });
  }
});

// включение/отключение игровых кнопок
function syncButtons() {
  const ready = isProfileComplete();
  ['btnCreate','btnJoinOpen'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = !ready;
    el.classList.toggle('disabled', !ready);
  });
}
