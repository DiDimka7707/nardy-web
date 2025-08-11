const tg = window.Telegram.WebApp;
tg.expand();

// --- элементы страниц ---
const pages = {
  account: document.getElementById('page-account'),
  games: document.getElementById('page-games'),
  themes: document.getElementById('page-themes'),
};
const tabs = [...document.querySelectorAll('.tabbar .tab')];

// --- профиль ---
const nameI = document.getElementById('name');
const nickI = document.getElementById('nickname');
const dobI  = document.getElementById('dob');
const saveBtn = document.getElementById('saveBtn');

// загрузка сохранённого
(function initProfile(){
  const raw = localStorage.getItem('profile');
  if (raw){
    try{
      const p = JSON.parse(raw);
      nameI.value = p.name || '';
      nickI.value = p.nickname || '';
      dobI.value  = p.dob || '';
    }catch{}
  }
})();

function saveProfile(){
  const name = nameI.value.trim();
  const nickname = nickI.value.trim();
  const dob = dobI.value;

  if (!name || !nickname || !dob){
    tg.showAlert('Заполни все поля');
    return;
  }
  localStorage.setItem('profile', JSON.stringify({name, nickname, dob}));

  // отправим в бот (ловим в on_webapp_data)
  tg.sendData(JSON.stringify({type:'profile', name, nickname, dob}));

  tg.showPopup({title:'Готово', message:'Профиль сохранён ✅'});
}

// --- игры / кубик ---
const diceBtn = document.getElementById('diceBtn');
const diceOut = document.getElementById('diceOut');

function rollDice(){
  const a = 1 + Math.floor(Math.random()*6);
  const b = 1 + Math.floor(Math.random()*6);
  diceOut.textContent = `Выпало: ${a} и ${b}`;
  // при желании — отправим результат в бот
  // tg.sendData(JSON.stringify({type:'dice', a, b}));
}

// --- вкладки ---
function switchTab(tab){
  Object.keys(pages).forEach(k => pages[k].hidden = (k !== tab));
  tabs.forEach(b => b.classList.toggle('is-active', b.dataset.tab === tab));
  localStorage.setItem('tab', tab);

  // MainButton под конкретный раздел
  tg.MainButton.offClick(); // очистим прошлые обработчики
  if (tab === 'account'){
    tg.MainButton.setText('Сохранить');
    tg.MainButton.onClick(saveProfile);
    tg.MainButton.show();
  } else if (tab === 'games'){
    tg.MainButton.setText('Бросить кости');
    tg.MainButton.onClick(rollDice);
    tg.MainButton.show();
  } else {
    tg.MainButton.hide();
  }
}

tabs.forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
saveBtn.addEventListener('click', saveProfile);
diceBtn.addEventListener('click', rollDice);

// стартовая вкладка
switchTab(localStorage.getItem('tab') || 'account');
