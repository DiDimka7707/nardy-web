document.addEventListener('DOMContentLoaded', () => {
  const tg = window.Telegram?.WebApp;

  // раскрыть webapp и поставить тему
  try {
    tg?.expand();
    tg?.MainButton?.hide();
    tg?.HapticFeedback?.impactOccurred?.('light');
  } catch(e){}

  // --- вкладки
  const screens = {
    profile: document.getElementById('screen-profile'),
    games:   document.getElementById('screen-games'),
    themes:  document.getElementById('screen-themes'),
  };
  const tabs = Array.from(document.querySelectorAll('.tabbar .tab'));
  function show(tab){
    Object.values(screens).forEach(s => s.classList.remove('active'));
    tabs.forEach(t => t.classList.remove('active'));
    screens[tab]?.classList.add('active');
    tabs.find(t=>t.dataset.tab===tab)?.classList.add('active');
    // лёгкий шевел хаптика
    try{ tg?.HapticFeedback?.selectionChanged?.(); }catch(e){}
  }
  tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.tab)));

  // --- профиль (localStorage)
  const $ = sel => document.querySelector(sel);
  const name = $('#name');
  const nick = $('#nick');
  const bday = $('#bday');

  const LS_KEY = 'nardy.profile.v1';
  const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  if (saved){
    name.value = saved.name || '';
    nick.value = saved.nick || '';
    bday.value = saved.bday || '';
  }

  $('#btn-save-profile')?.addEventListener('click', () => {
    const data = {
      name: (name.value || '').trim(),
      nick: (nick.value || '').trim(),
      bday: (bday.value || '').trim(),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    try {
      tg?.showPopup?.({title:'Готово', message:'Профиль сохранён ✅', buttons:[{type:'close'}]});
    } catch(e) {
      alert('Профиль сохранён ✅');
    }
    try{ tg?.HapticFeedback?.notificationOccurred?.('success'); }catch(e){}
  });

  // --- bottom-sheet (присоединиться)
  const overlay   = document.getElementById('sheet-overlay');
  const sheet     = document.getElementById('join-sheet');
  const openJoin  = document.getElementById('btn-open-join');
  const closeJoin = document.getElementById('sheet-close');

  const btnCreate = document.getElementById('btn-create');
  const btnJoin   = document.getElementById('btn-join');
  const btnQuick  = document.getElementById('btn-quick');
  const inputCode = document.getElementById('joinCode');

  const openSheet  = () => { sheet.hidden=false; overlay.hidden=false; setTimeout(()=>sheet.classList.add('show'), 0); };
  const closeSheet = () => { sheet.classList.remove('show'); setTimeout(()=>{sheet.hidden=true; overlay.hidden=true;}, 200); };

  openJoin?.addEventListener('click', openSheet);
  closeJoin?.addEventListener('click', closeSheet);
  overlay?.addEventListener('click', closeSheet);

  // Создать игру → бот
  btnCreate?.addEventListener('click', () => {
    tg?.openTelegramLink('https://t.me/NardyClassicBot?start=newgame');
  });

  // Присоединиться по коду
  btnJoin?.addEventListener('click', () => {
    const code = (inputCode?.value || '').trim().toUpperCase();
    if (!code){
      try { tg?.showPopup?.({title:'Введите код', message:'Например: 7B7FX', buttons:[{type:'close'}]}); }
      catch(e){ alert('Введите код комнаты (например 7B7FX)'); }
      return;
    }
    tg?.openTelegramLink(`https://t.me/NardyClassicBot?start=join_${code}`);
    closeSheet();
  });

  // Быстрый матч
  btnQuick?.addEventListener('click', () => {
    tg?.openTelegramLink('https://t.me/NardyClassicBot?start=quick');
    closeSheet();
  });
});
