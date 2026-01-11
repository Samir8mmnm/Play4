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

// Переменные для колеса фортуны
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
    {name:"Удвоение очков",icon:"💰",color:"#FFD700",desc:"Следующий результат ×2",effect:()=>localStorage.setItem('doublePoints','true')},
    {name:"Бессмертие",icon:"🛡️",color:"#4CAF50",desc:"3 ошибки не считаются",effect:()=>localStorage.setItem('immortality','3')},
    {name:"Секретный скин",icon:"🎨",color:"#9C27B0",desc:"Эксклюзивный дизайн",effect:()=>activateSecretSkin()},
    {name:"Турбо-режим",icon:"⚡",color:"#FF9800",desc:"+50% времени",effect:()=>localStorage.setItem('turboMode','true')},
    {name:"Пропуск вопроса",icon:"➡️",color:"#2196F3",desc:"Пропустить 1 вопрос",effect:()=>localStorage.setItem('skipQuestion','1')},
    {name:"Бонусные очки",icon:"➕",color:"#E91E63",desc:"+500 очков",effect:()=>{localStorage.setItem('bonusPoints',(parseInt(localStorage.getItem('bonusPoints')||'0')+500).toString())}},
    {name:"Эксперт",icon:"👑",color:"#795548",desc:"Золотая рамка",effect:()=>localStorage.setItem('expertFrame',new Date(Date.now()+86400000).toISOString())},
    {name:"Сюрприз",icon:"🎁",color:"#00BCD4",desc:"Случайный приз",effect:function(){const p=wheelPrizes.filter(x=>x.name!=="Сюрприз");p[Math.floor(Math.random()*p.length)].effect();return p[0];}}
];

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function shuffleArray(array){const a=[...array];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function getUniqueQuestions(c){return shuffleArray(autoQ).slice(0,Math.min(c,autoQ.length));}
function generateRoomCode(){const c='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';let r='';for(let i=0;i<4;i++)r+=c.charAt(Math.floor(Math.random()*c.length));return r;}
function showLoader(s){document.getElementById('loader').classList.toggle('hidden',!s);}
function updateConnectionStatus(c){const e=document.getElementById('connection-status');e.textContent=c?'✅ Подключено':'❌ Нет подключения';e.className=c?'status-online':'status-offline';e.classList.remove('hidden');}
function showNotification(t){const n=document.createElement('div');n.textContent=t;n.style.cssText='position:fixed;top:20px;right:20px;background:#28a745;color:white;padding:15px;border-radius:8px;z-index:1000;animation:slideIn 0.3s,fadeOut 0.3s 2.7s;';document.body.appendChild(n);setTimeout(()=>n.remove(),3000);}

// ========== КОЛЕСО ФОРТУНЫ ==========
function checkForSecretWord(t){return ['эпштейн','epstein','эпштей','epshtein','фортуна','удача','колесо'].some(w=>t.toLowerCase().includes(w));}
function activateWheel(){if(wheelActivated)return;wheelActivated=true;document.getElementById('wheel-container').classList.remove('hidden');createWheel();if(navigator.vibrate)navigator.vibrate([200,100,200]);}
function createWheel(){const w=document.getElementById('wheel');w.innerHTML='<div class="wheel-pointer"></div>';const t=wheelPrizes.length,a=360/t;wheelPrizes.forEach((p,i)=>{const s=document.createElement('div');s.className='wheel-section';s.innerHTML=`<div class="wheel-section-content">${p.icon}<br><span>${p.name}</span></div>`;s.style.transform=`rotate(${a*i}deg) skewY(${90-a}deg)`;s.style.background=p.color;if(i%2===0)s.style.filter='brightness(0.9)';w.appendChild(s);});}
function spinWheel(){const w=document.getElementById('wheel'),b=document.getElementById('spin-btn');b.disabled=true;b.textContent='🌀 ВРАЩАЕТСЯ...';const f=3+Math.floor(Math.random()*6),p=Math.floor(Math.random()*wheelPrizes.length),a=360/wheelPrizes.length,r=f*360+p*a-a/2;w.style.setProperty('--rotation',`${r}deg`);w.classList.add('spinning');setTimeout(()=>{showPrizeResult(p);w.classList.remove('spinning');b.disabled=false;b.textContent='🎯 КРУТИТЬ КОЛЕСО!';},3000);}
function showPrizeResult(p){const prize=wheelPrizes[p];let actualPrize=prize;if(prize.name==="Сюрприз"){actualPrize=prize.effect();}else{prize.effect();}document.getElementById('result-icon').textContent=actualPrize.icon;document.getElementById('result-text').textContent=`ВЫ ВЫИГРАЛИ: ${actualPrize.name}`;document.getElementById('result-description').textContent=actualPrize.desc;document.getElementById('result-modal').classList.remove('hidden');createConfetti();savePrizeHistory(actualPrize.name);}
function closeResult(){document.getElementById('result-modal').classList.add('hidden');document.getElementById('wheel-container').classList.add('hidden');setTimeout(()=>{wheelActivated=false;},86400000);}
function createConfetti(){for(let i=0;i<150;i++){const c=document.createElement('div');c.style.cssText='position:fixed;width:10px;height:10px;background:#FFD700;border-radius:50%;left:'+(Math.random()*100)+'vw;top:-20px;z-index:99999;pointer-events:none;';document.body.appendChild(c);c.animate([{transform:'translateY(0) rotate(0deg)',opacity:1},{transform:`translateY(${window.innerHeight+20}px) rotate(${360+Math.random()*360}deg)`,opacity:0}],{duration:2000+Math.random()*2000,easing:'cubic-bezier(0.215,0.610,0.355,1)'}).onfinish=()=>c.remove();}}
function activateSecretSkin(){document.body.classList.add('secret-skin-active');localStorage.setItem('secretSkin','true');localStorage.setItem('secretSkinExpires',new Date(Date.now()+86400000).toISOString());setTimeout(()=>{document.body.classList.remove('secret-skin-active');localStorage.removeItem('secretSkin');localStorage.removeItem('secretSkinExpires');},86400000);}
function savePrizeHistory(p){const h=JSON.parse(localStorage.getItem('wheelHistory')||'[]');h.push({prize:p,date:new Date().toISOString(),nick:nick||'Аноним'});if(h.length>10)h.shift();localStorage.setItem('wheelHistory',JSON.stringify(h));}

// ========== ИГРОВАЯ ЛОГИКА ==========
document.getElementById("mode").addEventListener("change",function(){const m=this.value;document.getElementById("single-settings").classList.toggle("hidden",m!=="single");document.getElementById("multi-settings").classList.toggle("hidden",m!=="multi");});

function startSingleGame(){
    nick=document.getElementById("nick").value.trim();
    if(!nick)return alert("Введите ваш ник!");
    const c=parseInt(document.getElementById("auto-count").value)||20;
    qs=getUniqueQuestions(c);
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
        const q=20,r=getUniqueQuestions(q);
        await db.collection("rooms").doc(roomId).set({
            creator:nick,players:[{nick,ready:false,score:0,progress:0,joinedAt:new Date().toISOString()}],
            status:"waiting",questions:r,questionCount:q,gameStarted:false,createdAt:new Date().toISOString(),lastActive:new Date().toISOString()
        });
        showLobby();
        listenToRoom();
    }catch(e){console.error("Ошибка:",e);alert("Не удалось создать комнату");}finally{showLoader(false);}
}

