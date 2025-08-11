// tgapp.js
// Инициализация Telegram Mini Apps
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.setHeaderColor("secondary");
tg.setBackgroundColor("#0f141a");

// ---------- Хранилище профиля ----------
const STORE_KEY = "nardy_profile_v1";
function loadProfile() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch { return {}; }
}
function saveProfile(p) { localStorage.setItem(STORE_KEY, JSON.stringify(p || {})); }

// ---------- UI ----------
const tabs = {
  profile: document.getElementById("tab-profile"),
  games: document.getElementById("tab-games"),
  skins: document.getElementById("tab-skins"),
};

function selectTab(name) {
  Object.entries(tabs).forEach(([k, el]) => {
    if (!el) return;
    el.style.display = k === name ? "block" : "none";
    const btn = document.querySelector(`[data-tab="${k}"]`);
    if (btn) btn.classList.toggle("active", k === name);
  });
}
document.querySelectorAll("[data-tab]").forEach((b) =>
  b.addEventListener("click", () => selectTab(b.dataset.tab))
);

// ---------- Профиль ----------
(function initProfile() {
  const p = loadProfile();
  const name = document.getElementById("name");
  const nick = document.getElementById("nick");
  const bday = document.getElementById("bday");
  const saveBtn = document.getElementById("saveProfile");

  if (name) name.value = p.name || "";
  if (nick) nick.value = p.nick || "";
  if (bday) bday.value = p.bday || "";

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const np = { name: name.value.trim(), nick: nick.value.trim(), bday: bday.value };
      saveProfile(np);
      tg.showPopup({ title: "Готово", message: "Профиль сохранён ✅", buttons: [{ type: "close", text: "Закрыть" }] });
    });
  }
})();

// ---------- Связь с ботом ----------
function sendToBot(payload) {
  // Отправляем данные боту (update.message.web_app_data)
  tg.HapticFeedback?.impactOccurred("light");
  tg.sendData(JSON.stringify(payload));
  // Закрывать не обязательно, но обычно удобно:
  // tg.close();
}

// ---------- Игры: действия ----------
const btnCreate = document.getElementById("btn-create");
const btnJoin = document.getElementById("btn-join");

if (btnCreate) {
  btnCreate.addEventListener("click", () => {
    const profile = loadProfile();
    sendToBot({ t: "create_room", profile });     // бот создаст комнату и пришлёт код
  });
}

if (btnJoin) {
  btnJoin.addEventListener("click", async () => {
    const code = await tg.showPopup({
      title: "Вход по коду",
      message: "Введи код комнаты (например: 7B7FX)",
      buttons: [{ type: "input", text: "ОК" }, { type: "cancel", text: "Отмена" }],
    });
    // В мобильном Telegram showPopup с input возвращает text в tg.onEvent('popupClosed') — упростим:
  });
  // Фолбек через prompt для всех клиентов:
  btnJoin.addEventListener("click", () => {
    const code = prompt("Код комнаты:");
    if (code && code.trim()) {
      sendToBot({ t: "join_room", code: code.trim().toUpperCase() });
    }
  }, { once: true });
}

// Стартовая вкладка
selectTab("games");
