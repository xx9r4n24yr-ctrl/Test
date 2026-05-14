const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready(); tg.expand();
  try { tg.disableVerticalSwipes(); } catch(e) {}
  try { tg.requestFullscreen(); } catch(e) {}
  const photo = tg.initDataUnsafe?.user?.photo_url;
  if (photo) document.getElementById('avatarImg').src = photo;
}

document.addEventListener('touchmove', e => {
  if (!e.target.closest('.screen,.modal-card')) e.preventDefault();
}, { passive:false });

const state = {
  coins:12450, gems:320, energy:78, screen:'farm',
  inventory:{egg:6,milk:2,meat:2,wool:2,wheat:120,corn:90,carrot:110,pumpkin:80,cream:0,cheese:0},
  farmLevel:12,
  animals:{
    chicken:{name:'Курятник', animal:'Курицы', icon:'🐔', product:'Яйца', key:'egg', level:1, count:4, caps:[4,8,12,16], buy:100, upgrade:1500, production:'10 яиц / 12ч', profit:'35 дней / +5%'},
    pig:{name:'Свинарник', animal:'Свиньи', icon:'🐖', product:'Мясо', key:'meat', level:1, count:1, caps:[1,2,4,6], buy:300, upgrade:2500, production:'6 мяса / 24ч', profit:'45 дней / +6%'},
    sheep:{name:'Овчарня', animal:'Овцы', icon:'🐑', product:'Шерсть', key:'wool', level:1, count:1, caps:[1,3,5,8], buy:250, upgrade:2800, production:'4 шерсти / 18ч', profit:'55 дней / +7%'},
    cow:{name:'Коровник', animal:'Коровы', icon:'🐄', product:'Молоко', key:'milk', level:1, count:1, caps:[1,2,3,4], buy:500, upgrade:3200, production:'5 молока / 12ч', profit:'65 дней / +8%'}
  }, selectedAnimal:'chicken'
};

const screen = document.getElementById('screen');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
document.getElementById('closeModal').onclick = () => modal.classList.add('hidden');
function save(){ localStorage.setItem('farmGameState', JSON.stringify(state)); }
function load(){ const raw=localStorage.getItem('farmGameState'); if(raw) Object.assign(state, JSON.parse(raw)); }
function money(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' '); }
function syncTop(){ coins.textContent=money(state.coins); gems.textContent=state.gems; energy.textContent=`${state.energy}/100`; }
function openModal(html){ modalBody.innerHTML=html; modal.classList.remove('hidden'); }
function setScreen(name){ state.screen=name; document.querySelectorAll('#bottomNav button').forEach(b=>b.classList.toggle('active', b.dataset.screen===name)); render(); }

document.getElementById('bottomNav').onclick = e => { const b=e.target.closest('button'); if(b) setScreen(b.dataset.screen); };
document.getElementById('menuBtn').onclick = () => openModal('<h2>Меню</h2><p>Настройки, помощь, профиль игрока.</p><button class="green-btn" onclick="localStorage.clear();location.reload()">Сбросить прогресс</button>');
document.getElementById('profileBtn').onclick = () => openModal('<h2>Профиль</h2><p>Уровень игрока: 25</p><p>Уровень фермы: '+state.farmLevel+'</p>');

function renderFarm(){ screen.className='screen farm-screen'; screen.innerHTML=`
  <section class="farm-hero">
    <div class="cloud one"></div><div class="cloud two"></div><div class="hill"></div><div class="farmhouse"></div><div class="barn"></div><div class="coop"></div><div class="field"></div>
    <div class="animal-map a1">🐄</div><div class="animal-map a2">🐖</div><div class="animal-map a3">🐑</div><div class="animal-map a4">🐔</div>
    <div class="side-buttons"><button onclick="showQuests()">📋<span class="badge">3</span><br>Квесты</button><button onclick="dailyBonus()">🎁<span class="badge">5</span><br>Бонусы</button></div>
    <div class="title-pill">Моя ферма<small>Уровень ${state.farmLevel}</small></div>
  </section>
  <section class="grid">
    <button class="card" onclick="setScreen('animals')"><div class="big-icon">🐄</div><h3>Животные</h3></button>
    <button class="card" onclick="setScreen('fields')"><div class="big-icon">🌾</div><h3>Поля</h3></button>
    <button class="card" onclick="setScreen('market')"><div class="big-icon">🛒</div><h3>Рынок</h3></button>
    <button class="card" onclick="setScreen('orders')"><div class="big-icon">🚚</div><h3>Заказы</h3></button>
    <button class="card" onclick="showResearch()"><div class="big-icon">🔬</div><h3>Исследования</h3></button>
    <button class="card" onclick="showAchievements()"><div class="big-icon">🏆</div><h3>Достижения</h3></button>
  </section>`; }

function renderAnimals(){ const a=state.animals[state.selectedAnimal], cap=a.caps[a.level-1]; screen.className='screen animal-screen'; screen.innerHTML=`
  <button class="green-btn" onclick="setScreen('farm')">← Назад</button>
  <div class="wood-title">${a.name}<br><small>Уровень ${a.level}</small></div>
  <div class="stable"><div>${a.icon}</div><div class="capacity">${a.count}/${cap}<br><small>места занято</small></div></div>
  <div class="stats">
    <div class="card"><h3>Уровень ${a.name}</h3><div class="big-icon">⭐</div><p>Мест: ${cap}</p><p>Следующий: +${nextCap(a)-cap} места</p><button class="green-btn" onclick="upgradeAnimal()">🪙 ${money(a.upgrade)}<br>Улучшить</button></div>
    <div class="card"><h3>${a.animal}</h3><div class="big-icon">${a.icon}</div><p>Куплено ${a.count}/${cap}</p><p>Производство<br>${a.production}</p><button class="blue-btn" onclick="buyAnimal()">Купить<br>🪙 ${a.buy}</button></div>
    <div class="card"><h3>Собрано</h3><div class="big-icon">${productIcon(a.key)}</div><p style="font-size:32px">${state.inventory[a.key]}</p><button class="green-btn" onclick="collectAnimal()">Собрать всё</button></div>
  </div>
  <div class="animal-tabs">${Object.entries(state.animals).map(([k,v])=>`<button class="${k===state.selectedAnimal?'active':''}" onclick="state.selectedAnimal='${k}';render()">${v.icon}<br>${v.name}</button>`).join('')}</div>`; }