async function joinRoom(){
    nick=document.getElementById("nick").value.trim();
    if(!nick)return alert("Введите ваш ник!");
    roomId=document.getElementById("room-code").value.trim().toUpperCase();
    if(!roomId||roomId.length!==4)return alert("Код комнаты: 4 символа");
    showLoader(true);
    try{
        const r=db.collection("rooms").doc(roomId),d=await r.get();
        if(!d.exists)throw new Error("Комната не найдена");
        const room=d.data();
        if(room.status!=="waiting")throw new Error("Игра уже началась");
        if(room.players.length>=8)throw new Error("Комната заполнена");
        if(room.players.some(p=>p.nick===nick))throw new Error("Такой ник уже есть");
        const p={nick,ready:false,score:0,progress:0,joinedAt:new Date().toISOString()};
        await r.update({players:[...room.players,p],lastActive:new Date().toISOString()});
        isCreator=false;
        showLobby();
        listenToRoom();
    }catch(e){alert(e.message);}finally{showLoader(false);}
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
            if(!doc.exists){alert("Комната удалена");location.reload();return;}
            const room=doc.data();
            players=room.players||[];
            if(room.status==="waiting")db.collection("rooms").doc(roomId).update({lastActive:new Date().toISOString()});
            updatePlayersList(room);
            updateLobbyControls(room);
            if(room.status==="started"&&!room.gameStarted&&!document.getElementById("countdown").classList.contains("hidden")){
                startCountdown();
            }
            if(room.gameStarted&&!gameStarted&&room.status==="started"){
                console.log("🎮 Игра начинается!");
                startMultiplayerGame(room);
            }
            if(room.status==="finished"&&gameStarted){
                showFinalResults(room);
            }
        },
        (e)=>{console.error("Ошибка:",e);alert("Ошибка подключения");}
    );
}

