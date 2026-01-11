// ========== КОНФИГУРАЦИЯ FIREBASE ==========
const firebaseConfig = {
    apiKey: "AIzaSyDYyNGJwPXSGL9A-suKuul4Q2oNuSMlVYE",
    authDomain: "tesster-98871.firebaseapp.com",
    projectId: "tesster-98871",
    storageBucket: "tesster-98871.firebasestorage.app",
    messagingSenderId: "872154392258",
    appId: "1:872154392258:web:624c1ba98900a10d1d3d5b"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let nick = "";
let roomId = null;
let players = [];
let isReady = false;
let isCreator = false;
let gameStarted = false;
let qs = [], i = 0, score = 0, startTime, questionTimer, elapsedQ = 0;
let userAnswers = [];
let roomUnsubscribe = null;
let progressUnsubscribe = null;
let isPageUnloading = false;
let detailedResultsShown = false;
let wheelActivated = false;

// ========== ВОПРОСЫ (50 штук) ==========
const autoQ = [
    {id:1,q:"2 + 2 × 2 = ?",a:["6","8","4","10"],c:0,exp:"Сначала умножение: 2 × 2 = 4, затем сложение: 2 + 4 = 6."},
    {id:2,q:"15% от 200?",a:["15","30","25","20"],c:1,exp:"15% = 0.15. 200 × 0.15 = 30."},
    {id:3,q:"5² + 3² = ?",a:["34","25","29","36"],c:0,exp:"5² = 25, 3² = 9. 25 + 9 = 34."},
    {id:4,q:"√144 = ?",a:["11","12","13","14"],c:1,exp:"12 × 12 = 144, поэтому √144 = 12."},
    {id:5,q:"3/4 от 80?",a:["50","60","70","80"],c:1,exp:"80 ÷ 4 = 20, 20 × 3 = 60."},
    {id:6,q:"7 × 8 = ?",a:["48","54","56","64"],c:2,exp:"Таблица умножения: 7 × 8 = 56."},
    {id:7,q:"1000 ÷ 40?",a:["25","30","35","40"],c:0,exp:"1000 ÷ 40 = 25."},
    {id:8,q:"Следующее: 2, 4, 8, 16, ...?",a:["24","32","48","64"],c:1,exp:"Каждое число умножается на 2: 16×2=32."},
    {id:9,q:"Градусы в прямом углу?",a:["45°","90°","180°","360°"],c:1,exp:"Прямой угол всегда равен 90 градусам."},
    {id:10,q:"0.5 в виде дроби?",a:["1/5","1/4","1/3","1/2"],c:3,exp:"0.5 = 5/10 = 1/2."},
    {id:11,q:"x + 7 = 15, то x = ?",a:["6","7","8","9"],c:2,exp:"x = 15 - 7 = 8."},
    {id:12,q:"2x - 5 = 11",a:["x=6","x=7","x=8","x=9"],c:2,exp:"2x = 11+5=16, x=16÷2=8."},
    {id:13,q:"3a + 2b + 4a - b",a:["7a+b","7a+3b","a+b","7a-b"],c:0,exp:"3a+4a=7a, 2b-b=b."},
    {id:14,q:"(x+3)(x-3)?",a:["x²-9","x²+9","x²-6","x²+6"],c:0,exp:"Формула разности квадратов."},
    {id:15,q:"y=2x+1, x=3, то y=?",a:["5","6","7","8"],c:2,exp:"y=2×3+1=6+1=7."},
    {id:16,q:"Периметр квадрата со стороной 5 см?",a:["15 см","20 см","25 см","30 см"],c:1,exp:"P=4×a=4×5=20 см."},
    {id:17,q:"Площадь прямоугольника 6×8 см?",a:["48 см²","42 см²","36 см²","28 см²"],c:0,exp:"6×8=48 см²."},
    {id:18,q:"Сколько градусов в треугольнике?",a:["90°","180°","270°","360°"],c:1,exp:"Сумма углов треугольника=180°."},
    {id:19,q:"Диаметр круга 10 см. Радиус?",a:["5 см","10 см","15 см","20 см"],c:0,exp:"Радиус=диаметр÷2=10÷2=5 см."},
    {id:20,q:"Объем куба с ребром 3 см?",a:["9 см³","18 см³","27 см³","36 см³"],c:2,exp:"V=a³=3³=27 см³."},
    {id:21,q:"Следующее: 1, 4, 9, 16, ...?",a:["20","24","25","36"],c:2,exp:"Квадраты: 1²,2²,3²,4²,5²=25."},
    {id:22,q:"Следующее: 2, 6, 12, 20, ...?",a:["28","30","32","36"],c:1,exp:"+4,+6,+8,+10: 20+10=30."},
    {id:23,q:"Сколько сторон у шестиугольника?",a:["5","6","7","8"],c:1,exp:"Гексагон имеет 6 сторон."},
    {id:24,q:"Пропущено: 3, 7, 15, 31, ?",a:["47","55","63","72"],c:2,exp:"×2+1: 31×2+1=63."},
    {id:25,q:"Сумма чисел от 1 до 10?",a:["45","50","55","60"],c:2,exp:"(1+10)×10/2=55."},
    {id:26,q:"¾ + ½?",a:["1¼","1½","1¾","2"],c:0,exp:"¾+½=¾+2/4=5/4=1¼"},
    {id:27,q:"12 × 11 = ?",a:["121","132","144","122"],c:1,exp:"12×11=132"},
    {id:28,q:"45 ÷ 0.5 = ?",a:["22.5","45","90","180"],c:2,exp:"45÷0.5=45÷1/2=45×2=90"},
    {id:29,q:"2³ × 2² = ?",a:["16","32","64","128"],c:1,exp:"2³=8,2²=4,8×4=32"},
    {id:30,q:"Минут в 2.5 часа?",a:["120","150","180","200"],c:1,exp:"2.5×60=150"},
    {id:31,q:"9 × 7 = ?",a:["56","63","72","81"],c:1,exp:"9×7=63"},
    {id:32,q:"25% от 80?",a:["15","20","25","30"],c:1,exp:"80×0.25=20"},
    {id:33,q:"√64 = ?",a:["6","7","8","9"],c:2,exp:"8×8=64"},
    {id:34,q:"1/3 от 99?",a:["30","33","36","39"],c:1,exp:"99÷3=33"},
    {id:35,q:"8² - 4² = ?",a:["48","52","56","60"],c:0,exp:"64-16=48"},
    {id:36,q:"Градусов в окружности?",a:["180°","270°","360°","450°"],c:2,exp:"Окружность=360°"},
    {id:37,q:"3/5 = ?%",a:["30%","40%","50%","60%"],c:3,exp:"3/5=0.6=60%"},
    {id:38,q:"Следующее: 1, 3, 6, 10, ...?",a:["13","14","15","16"],c:2,exp:"+2,+3,+4,+5=15"},
    {id:39,q:"Площадь круга с радиусом 7 см?",a:["~154","~144","~134","~124"],c:0,exp:"πr²=3.14×49≈154"},
    {id:40,q:"Нулей в миллионе?",a:["4","5","6","7"],c:2,exp:"1,000,000 - 6 нулей"},
    {id:41,q:"15 + 27 = ?",a:["32","42","52","62"],c:1,exp:"15+27=42"},
    {id:42,q:"0.75 в процентах?",a:["7.5%","75%","750%","0.75%"],c:1,exp:"0.75×100=75%"},
    {id:43,q:"Сколько сторон у октагона?",a:["6","7","8","9"],c:2,exp:"8 сторон"},
    {id:44,q:"6 × 9 = ?",a:["45","54","63","72"],c:1,exp:"6×9=54"},
    {id:45,q:"200 ÷ 8?",a:["20","25","30","35"],c:1,exp:"200÷8=25"},
    {id:46,q:"4³ = ?",a:["12","16","64","256"],c:2,exp:"4×4×4=64"},
    {id:47,q:"Месяцев в 1.5 годах?",a:["12","15","18","21"],c:2,exp:"1.5×12=18"},
    {id:48,q:"√81?",a:["7","8","9","10"],c:2,exp:"9×9=81"},
    {id:49,q:"5! (факториал)?",a:["60","100","120","150"],c:2,exp:"5×4×3×2×1=120"},
    {id:50,q:"2⁵?",a:["16","32","64","128"],c:1,exp:"2×2×2×2×2=32"}
];

// ========== ПРИЗЫ КОЛЕСА ФОРТУНЫ ==========
const wheelPrizes = [
    {name:"Удвоение",icon:"💰",color:"#FFD700",desc:"Следующий результат ×2",effect:()=>{localStorage.setItem('doublePoints','true');showNotification("💰 Удвоение очков активировано!");}},
    {name:"Бессмертие",icon:"🛡️",color:"#4CAF50",desc:"3 ошибки не считаются",effect:()=>{localStorage.setItem('immortality','3');showNotification("🛡️ Бессмертие активировано (3 ошибки)!");}},
    {name:"Секретный скин",icon:"🎨",color:"#9C27B0",desc:"Эксклюзивный дизайн",effect:()=>{activateSecretSkin();showNotification("🎨 Секретный скин активирован!");}},
    {name:"Турбо-режим",icon:"⚡",color:"#FF9800",desc:"+50% времени",effect:()=>{localStorage.setItem('turboMode','true');showNotification("⚡ Турбо-режим активирован!");}},
    {name:"Пропуск вопроса",icon:"➡️",color:"#2196F3",desc:"Пропустить 1 вопрос",effect:()=>{localStorage.setItem('skipQuestion','1');showNotification("➡️ Пропуск вопроса активирован!");}},
    {name:"Бонусные очки",icon:"➕",color:"#E91E63",desc:"+500 очков",effect:()=>{const bp=(parseInt(localStorage.getItem('bonusPoints')||'0')+500).toString();localStorage.setItem('bonusPoints',bp);showNotification(`➕ +${bp} бонусных очков!`);}},
    {name:"Эксперт",icon:"👑",color:"#795548",desc:"Золотая рамка",effect:()=>{localStorage.setItem('expertFrame',new Date(Date.now()+86400000).toISOString());showNotification("👑 Статус Эксперт активирован!");}},
    {name:"Сюрприз",icon:"🎁",color:"#00BCD4",desc:"Случайный приз",effect:function(){const p=wheelPrizes.filter(x=>x.name!=="Сюрприз");const rp=p[Math.floor(Math.random()*p.length)];rp.effect();return rp;}}
];

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========
function shuffleArray(array){
    const shuffled=[...array];
    for(let i=shuffled.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
    }
    return shuffled;
}

function getUniqueQuestions(count){
    const max=Math.min(count,autoQ.length);
    return shuffleArray(autoQ).slice(0,max);
}

function generateRoomCode(){
    const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code='';
    for(let i=0;i<4;i++){
        code+=chars.charAt(Math.floor(Math.random()*chars.length));
    }
    return code;
}

function showLoader(show){
    document.getElementById('loader').classList.toggle('hidden',!show);
}

function updateConnectionStatus(connected){
    const el=document.getElementById('connection-status');
    el.textContent=connected?'✅ Подключено к серверу':'❌ Нет подключения';
    el.className=connected?'status-online':'status-offline';
    el.classList.remove('hidden');
}

function showNotification(text){
    const notification=document.createElement('div');
    notification.textContent=text;
    notification.style.cssText='position:fixed;top:20px;right:20px;background:#28a745;color:white;padding:15px 20px;border-radius:8px;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:14px;';
    document.body.appendChild(notification);
    setTimeout(()=>notification.remove(),3000);
}

function debugLog(message,data){
    console.log(`[DEBUG] ${message}`,data||'');
    const debugEl=document.getElementById('debug-info');
    if(debugEl){
        debugEl.innerHTML+=`<div>${new Date().toLocaleTimeString()}: ${message}</div>`;
        const lines=debugEl.innerHTML.split('<div>');
        if(lines.length>10){
            debugEl.innerHTML=lines.slice(-10).join('<div>');
        }
    }
}

// ========== КОЛЕСО ФОРТУНЫ ==========
function checkForSecretWord(text){
    const words=['эпштейн','epstein','эпштей','epshtein','фортуна','удача','колесо','секрет'];
    const lower=text.toLowerCase();
    return words.some(word=>lower.includes(word));
}

function activateWheel(){
    if(wheelActivated)return;
    wheelActivated=true;
    document.getElementById('wheel-container').classList.remove('hidden');
    createWheel();
    if(navigator.vibrate)navigator.vibrate([200,100,200]);
}

function darkenColor(color,percent){
    color=color.replace('#','');
    let r=parseInt(color.substring(0,2),16);
    let g=parseInt(color.substring(2,4),16);
    let b=parseInt(color.substring(4,6),16);
    r=Math.max(0,Math.min(255,Math.floor(r*(100-percent)/100)));
    g=Math.max(0,Math.min(255,Math.floor(g*(100-percent)/100)));
    b=Math.max(0,Math.min(255,Math.floor(b*(100-percent)/100)));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function createWheel(){
    const wheel=document.getElementById('wheel');
    wheel.innerHTML='<div class="wheel-pointer"></div>';
    const total=wheelPrizes.length;
    const angle=360/total;
    
    wheelPrizes.forEach((prize,index)=>{
        const section=document.createElement('div');
        section.className='wheel-section';
        const content=document.createElement('div');
        content.className='wheel-section-content';
        content.innerHTML=`<span class="wheel-icon">${prize.icon}</span><span class="wheel-text">${prize.name}</span>`;
        section.appendChild(content);
        const rotate=angle*index;
        const skew=90-angle;
        section.style.transform=`rotate(${rotate}deg) skewY(${skew}deg)`;
        const color2=darkenColor(prize.color,20);
        section.style.background=`linear-gradient(135deg,${prize.color},${color2})`;
        if(index%2===0)section.style.filter='brightness(0.9)';
        section.style.border='1px solid rgba(255,255,255,0.3)';
        wheel.appendChild(section);
    });
}

function spinWheel(){
    const wheel=document.getElementById('wheel');
    const btn=document.getElementById('spin-btn');
    btn.disabled=true;
    btn.textContent='🌀 ВРАЩАЕТСЯ...';
    const rotations=3+Math.floor(Math.random()*6);
    const prizeIndex=Math.floor(Math.random()*wheelPrizes.length);
    const angle=360/wheelPrizes.length;
    const finalAngle=rotations*360+prizeIndex*angle-angle/2;
    wheel.style.setProperty('--rotation',`${finalAngle}deg`);
    wheel.classList.add('spinning');
    setTimeout(()=>{
        showPrizeResult(prizeIndex);
        wheel.classList.remove('spinning');
        btn.disabled=false;
        btn.textContent='🎯 КРУТИТЬ КОЛЕСО!';
    },3000);
}

function showPrizeResult(index){
    const prize=wheelPrizes[index];
    let actualPrize=prize;
    if(prize.name==="Сюрприз"){
        actualPrize=prize.effect();
    }else{
        prize.effect();
    }
    document.getElementById('result-icon').textContent=actualPrize.icon;
    document.getElementById('result-text').textContent=`ВЫ ВЫИГРАЛИ: ${actualPrize.name}`;
    document.getElementById('result-description').textContent=actualPrize.desc;
    document.getElementById('result-modal').classList.remove('hidden');
    createConfetti();
    savePrizeHistory(actualPrize.name);
}

function closeResult(){
    document.getElementById('result-modal').classList.add('hidden');
    document.getElementById('wheel-container').classList.add('hidden');
    setTimeout(()=>{wheelActivated=false;},86400000);
}

function createConfetti(){
    const colors=['#FFD700','#4CAF50','#2196F3','#E91E63','#9C27B0','#FF9800'];
    for(let i=0;i<100;i++){
        const confetti=document.createElement('div');
        confetti.style.cssText=`position:fixed;width:10px;height:10px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:50%;left:${Math.random()*100}vw;top:-20px;z-index:99999;pointer-events:none;`;
        document.body.appendChild(confetti);
        confetti.animate([
            {transform:'translateY(0) rotate(0deg)',opacity:1},
            {transform:`translateY(${window.innerHeight+20}px) rotate(${360+Math.random()*360}deg)`,opacity:0}
        ],{
            duration:2000+Math.random()*2000,
            easing:'cubic-bezier(0.215,0.610,0.355,1)'
        }).onfinish=()=>confetti.remove();
    }
}

function activateSecretSkin(){
    document.body.classList.add('secret-skin-active');
    localStorage.setItem('secretSkin','true');
    localStorage.setItem('secretSkinExpires',new Date(Date.now()+86400000).toISOString());
    setTimeout(()=>{
        document.body.classList.remove('secret-skin-active');
        localStorage.removeItem('secretSkin');
        localStorage.removeItem('secretSkinExpires');
    },86400000);
}

function savePrizeHistory(prizeName){
    const history=JSON.parse(localStorage.getItem('wheelHistory')||'[]');
    history.push({prize:prizeName,date:new Date().toISOString(),nick:nick||'Аноним'});
    if(history.length>10)history.shift();
    localStorage.setItem('wheelHistory',JSON.stringify(history));
}

// ========== ИГРОВАЯ ЛОГИКА ==========
document.getElementById("mode").addEventListener("change",function(){
    const mode=this.value;
    document.getElementById("single-settings").classList.toggle("hidden",mode!=="single");
    document.getElementById("multi-settings").classList.toggle("hidden",mode!=="multi");
});

function startSingleGame(){
    nick=document.getElementById("nick").value.trim();
    if(!nick)return alert("Введите ваш ник!");
    const count=parseInt(document.getElementById("auto-count").value)||20;
    qs=getUniqueQuestions(count);
    document.getElementById("start").classList.add("hidden");
    document.getElementById("test").classList.remove("hidden");
    document.getElementById("live-results").classList.add("hidden");
    startGame();
}

async function createRoom(){
    nick=document.getElementById("nick").value.trim();
    if(!nick)return alert("Введите ваш ник!");
    showLoader(true);
    try{
        roomId=generateRoomCode();
        isCreator=true;
        const questionCount=20;
        const roomQuestions=getUniqueQuestions(questionCount);
        await db.collection("rooms").doc(roomId).set({
            creator:nick,
            players:[{nick,ready:false,score:0,progress:0,joinedAt:new Date().toISOString()}],
            status:"waiting",
            questions:roomQuestions,
            questionCount:questionCount,
            gameStarted:false,
            createdAt:new Date().toISOString(),
            lastActive:new Date().toISOString()
        });
        showLobby();
        listenToRoom();
    }catch(error){
        console.error("Ошибка:",error);
        alert("Не удалось создать комнату");
    }finally{
        showLoader(false);
    }
}

async function joinRoom(){
    nick=document.getElementById("nick").value.trim();
    if(!nick)return alert("Введите ваш ник!");
    roomId=document.getElementById("room-code").value.trim().toUpperCase();
    if(!roomId||roomId.length!==4)return alert("Код комнаты: 4 символа");
    showLoader(true);
    try{
        const roomRef=db.collection("rooms").doc(roomId);
        const roomDoc=await roomRef.get();
        if(!roomDoc.exists)throw new Error("Комната не найдена");
        const room=roomDoc.data();
        if(room.status!=="waiting")throw new Error("Игра уже началась");
        if(room.players.length>=8)throw new Error("Комната заполнена");
        if(room.players.some(p=>p.nick===nick))throw new Error("Такой ник уже есть");
        const newPlayer={nick,ready:false,score:0,progress:0,joinedAt:new Date().toISOString()};
        await roomRef.update({
            players:[...room.players,newPlayer],
            lastActive:new Date().toISOString()
        });
        isCreator=false;
        showLobby();
        listenToRoom();
    }catch(error){
        alert(error.message);
    }finally{
        showLoader(false);
    }
}

function showLobby(){
    document.getElementById("start").classList.add("hidden");
    document.getElementById("lobby").classList.remove("hidden");
    document.getElementById("room-id-display").textContent=roomId;
    document.getElementById("room-code-display").textContent=roomId;
}

function listenToRoom(){
    if(roomUnsubscribe)roomUnsubscribe();
    roomUnsubscribe=db.collection("rooms").doc(roomId).onSnapshot(
        (doc)=>{
            if(!doc.exists){
                alert("Комната удалена!");
                location.reload();
                return;
            }
            const room=doc.data();
            players=room.players||[];
            document.getElementById('room-status-text').textContent=
                room.status==='waiting'?'ожидание':
                room.status==='started'?'началась':
                room.status==='finished'?'завершена':'неизвестно';
            
            if(room.status==="waiting"){
                db.collection("rooms").doc(roomId).update({
                    lastActive:new Date().toISOString()
                }).catch(e=>console.log("Ошибка обновления активности:",e));
            }
            
            updatePlayersList(room);
            updateLobbyControls(room);
            
            if(room.status==="started"&&!room.gameStarted){
                const countdownEl=document.getElementById("countdown");
                if(!countdownEl.classList.contains("hidden"))return;
                startCountdown();
            }
            
            if(room.gameStarted&&!gameStarted&&room.status==="started"){
                debugLog("🎮 Получен сигнал начала игры");
                startMultiplayerGame(room);
            }
            
            if(room.status==="finished"&&gameStarted){
                showFinalResults(room);
            }
        },
        (error)=>{
            console.error("Ошибка подписки:",error);
            alert("Ошибка подключения к комнате");
        }
    );
}

function updatePlayersList(room){
    const playersList=document.getElementById("players-list");
    const playersCount=document.getElementById("players-count");
    playersCount.textContent=players.length;
    let html="";
    players.forEach(player=>{
        let playerClass="player-card";
        if(player.ready)playerClass+=" ready";
        if(player.nick===room.creator)playerClass+=" creator";
        const isLoading=player.lastUpdate&&(Date.now()-new Date(player.lastUpdate).getTime()<5000);
        html+=`
            <div class="${playerClass}">
                <strong>${player.nick}</strong>
                ${player.nick===room.creator?"👑":""}
                <div style="margin-top:5px;">
                    ${player.ready?'<span style="color:#28a745;">✅ Готов</span>':'<span style="color:#6c757d;">⏳ Ожидает</span>'}
                    ${isLoading?'<span style="margin-left:5px;">🔄</span>':''}
                </div>
                ${player.score>0?`<div style="margin-top:5px;font-weight:bold;">🏆 ${player.score}</div>`:''}
            </div>
        `;
    });
    playersList.innerHTML=html;
}

function updateLobbyControls(room){
    const readyBtn=document.getElementById("ready-btn");
    const startBtn=document.getElementById("start-btn");
    const forceBtn=document.getElementById("force-start-btn");
    const currentPlayer=players.find(p=>p.nick===nick);
    isReady=currentPlayer?currentPlayer.ready:false;
    
    if(currentPlayer){
        readyBtn.textContent=isReady?"❌ Не готов":"✅ Я готов";
        readyBtn.className=isReady?"danger":"success";
    }
    
    if(isCreator){
        const allReady=players.length>0&&players.every(p=>p.ready);
        startBtn.classList.toggle("hidden",!allReady||players.length<1);
        startBtn.disabled=!allReady;
        forceBtn.classList.toggle("hidden",allReady);
    }else{
        startBtn.classList.add("hidden");
        forceBtn.classList.add("hidden");
    }
}

async function toggleReady(){
    if(!roomId||!nick)return;
    try{
        const roomRef=db.collection("rooms").doc(roomId);
        const roomDoc=await roomRef.get();
        const room=roomDoc.data();
        const updatedPlayers=room.players.map(p=>{
            if(p.nick===nick){
                const newStatus=!p.ready;
                debugLog(`${nick} меняет готовность на: ${newStatus?'готов':'не готов'}`);
                return{...p,ready:newStatus,lastUpdate:new Date().toISOString()};
            }
            return p;
        });
        await roomRef.update({
            players:updatedPlayers,
            lastActive:new Date().toISOString()
        });
        const readyBtn=document.getElementById("ready-btn");
        readyBtn.disabled=true;
        setTimeout(()=>readyBtn.disabled=false,1000);
    }catch(error){
        console.error("Ошибка:",error);
        alert("Не удалось изменить статус готовности");
    }
}

function startCountdown(){
    const countdownEl=document.getElementById("countdown");
    countdownEl.classList.remove("hidden");
    let count=3;
    countdownEl.textContent=count;
    const interval=setInterval(()=>{
        count--;
        countdownEl.textContent=count;
        if(count<=0){
            clearInterval(interval);
            countdownEl.classList.add("hidden");
        }
    },1000);
}

async function startRoomGame(){
    if(!isCreator||!roomId)return;
    try{
        const roomRef=db.collection("rooms").doc(roomId);
        const roomDoc=await roomRef.get();
        const room=roomDoc.data();
        const allReady=players.length>0&&players.every(p=>p.ready);
        if(!allReady){
            alert("Не все игроки готовы!");
            return;
        }
        const questionCount=20;
        const selectedQuestions=getUniqueQuestions(questionCount);
        await roomRef.update({
            status:"started",
            startTime:new Date().toISOString(),
            questions:selectedQuestions,
            questionCount:questionCount,
            gameStarted:false
        });
        debugLog("🔄 Статус обновлен на 'started'");
        setTimeout(async()=>{
            await roomRef.update({gameStarted:true});
            debugLog("✅ Игра начата!");
        },3000);
    }catch(error){
        console.error("Ошибка:",error);
        alert("Не удалось начать игру");
    }
}

async function forceStartGame(){
    if(!isCreator||!roomId)return;
    if(!confirm("Начать игру, даже если не все готовы?\n\nИгроки, которые не готовы, будут автоматически помечены как готовые.")){
        return;
    }
    try{
        const roomRef=db.collection("rooms").doc(roomId);
        const roomDoc=await roomRef.get();
        const room=roomDoc.data();
        const updatedPlayers=room.players.map(player=>({...player,ready:true}));
        const questionCount=20;
        const selectedQuestions=getUniqueQuestions(questionCount);
        await roomRef.update({
            players:updatedPlayers,
            status:"started",
            startTime:new Date().toISOString(),
            questions:selectedQuestions,
            questionCount:questionCount,
            gameStarted:false
        });
        debugLog("🚀 Принудительный старт: все игроки готовы");
        startCountdown();
        setTimeout(async()=>{
            await roomRef.update({gameStarted:true});
            debugLog("✅ Игра начата принудительно!");
        },3000);
    }catch(error){
        console.error("Ошибка:",error);
        alert("Не удалось начать игру: "+error.message);
    }
}

function startMultiplayerGame(room){
    if(gameStarted)return;
    gameStarted=true;
    debugLog("🎮 Запускаем мультиплеерную игру...");
    qs=room.questions||getUniqueQuestions(room.questionCount||20);
    document.getElementById("lobby").classList.add("hidden");
    document.getElementById("test").classList.remove("hidden");
    document.getElementById("live-results").classList.remove("hidden");
    i=0;
    score=0;
    userAnswers=[];
    startTime=new Date();
    startGame();
    listenToProgress();
}

function listenToProgress(){
    if(progressUnsubscribe)progressUnsubscribe();
    progressUnsubscribe=db.collection("rooms").doc(roomId).onSnapshot((doc)=>{
        if(!doc.exists)return;
        const room=doc.data();
        const resultsContent=document.getElementById("live-results-content");
        const sortedPlayers=[...room.players].sort((a,b)=>b.score-a.score);
        let html="";
        sortedPlayers.forEach((player,index)=>{
            const place=index+1;
            const progress=player.progress||0;
            const total=room.questionCount||20;
            const percent=total>0?Math.round((progress/total)*100):0;
            html+=`<div class="result-row"><div><strong>${place}. ${player.nick}</strong>${player.nick===room.creator?"👑":""}</div><div><strong>${player.score}</strong> очков</div><div>${progress}/${total} (${percent}%)</div></div>`;
        });
        resultsContent.innerHTML=html;
    });
}

async function updatePlayerProgress(){
    if(!roomId||!nick)return;
    try{
        const roomRef=db.collection("rooms").doc(roomId);
        const roomDoc=await roomRef.get();
        const room=roomDoc.data();
        const updatedPlayers=room.players.map(p=>p.nick===nick?{...p,score:score,progress:i,lastUpdate:new Date().toISOString()}:p);
        await roomRef.update({
            players:updatedPlayers,
            lastActive:new Date().toISOString()
        });
    }catch(error){console.error("Ошибка:",error);}
}

function startGame(){
    i=0;
    score=0;
    userAnswers=[];
    startTime=new Date();
    showQuestion();
    updateProgress();
    const bonusPoints=parseInt(localStorage.getItem('bonusPoints')||'0');
    if(bonusPoints>0){
        score+=bonusPoints;
        localStorage.removeItem('bonusPoints');
        showNotification(`➕ Получено ${bonusPoints} бонусных очков!`);
    }
}

function showQuestion(){
    if(i>=qs.length){finishGame();return;}
    const skip=localStorage.getItem('skipQuestion');
    if(skip==='1'&&confirm("Использовать пропуск вопроса?")){
        localStorage.removeItem('skipQuestion');
        i++;
        showQuestion();
        updateProgress();
        return;
    }
    const q=qs[i];
    elapsedQ=0;
    document.getElementById("q").textContent=q.q;
    const optionsDiv=document.getElementById("options");
    optionsDiv.innerHTML="";
    clearInterval(questionTimer);
    document.getElementById("timer").textContent="Время: 0 сек";
    const timeMultiplier=localStorage.getItem('turboMode')==='true'?2:1;
    questionTimer=setInterval(()=>{
        elapsedQ++;
        document.getElementById("timer").textContent=`Время: ${elapsedQ} сек`;
    },1000/timeMultiplier);
    q.a.forEach((answer,index)=>{
        const label=document.createElement("label");
        label.className="option";
        label.innerHTML=`<input type="radio" name="opt" value="${index}"> ${answer}`;
        label.onclick=()=>{
            clearInterval(questionTimer);
            Array.from(document.querySelectorAll(".option")).forEach(o=>o.onclick=null);
            let points=100-Math.floor(elapsedQ/5)*5;
            if(points<0)points=0;
            if(localStorage.getItem('doublePoints')==='true'){
                points*=2;
                localStorage.removeItem('doublePoints');
            }
            const isCorrect=index===q.c;
            const immortality=localStorage.getItem('immortality');
            if(immortality&&!isCorrect){
                const remaining=parseInt(immortality)-1;
                if(remaining>0){
                    localStorage.setItem('immortality',remaining.toString());
                    showNotification(`🛡️ Бессмертие: осталось ${remaining} ошибок`);
                    points=0;
                }else{
                    localStorage.removeItem('immortality');
                }
            }
            if(isCorrect){
                label.classList.add("correct");
                score+=points;
            }else{
                label.classList.add("wrong");
                document.querySelector(`.option input[value="${q.c}"]`).parentElement.classList.add("correct");
            }
            userAnswers.push({
                question:q.q,
                userAnswer:answer,
                correctAnswer:q.a[q.c],
                isCorrect:isCorrect,
                explanation:q.exp,
                time:elapsedQ,
                points:isCorrect?points:0
            });
            if(roomId)updatePlayerProgress();
            setTimeout(()=>{
                i++;
                showQuestion();
                updateProgress();
            },700);
        };
        optionsDiv.appendChild(label);
    });
}

function updateProgress(){
    const percent=Math.round((i/qs.length)*100);
    document.getElementById("prog").style.width=percent+"%";
}

function finishGame(){
    clearInterval(questionTimer);
    const endTime=new Date();
    const elapsedSec=Math.round((endTime-startTime)/1000);
    document.getElementById("test").classList.add("hidden");
    document.getElementById("end").classList.remove("hidden");
    if(roomId){
        document.getElementById("return-btn").classList.remove("hidden");
        showMultiplayerResults(elapsedSec);
    }else{
        document.getElementById("return-btn").classList.add("hidden");
        showSingleResults(elapsedSec);
    }
}

function showSingleResults(elapsedSec){
    const min=Math.floor(elapsedSec/60);
    const sec=elapsedSec%60;
    const correctAnswers=userAnswers.filter(a=>a.isCorrect).length;
    const accuracy=qs.length>0?Math.round((correctAnswers/qs.length)*100):0;
    document.getElementById("res").textContent=`${nick}, ваш результат: ${score} очков\nПравильных ответов: ${correctAnswers} из ${qs.length} (${accuracy}%)\nВремя: ${min} мин ${sec} сек`;
    db.collection("scores").add({
        nick:nick,
        score:score,
        correctAnswers:correctAnswers,
        totalQuestions:qs.length,
        accuracy:accuracy,
        time:elapsedSec,
        mode:"single",
        date:new Date().toISOString()
    });
    showDetailedResults();
}

async function showMultiplayerResults(elapsedSec){
    const roomRef=db.collection("rooms").doc(roomId);
    const roomDoc=await roomRef.get();
    const room=roomDoc.data();
    const updatedPlayers=room.players.map(p=>p.nick===nick?{...p,score:score,finished:true,finishTime:new Date().toISOString(),totalTime:elapsedSec}:p);
    await roomRef.update({
        players:updatedPlayers,
        lastActive:new Date().toISOString(),
        status:"finished"
    });
    const sortedPlayers=[...updatedPlayers].sort((a,b)=>b.score-a.score);
    const playerIndex=sortedPlayers.findIndex(p=>p.nick===nick);
    const playerPlace=playerIndex+1;
    const isWinner=playerPlace===1;
    const correctAnswers=userAnswers.filter(a=>a.isCorrect).length;
    const accuracy=qs.length>0?Math.round((correctAnswers/qs.length)*100):0;
    document.getElementById("res").textContent=`${nick}, ваш результат: ${score} очков\nМесто: ${playerPlace} из ${sortedPlayers.length}\nПравильных ответов: ${correctAnswers} из ${qs.length} (${accuracy}%)`;
    if(isWinner)document.getElementById("winner").classList.remove("hidden");
    let html="";
    sortedPlayers.forEach((player,index)=>{
        const place=index+1;
        const totalQuestions=room.questionCount||20;
        const progress=player.progress||0;
        const accuracy=progress>0?Math.round((player.score/(progress*100))*100)||0:0;
        const finishTime=player.finished?"Завершил":"Не завершил";
        html+=`<tr><td>${place} ${place===1?"🏆":place===2?"🥈":place===3?"🥉":""}</td><td>${player.nick}${player.nick===room.creator?"👑":""}</td><td><strong>${player.score}</strong></td><td>${finishTime}</td><td>${accuracy}%</td></tr>`;
    });
    document.getElementById("final-results").innerHTML=html;
    showDetailedResults();
}

function showDetailedResults(){
    if(detailedResultsShown)return;
    const detailedResultsEl=document.getElementById("detailed-results");
    const answersListEl=document.getElementById("answers-list");
    detailedResultsEl.classList.remove("hidden");
    let html="";
    let correctCount=0;
    userAnswers.forEach((answer,index)=>{
        const questionNumber=index+1;
        const resultClass=answer.isCorrect?"correct":"wrong";
        const icon=answer.isCorrect?"✅":"❌";
        if(answer.isCorrect)correctCount++;
        html+=`<div class="question-result ${resultClass}"><div><strong>${icon} Вопрос ${questionNumber}:</strong> ${answer.question}</div><div><strong>Ваш ответ:</strong> ${answer.userAnswer}</div><div><strong>Правильный ответ:</strong> ${answer.correctAnswer}</div><div><strong>Объяснение:</strong> ${answer.explanation}</div><div><strong>Время:</strong> ${answer.time} сек <strong>Очки:</strong> ${answer.points}</div></div>`;
    });
    const accuracy=qs.length>0?Math.round((correctCount/qs.length)*100):0;
    const totalTime=userAnswers.reduce((sum,answer)=>sum+answer.time,0);
    const avgTime=userAnswers.length>0?Math.round(totalTime/userAnswers.length):0;
    html=`<div style="margin-bottom:20px;padding:15px;background:#e9ecef;border-radius:8px;"><h4>📈 Статистика:</h4><p>Правильных ответов: ${correctCount} из ${qs.length} (${accuracy}%)</p><p>Общее время: ${totalTime} сек, Среднее время: ${avgTime} сек</p><p>Общий счет: ${score} очков</p></div>`+html;
    answersListEl.innerHTML=html;
    detailedResultsShown=true;
    const detailsBtn=document.getElementById("details-btn");
    detailsBtn.textContent="📊 Детальные результаты";
    detailsBtn.onclick=()=>{detailedResultsEl.classList.toggle("hidden");};
}

async function returnToLobby(){
    if(!roomId)return;
    try{
        const roomRef=db.collection("rooms").doc(roomId);
        const roomDoc=await roomRef.get();
        if(roomDoc.exists){
            const room=roomDoc.data();
            const updatedPlayers=room.players.map(p=>p.nick===nick?{...p,ready:false,score:0,progress:0,finished:false}:p);
            await roomRef.update({
                players:updatedPlayers,
                status:"waiting",
                gameStarted:false,
                lastActive:new Date().toISOString()
            });
        }
        if(progressUnsubscribe){
            progressUnsubscribe();
            progressUnsubscribe=null;
        }
        gameStarted=false;
        i=0;
        score=0;
        userAnswers=[];
        detailedResultsShown=false;
        document.getElementById("end").classList.add("hidden");
        document.getElementById("detailed-results").classList.add("hidden");
        showLobby();
    }catch(error){
        console.error("Ошибка:",error);
        alert("Ошибка возврата в лобби");
    }
}

async function leaveRoom(){
    if(!roomId||!nick)return;
    isPageUnloading=true;
    try{
        const roomRef=db.collection("rooms").doc(roomId);
        const roomDoc=await roomRef.get();
        if(roomDoc.exists){
            const room=roomDoc.data();
            const updatedPlayers=room.players.filter(p=>p.nick!==nick);
            if(updatedPlayers.length===0){
                await roomRef.delete();
            }else{
                await roomRef.update({
                    players:updatedPlayers,
                    lastActive:new Date().toISOString()
                });
                if(room.creator===nick&&updatedPlayers.length>0){
                    await roomRef.update({creator:updatedPlayers[0].nick});
                }
            }
        }
    }catch(error){console.error("Ошибка:",error);}
    if(roomUnsubscribe)roomUnsubscribe();
    if(progressUnsubscribe)progressUnsubscribe();
    location.reload();
}

function copyRoomCode(){
    const code=document.getElementById('room-code-display').textContent;
    navigator.clipboard.writeText(code).then(()=>{
        alert('Код скопирован: '+code);
    });
}

function updateLeaderboard(){
    const topEl=document.createElement('div');
    topEl.id='top';
    topEl.style.marginTop='20px';
    db.collection("scores").orderBy("score","desc").orderBy("time","asc").limit(10).onSnapshot(snapshot=>{
        if(!snapshot.empty){
            let html='<h3>🏆 Таблица лидеров:</h3><table><tr><th>Игрок</th><th>Очки</th><th>Время</th></tr>';
            snapshot.forEach((doc,index)=>{
                const data=doc.data();
                const min=Math.floor((data.time||0)/60);
                const sec=(data.time||0)%60;
                html+=`<tr><td>${data.nick}</td><td><strong>${data.score}</strong></td><td>${min}м ${sec}с</td></tr>`;
            });
            html+='</table>';
            topEl.innerHTML=html;
            if(!document.getElementById('top')){
                document.querySelector('.container').appendChild(topEl);
            }
        }
    });
}

setInterval(async()=>{
    try{
        const hourAgo=new Date(Date.now()-3600000).toISOString();
        const oldRooms=await db.collection("rooms").where("lastActive","<",hourAgo).get();
        oldRooms.forEach(doc=>doc.ref.delete());
    }catch(error){console.error("Ошибка очистки:",error);}
},1800000);

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded',function(){
    db.enableNetwork().then(()=>{
        updateConnectionStatus(true);
    }).catch(error=>{
        updateConnectionStatus(false);
        console.error("Нет подключения:",error);
    });
    
    window.addEventListener('beforeunload',function(e){
        if(!isPageUnloading&&(gameStarted||roomId)){
            e.preventDefault();
            e.returnValue='Вы в игре. Уйти?';
            leaveRoom();
        }
    });
    
    firebase.firestore().onSnapshotsInSync(()=>{
        updateConnectionStatus(true);
    });
    
    const secretSkinExpires=localStorage.getItem('secretSkinExpires');
    if(secretSkinExpires&&new Date(secretSkinExpires)>new Date()){
        document.body.classList.add('secret-skin-active');
    }else{
        localStorage.removeItem('secretSkin');
        localStorage.removeItem('secretSkinExpires');
    }
    
    const expertFrameExpires=localStorage.getItem('expertFrame');
    if(expertFrameExpires&&new Date(expertFrameExpires)>new Date()){
    }else{
        localStorage.removeItem('expertFrame');
    }
    
    const nickInput=document.getElementById('nick');
    if(nickInput){
        nickInput.addEventListener('input',function(){
            if(checkForSecretWord(this.value)&&!wheelActivated){
                setTimeout(()=>{
                    activateWheel();
                },500);
            }
        });
    }
    
    document.addEventListener('keydown',(e)=>{
        if(e.ctrlKey&&e.key==='d'){
            const debugEl=document.getElementById('debug-info');
            if(debugEl){
                debugEl.style.display=debugEl.style.display==='none'?'block':'none';
            }
        }
    });
    
    updateLeaderboard();
});