function nextCap(a){ return a.caps[Math.min(a.level, a.caps.length-1)] || a.caps.at(-1); }
function productIcon(k){ return {egg:'🥚',milk:'🥛',meat:'🥩',wool:'🧶',wheat:'🌾',corn:'🌽',carrot:'🥕',pumpkin:'🎃',cream:'🥣',cheese:'🧀'}[k]||'📦'; }
window.buyAnimal=function(){ const a=state.animals[state.selectedAnimal], cap=a.caps[a.level-1]; if(a.count>=cap)return openModal('<h2>Нет места</h2><p>Сначала улучшите постройку.</p>'); if(state.coins<a.buy)return openModal('<h2>Не хватает монет</h2>'); state.coins-=a.buy; a.count++; syncTop(); save(); render(); }
window.upgradeAnimal=function(){ const a=state.animals[state.selectedAnimal]; if(a.level>=4)return openModal('<h2>Максимальный уровень</h2>'); if(state.coins<a.upgrade)return openModal('<h2>Не хватает монет</h2>'); state.coins-=a.upgrade; a.level++; a.upgrade=Math.round(a.upgrade*1.8); syncTop(); save(); render(); }
window.collectAnimal=function(){ const a=state.animals[state.selectedAnimal]; const add={egg:10,milk:5,meat:6,wool:4}[a.key]*a.count; state.inventory[a.key]+=add; openModal(`<h2>Собрано</h2><p>${productIcon(a.key)} +${add} ${a.product}</p>`); save(); render(); }

function renderFields(){ screen.className='screen'; const crops=[['wheat','Пшеница',120],['corn','Кукуруза',90],['carrot','Морковь',110],['pumpkin','Тыква',80]]; screen.innerHTML=`<h1>Поля</h1><p>Сбор урожая 2 раза в день.</p><div class="grid">${crops.map(c=>`<div class="card"><div class="big-icon">${productIcon(c[0])}</div><h3>${c[1]}</h3><p>На складе: ${state.inventory[c[0]]}</p><button class="green-btn" onclick="collectCrop('${c[0]}',${c[2]})">Собрать +${c[2]}</button></div>`).join('')}</div>`; }
window.collectCrop=(k,n)=>{ state.inventory[k]+=n; save(); render(); };

function renderMarket(){ screen.className='screen'; const goods=[['egg','Яйцо',7],['milk','Молоко',10],['wool','Шерсть',9],['meat','Мясо',15],['cream','Сметана',18],['cheese','Сыр',25],['wheat','Пшеница',3],['corn','Кукуруза',4]]; screen.innerHTML=`<h1>Рынок</h1>${goods.map(g=>`<div class="market-row"><b>${productIcon(g[0])}</b><span>${g[1]} — ${state.inventory[g[0]]||0} шт.<br><small>${g[2]} монет / шт.</small></span><button class="green-btn" onclick="sell('${g[0]}',${g[2]})">Продать</button></div>`).join('')}`; }
window.sell=(k,price)=>{ if((state.inventory[k]||0)<=0)return; state.inventory[k]--; state.coins+=price; syncTop(); save(); render(); };

function renderOrders(){ screen.className='screen'; const orders=[['Кафе','🥩 мясо x1 + 🧀 сыр x1',80,2],['Магазин','🥛 молоко x2 + 🧶 шерсть x1',95,1],['Пекарня','🌾 пшеница x20 + 🌽 кукуруза x10',120,0]]; screen.innerHTML=`<h1>Заказы</h1>${orders.map((o,i)=>`<div class="order-row"><b>🚚</b><span><b>${o[0]}</b><br>${o[1]}<br>Награда: 🪙${o[2]} 💎${o[3]}</span><button class="green-btn" onclick="completeOrder(${i})">Отдать</button></div>`).join('')}`; }
window.completeOrder=(i)=>{ state.coins += [80,95,120][i]; state.gems += [2,1,0][i]; syncTop(); openModal('<h2>Заказ выполнен</h2><p>Награда зачислена.</p>'); save(); };

window.showQuests=()=>openModal('<h2>Задания</h2><p>Купи животное, собери урожай, продай товар на рынке.</p>');
window.dailyBonus=()=>{ state.coins+=150; syncTop(); save(); openModal('<h2>Ежедневная награда</h2><p>День 1: 🪙 +150</p><p>Следующие награды скрыты, но уже ждут игрока.</p>'); };
window.showResearch=()=>openModal('<h2>Исследования</h2><p>Ускорение производства, бонус к доходности, новые заводы.</p>');
window.showAchievements=()=>openModal('<h2>Достижения</h2><p>Фермер-новичок, Король курятника, Магнат молока.</p>');

function render(){ syncTop(); if(state.screen==='farm')renderFarm(); if(state.screen==='animals')renderAnimals(); if(state.screen==='fields')renderFields(); if(state.screen==='market')renderMarket(); if(state.screen==='orders')renderOrders(); }
load(); render();