function updatePlayersList(room){
    const p=document.getElementById("players-list"),c=document.getElementById("players-count");
    c.textContent=players.length;
    let h="";
    players.forEach(player=>{
        let cl="player-card";
        if(player.ready)cl+=" ready";
        if(player.nick===room.creator)cl+=" creator";
        h+=`<div class="${cl}"><strong>${player.nick}</strong>${player.nick===room.creator?"👑":""}<div>${player.ready?"✅ Готов":"⏳ Ожидает"}</div>${player.score>0?`<div>🏆 ${player.score}</div>`:''}</div>`;
    });
    p.innerHTML=h;
}

function updateLobbyControls(room){
    const r=document.getElementById("ready-btn"),s=document.getElementById("start-btn"),f=document.getElementById("force-start-btn");
    const p=players.find(x=>x.nick===nick);
    isReady=p?p.ready:false;
    if(p){r.textContent=isReady?"❌ Не готов":"✅ Я готов";r.className=isReady?"danger":"success";}
    if(isCreator){
        const a=players.length>0&&players.every(x=>x.ready);
        s.classList.toggle("hidden",!a||players.length<1);
        s.disabled=!a;
        f.classList.toggle("hidden",a); // Показываем принудительный старт только если не все готовы
    }else{s.classList.add("hidden");f.classList.add("hidden");}
}

async function toggleReady(){
    if(!roomId||!nick)return;
    try{
        const r=db.collection("rooms").doc(roomId),d=await r.get(),room=d.data();
        const u=room.players.map(p=>p.nick===nick?{...p,ready:!p.ready}:p);
        await r.update({players:u,lastActive:new Date().toISOString()});
    }catch(e){console.error("Ошибка:",e);}
}

function startCountdown(){
    const c=document.getElementById("countdown");
    c.classList.remove("hidden");
    let count=3;
    c.textContent=count;
    const i=setInterval(()=>{
        count--;
        c.textContent=count;
        if(count<=0){clearInterval(i);c.classList.add("hidden");}
    },1000);
}

// 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ СТАРТА ИГРЫ
async function startRoomGame(){
    if(!isCreator||!roomId)return;
    try{
        const roomRef=db.collection("rooms").doc(roomId);
        const roomDoc=await roomRef.get();
        const room=roomDoc.data();
        
        const allReady=room.players.length>0&&room.players.every(p=>p.ready);
        if(!allReady){
            alert("Не все игроки готовы!");
            return;
        }
        
        const questionCount=20;
        const selectedQuestions=getUniqueQuestions(questionCount);
        
        // Обновляем статус комнаты
        await roomRef.update({
            status:"started",
            startTime:new Date().toISOString(),
            questions:selectedQuestions,
            questionCount:questionCount,
            gameStarted:false
        });
        
        console.log("🔄 Статус обновлен на 'started'");
        
        // Ждем 3 секунды и запускаем игру для всех
        setTimeout(async()=>{
            await roomRef.update({
                gameStarted:true
            });
            console.log("✅ Игра начата!");
        },3000);
        
    }catch(error){
        console.error("Ошибка:",error);
        alert("Не удалось начать игру");
    }
}

// 🚀 ПРИНУДИТЕЛЬНЫЙ СТАРТ
async function forceStartGame(){
    if(!isCreator||!roomId)return;
    if(!confirm("Начать игру, даже если не все готовы?"))return;
    
    try{
        const roomRef=db.collection("rooms").doc(roomId);
        const questionCount=20;
        const selectedQuestions=getUniqueQuestions(questionCount);
        
        await roomRef.update({
            status:"started",
            startTime:new Date().toISOString(),
            questions:selectedQuestions,
            questionCount:questionCount,
            gameStarted:false
        });
        
        // Сразу запускаем игру
        setTimeout(async()=>{
            await roomRef.update({gameStarted:true});
        },1000);
        
    }catch(error){
        console.error("Ошибка:",error);
        alert("Не удалось начать игру");
    }
}

