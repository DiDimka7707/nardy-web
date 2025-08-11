// tgapp.js

const SCREENS = ["profile","games","themes"];

function qs(s,root=document){return root.querySelector(s)}
function qsa(s,root=document){return [...root.querySelectorAll(s)]}

function showTab(tab){
  SCREENS.forEach(n=>{
    const el = qs("#screen-"+n);
    if (el) el.classList.toggle("active", n===tab);
  });
  qsa(".tabbar .tab").forEach(b=>{
    b.classList.toggle("active", b.dataset.tab===tab);
  });
  try{localStorage.setItem("last_tab", tab)}catch(e){}
}

function bindTabs(){
  qsa(".tabbar .tab").forEach(btn=>{
    btn.addEventListener("click", ()=> showTab(btn.dataset.tab));
  });
}

function toast(msg){ alert(msg); } // простая заглушка

/* ===== Профиль ===== */
function initProfile(){
  const form = qs("#profile-form");
  if(!form) return;
  const name = qs("#name"), nick=qs("#nick"), dob=qs("#dob");

  // заполним из localStorage
  try{
    const raw = localStorage.getItem("nardy_profile");
    if(raw){
      const p = JSON.parse(raw);
      if(name) name.value = p.name || "";
      if(nick) nick.value = p.nick || "";
      if(dob)  dob.value  = p.dob  || "";
    }
  }catch(e){}

  form.addEventListener("submit",(ev)=>{
    ev.preventDefault();
    const data = {
      name: (name?.value || "").trim(),
      nick: (nick?.value || "").trim(),
      dob:  (dob?.value  || "")
    };
    try{ localStorage.setItem("nardy_profile", JSON.stringify(data)); }catch(e){}
    toast("Готово\nПрофиль сохранён ✅");
  });
}

/* ===== Игры ===== */
function randCode(len=5){
  const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // без похожих символов
  let s=""; for(let i=0;i<len;i++) s+=a[Math.floor(Math.random()*a.length)];
  return s;
}

function openOverlay(){ qs("#overlay")?.classList.add("show"); }
function closeOverlay(){ qs("#overlay")?.classList.remove("show"); }

function openSheet(id){
  openOverlay();
  const el = qs("#"+id);
  if(el){ el.classList.add("show"); el.setAttribute("aria-hidden","false"); }
}
function closeSheets(){
  closeOverlay();
  qsa(".sheet").forEach(el=>{el.classList.remove("show"); el.setAttribute("aria-hidden","true");});
}

function initGames(){
  // создать игру
  const createBtn = qs("#btn-create");
  createBtn?.addEventListener("click", ()=>{
    const code = randCode();
    const slot = qs("#created-code");
    if(slot) slot.textContent = code;
    openSheet("sheet-created");
  });

  // копировать код
  qs("#btn-copy")?.addEventListener("click", async()=>{
    const txt = qs("#created-code")?.textContent?.trim() || "";
    try{
      await navigator.clipboard.writeText(txt);
      toast("Код скопирован: "+txt);
    }catch(e){
      toast("Скопируй код вручную: "+txt);
    }
  });

  // открыть join-sheet
  qs("#btn-join-open")?.addEventListener("click", ()=> openSheet("sheet-join"));

  // войти по коду
  qs("#btn-join")?.addEventListener("click", ()=>{
    const code = (qs("#joinCode")?.value || "").toUpperCase().trim();
    if(code.length < 4){ toast("Введи корректный код комнаты"); return; }
    // здесь можно отправить событие в бота через WebApp API — пока просто показ.
    toast("Пробуем войти в комнату: "+code);
    closeSheets();
  });

  // быстрый матч
  qs("#btn-mm")?.addEventListener("click", ()=>{
    toast("Матчмейкинг скоро будет 👀");
    closeSheets();
  });

  // закрытие листов
  qs("#overlay")?.addEventListener("click", closeSheets);
  qsa("[data-close]").forEach(b=> b.addEventListener("click", closeSheets));
}

/* ===== Старт ===== */
function init(){
  try{ window.Telegram?.WebApp?.ready?.(); }catch(e){}
  bindTabs();
  initProfile();
  initGames();

  let start = "games";
  try{
    const last = localStorage.getItem("last_tab");
    if(SCREENS.includes(last)) start = last;
  }catch(e){}
  showTab(start);
}

document.addEventListener("DOMContentLoaded", init);
