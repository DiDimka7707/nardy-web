// Telegram WebApp helper
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
  tg.ready();
  tg.expand(); // высота на весь экран
}

// ===== Локальное хранилище профиля =====
const LS_KEY = "nardy_profile";
function loadProfile() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}
function saveProfile(obj) {
  localStorage.setItem(LS_KEY, JSON.stringify(obj));
}

// ===== Элементы =====
const scrProfile = document.getElementById("screen-profile");
const scrGames   = document.getElementById("screen-games");
const scrThemes  = document.getElementById("screen-themes");

const inpName  = document.getElementById("inp-name");
const inpNick  = document.getElementById("inp-nick");
const inpBirth = document.getElementById("inp-birth");
const btnSave  = document.getElementById("btn-save");

const createGameBtn = document.getElementById("createGameBtn");
const joinGameBtn   = document.getElementById("joinGameBtn");

const tabs = [...document.querySelectorAll(".tab-btn")];
const screens = {
  profile: scrProfile,
  games: scrGames,
  themes: scrThemes,
};

// ===== Навигация по вкладкам =====
function showScreen(name) {
  Object.values(screens).forEach(el => el.classList.remove("active"));
  screens[name].classList.add("active");
  tabs.forEach(t => t.classList.toggle("active", t.dataset.screen === name));
  localStorage.setItem("nardy_tab", name);
}
tabs.forEach(t => t.addEventListener("click", () => showScreen(t.dataset.screen)));

// ===== Инициализация формы профиля =====
(function initProfileUI() {
  const p = loadProfile();
  if (p.name)  inpName.value  = p.name;
  if (p.nick)  inpNick.value  = p.nick;
  if (p.birth) inpBirth.value = p.birth; // yyyy-mm-dd

  btnSave.addEventListener("click", () => {
    const profile = {
      name:  inpName.value.trim(),
      nick:  inpNick.value.trim(),
      birth: inpBirth.value, // yyyy-mm-dd
      // полезно знать ID пользователя TG:
      userId: tg?.initDataUnsafe?.user?.id || null,
    };
    saveProfile(profile);

    if (tg?.showPopup) {
      tg.showPopup({
        title: "Готово",
        message: "Профиль сохранён ✅",
        buttons: [{ type: "close", text: "Закрыть" }],
      });
    } else {
      alert("Профиль сохранён ✅");
    }
  });
})();

// ===== Экран ИГРЫ: отправка в бота =====
function sendToBot(payload) {
  if (!tg) {
    alert("Открой мини-приложение из Telegram, чтобы играть.");
    return;
  }
  const data = JSON.stringify(payload);
  tg.sendData(data); // прилетит в web_app_data
}

createGameBtn.addEventListener("click", () => {
  sendToBot({ action: "newgame" });
});

joinGameBtn.addEventListener("click", () => {
  let code = prompt("Введите код комнаты (например, 7B7FX):");
  if (code) {
    code = code.trim().toUpperCase();
    sendToBot({ action: "join", code });
  }
});

// ===== Стартовый экран =====
(function startRoute() {
  const saved = localStorage.getItem("nardy_tab");
  const p = loadProfile();
  // если профиль уже заполнен — открываем «Игры», иначе «Профиль»
  showScreen(saved || (p.name || p.nick || p.birth ? "games" : "profile"));
})();