function startMultiplayerGame(room){
    if(gameStarted)return;
    
    gameStarted=true;
    console.log("🎮 Запускаем игру...");
    
    // Все получают одинаковые вопросы
    qs=room.questions||getUniqueQuestions(room.questionCount||20);
    
    // Скрываем лобби, показываем игру
    document.getElementById("lobby").classList.add("hidden");
    document.getElementById("test").classList.remove("hidden");
    document.getElementById("live-results").classList.remove("hidden");
    
    // Сбрасываем состояние
    i=0;
    score=0;
    userAnswers=[];
    startTime=new Date();
    
    // Запускаем игру
    startGame();
    
    // Слушаем прогресс других
    listenToProgress();
}

function listenToProgress(){
    if(progressUnsubscribe)progressUnsubscribe();
    progressUnsubscribe=db.collection("rooms").doc(roomId).onSnapshot((doc)=>{
        if(!doc.exists)return;
        const room=doc.data();
        const r=document.getElementById("live-results-content");
        const s=[...room.players].sort((a,b)=>b.score-a.score);
        let h="";
        s.forEach((p,idx)=>{
            const pl=idx+1,pr=p.progress||0,t=room.questionCount||20,pc=t>0?Math.round((pr/t)*100):0;
            h+=`<div class="result-row"><div><strong>${pl}. ${p.nick}</strong>${p.nick===room.creator?"👑":""}</div><div><strong>${p.score}</strong> очков</div><div>${pr}/${t} (${pc}%)</div></div>`;
        });
        r.innerHTML=h;
    });
}

async function updatePlayerProgress(){
    if(!roomId||!nick)return;
    try{
        const r=db.collection("rooms").doc(roomId),d=await r.get(),room=d.data();
        const u=room.players.map(p=>p.nick===nick?{...p,score:score,progress:i,lastUpdate:new Date().toISOString()}:p);
        await r.update({players:u,lastActive:new Date().toISOString()});
    }catch(e){console.error("Ошибка:",e);}
}

function startGame(){
    i=0;
    score=0;
    userAnswers=[];
    startTime=new Date();
    showQuestion();
    updateProgress();
    const bp=parseInt(localStorage.getItem('bonusPoints')||'0');
    if(bp>0){score+=bp;localStorage.removeItem('bonusPoints');showNotification(`➕ Получено ${bp} бонусных очков!`);}
}

function showQuestion(){
    if(i>=qs.length){finishGame();return;}
    const sq=localStorage.getItem('skipQuestion');
    if(sq==='1'&&confirm("Использовать пропуск вопроса?")){localStorage.removeItem('skipQuestion');i++;showQuestion();updateProgress();return;}
    const q=qs[i];
    elapsedQ=0;
    document.getElementById("q").textContent=q.q;
    const o=document.getElementById("options");
    o.innerHTML="";
    clearInterval(questionTimer);
    document.getElementById("timer").textContent="Время: 0 сек";
    const tm=localStorage.getItem('turboMode')==='true'?2:1;
    questionTimer=setInterval(()=>{elapsedQ++;document.getElementById("timer").textContent=`Время: ${elapsedQ} сек`;},1000/tm);
    q.a.forEach((a,idx)=>{
        const l=document.createElement("label");
        l.className="option";
        l.innerHTML=`<input type="radio" name="opt" value="${idx}"> ${a}`;
        l.onclick=()=>{
            clearInterval(questionTimer);
            Array.from(document.querySelectorAll(".option")).forEach(x=>x.onclick=null);
            let p=100-Math.floor(elapsedQ/5)*5;
            if(p<0)p=0;
            if(localStorage.getItem('doublePoints')==='true'){p*=2;localStorage.removeItem('doublePoints');}
            const c=idx===q.c;
            const im=localStorage.getItem('immortality');
            if(im&&!c){
                const r=parseInt(im)-1;
                if(r>0){localStorage.setItem('immortality',r.toString());showNotification(`🛡️ Осталось ${r} ошибок`);p=0;}
                else{localStorage.removeItem('immortality');}
            }
            if(c){l.classList.add("correct");score+=p;}
            else{l.classList.add("wrong");document.querySelector(`.option input[value="${q.c}"]`).parentElement.classList.add("correct");}
            userAnswers.push({question:q.q,userAnswer:a,correctAnswer:q.a[q.c],isCorrect:c,explanation:q.exp,time:elapsedQ,points:c?p:0});
            if(roomId){updatePlayerProgress();}
            setTimeout(()=>{i++;showQuestion();updateProgress();},700);
        };
        o.appendChild(l);
    });
}

