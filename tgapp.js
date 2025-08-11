const tg = window.Telegram.WebApp;

// раскрываем на всю высоту
tg.expand();
// подхватываем тему Telegram
tg.setHeaderColor("secondary_bg_color");

// демо-логика
document.getElementById("start").addEventListener("click", () => {
  tg.HapticFeedback.impactOccurred("light");
  tg.showPopup({
    title: "Скоро тут будет игра",
    message: "Мы подключили Mini App. Дальше добавим дизайн, рейтинг, друзей и т.д.",
    buttons: [{ type: "close" }]
  });
});

// Кнопка внизу клиента Telegram (MainButton)
tg.MainButton.setText("Играть");
tg.MainButton.show();
tg.MainButton.onClick(() => {
  tg.close(); // пока просто закрываем; позже откроем экран игры
});