function updateProgress(){
    const p=Math.round((i/qs.length)*100);
    document.getElementById("prog").style.width=p+"%";
}

function finishGame(){
    clearInterval(questionTimer);
    const e=new Date(),s=Math.round((e-startTime)/1000);
    document.getElementById("test").classList.add("hidden");
    document.getElementById("end").classList.remove("hidden");
    if(roomId){
        document.getElementById("return-btn").classList.remove("hidden");
        showMultiplayerResults(s);
    }else{
        document.getElementById("return-btn").classList.add("hidden");
        showSingleResults(s);
    }
}

function showSingleResults(s){
    const m=Math.floor(s/60),sec=s%60,c=userAnswers.filter(a=>a.isCorrect).length,a=qs.length>0?Math.round((c/qs.length)*100):0;
    document.getElementById("res").textContent=`${nick}, ваш результат: ${score} очков\nПравильных ответов: ${c} из ${qs.length} (${a}%)\nВремя: ${m} мин ${sec} сек`;
    db.collection("scores").add({nick:nick,score:score,correctAnswers:c,totalQuestions:qs.length,accuracy:a,time:s,mode:"single",date:new Date().toISOString()});
    showDetailedResults();
}

async function showMultiplayerResults(elapsedSec){
    const r=db.collection("rooms").doc(roomId),d=await r.get(),room=d.data();
    const u=room.players.map(p=>p.nick===nick?{...p,score:score,finished:true,finishTime:new Date().toISOString(),totalTime:elapsedSec}:p);
    await r.update({players:u,lastActive:new Date().toISOString(),status:"finished"});
    const s=[...u].sort((a,b)=>b.score-a.score);
    const idx=s.findIndex(p=>p.nick===nick),place=idx+1,winner=place===1;
    const c=userAnswers.filter(a=>a.isCorrect).length,a=qs.length>0?Math.round((c/qs.length)*100):0;
    document.getElementById("res").textContent=`${nick}, ваш результат: ${score} очков\nМесто: ${place} из ${s.length}\nПравильных ответов: ${c} из ${qs.length} (${a}%)`;
    if(winner)document.getElementById("winner").classList.remove("hidden");
    let h="";
    s.forEach((p,idx)=>{
        const pl=idx+1,t=room.questionCount||20,pr=p.progress||0,ac=pr>0?Math.round((p.score/(pr*100))*100)||0:0,ft=p.finished?"Завершил":"Не завершил";
        h+=`<tr><td>${pl} ${pl===1?"🏆":pl===2?"🥈":pl===3?"🥉":""}</td><td>${p.nick}${p.nick===room.creator?"👑":""}</td><td><strong>${p.score}</strong></td><td>${ft}</td><td>${ac}%</td></tr>`;
    });
    document.getElementById("final-results").innerHTML=h;
    showDetailedResults();
}

function showDetailedResults(){
    if(detailedResultsShown)return;
    const d=document.getElementById("detailed-results"),a=document.getElementById("answers-list");
    d.classList.remove("hidden");
    let h="";
    let c=0;
    userAnswers.forEach((ans,idx)=>{
        const n=idx+1,cl=ans.isCorrect?"correct":"wrong",ic=ans.isCorrect?"✅":"❌";
        if(ans.isCorrect)c++;
        h+=`<div class="question-result ${cl}"><div><strong>${ic} Вопрос ${n}:</strong> ${ans.question}</div><div><strong>Ваш ответ:</strong> ${ans.userAnswer}</div><div><strong>Правильный ответ:</strong> ${ans.correctAnswer}</div><div><strong>Объяснение:</strong> ${ans.explanation}</div><div><strong>Время:</strong> ${ans.time} сек <strong>Очки:</strong> ${ans.points}</div></div>`;
    });
    const ac=qs.length>0?Math.round((c/qs.length)*100):0,t=userAnswers.reduce((s,a)=>s+a.time,0),av=userAnswers.length>0?Math.round(t/userAnswers.length):0;
    h=`<div style="margin-bottom:20px;padding:15px;background:#e9ecef;border-radius:8px;"><h4>📈 Статистика:</h4><p>Правильных ответов: ${c} из ${qs.length} (${ac}%)</p><p>Общее время: ${t} сек, Среднее время: ${av} сек</p><p>Общий счет: ${score} очков</p></div>`+h;
    a.innerHTML=h;
    detailedResultsShown=true;
    const b=document.getElementById("details-btn");
    b.textContent="📊 Детальные результаты";
    b.onclick=()=>{d.classList.toggle("hidden");};
}

async function returnToLobby(){
    if(!roomId)return;
    try{
        const r=db.collection("rooms").doc(roomId),d=await r.get();
        if(d.exists){
            const room=d.data();
            const u=room.players.map(p=>p.nick===nick?{...p,ready:false,score:0,progress:0,finished:false}:p);
            await r.update({players:u,status:"waiting",gameStarted:false,lastActive:new Date().toISOString()});
        }
        if(progressUnsubscribe){progressUnsubscribe();progressUnsubscribe=null;}
        gameStarted=false;
        i=0;
        score=0;
        userAnswers=[];
        detailedResultsShown=false;
        document.getElementById("end").classList.add("hidden");
        document.getElementById("detailed-results").classList.add("hidden");
        showLobby();
    }catch(e){console.error("Ошибка:",e);alert("Ошибка возврата в лобби");}
}

async function leaveRoom(){
    if(!roomId||!nick)return;
    isPageUnloading=true;
    try{
        const r=db.collection("rooms").doc(roomId),d=await r.get();
        if(d.exists){
            const room=d.data();
            const u=room.players.filter(p=>p.nick!==nick);
            if(u.length===0){await r.delete();}
            else{
                await r.update({players:u,lastActive:new Date().toISOString()});
                if(room.creator===nick&&u.length>0){await r.update({creator:u[0].nick});}
            }
        }
    }catch(e){console.error("Ошибка:",e);}
    if(roomUnsubscribe)roomUnsubscribe();
    if(progressUnsubscribe)progressUnsubscribe();
    location.reload();
}

function copyRoomCode(){
    const c=document.getElementById('room-code-display').textContent;
    navigator.clipboard.writeText(c).then(()=>{alert('Код скопирован: '+c);});
}

function updateLeaderboard(){
    const t=document.createElement('div');
    t.id='top';
    t.style.marginTop='20px';
    db.collection("scores").orderBy("score","desc").orderBy("time","asc").limit(10).onSnapshot(s=>{
        if(!s.empty){
            let h='<h3>🏆 Таблица лидеров:</h3><table><tr><th>Игрок</th><th>Очки</th><th>Время</th></tr>';
            s.forEach((doc,idx)=>{const x=doc.data();const m=Math.floor((x.time||0)/60);const sec=(x.time||0)%60;h+=`<tr><td>${x.nick}</td><td><strong>${x.score}</strong></td><td>${m}м ${sec}с</td></tr>`;});
            h+='</table>';
            t.innerHTML=h;
            if(!document.getElementById('top')){document.querySelector('.container').appendChild(t);}
        }
    });
}

setInterval(async()=>{
    try{
        const h=new Date(Date.now()-3600000).toISOString();
        const o=await db.collection("rooms").where("lastActive","<",h).get();
        o.forEach(d=>{d.ref.delete();});
    }catch(e){console.error("Ошибка очистки:",e);}
},1800000);

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded',function(){
    db.enableNetwork().then(()=>{updateConnectionStatus(true);}).catch(e=>{updateConnectionStatus(false);console.error("Нет подключения:",e);});
    window.addEventListener('beforeunload',function(e){
        if(!isPageUnloading&&(gameStarted||roomId)){
            e.preventDefault();
            e.returnValue='Вы в игре. Уйти?';
            leaveRoom();
        }
    });
    firebase.firestore().onSnapshotsInSync(()=>{updateConnectionStatus(true);});
    const se=localStorage.getItem('secretSkinExpires');
    if(se&&new Date(se)>new Date()){document.body.classList.add('secret-skin-active');}else{localStorage.removeItem('secretSkin');localStorage.removeItem('secretSkinExpires');}
    const ee=localStorage.getItem('expertFrame');
    if(ee&&new Date(ee)>new Date()){}else{localStorage.removeItem('expertFrame');}
    const ni=document.getElementById('nick');
    if(ni){ni.addEventListener('input',function(){if(checkForSecretWord(this.value)&&!wheelActivated){setTimeout(()=>{activateWheel();},500);}});}
    updateLeaderboard();
});
