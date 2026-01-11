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
let currentPrize = null;

// ========== БАЗА ВОПРОСОВ (50 уникальных) ==========
const autoQ = [
    // Простые уравнения (1-10)
    {id: 1, q:"2 + 2 × 2 = ?", a:["6", "8", "4", "10"], c:0, exp:"Сначала умножение: 2 × 2 = 4, затем сложение: 2 + 4 = 6."},
    {id: 2, q:"Сколько будет 15% от 200?", a:["15", "30", "25", "20"], c:1, exp:"15% = 0.15. 200 × 0.15 = 30."},
    {id: 3, q:"5² + 3² = ?", a:["34", "25", "29", "36"], c:0, exp:"5² = 25, 3² = 9. 25 + 9 = 34."},
    {id: 4, q:"√144 = ?", a:["11", "12", "13", "14"], c:1, exp:"12 × 12 = 144, поэтому √144 = 12."},
    {id: 5, q:"Чему равно 3/4 от 80?", a:["50", "60", "70", "80"], c:1, exp:"80 ÷ 4 = 20, 20 × 3 = 60."},
    {id: 6, q:"7 × 8 = ?", a:["48", "54", "56", "64"], c:2, exp:"Таблица умножения: 7 × 8 = 56."},
    {id: 7, q:"Сколько будет 1000 ÷ 40?", a:["25", "30", "35", "40"], c:0, exp:"1000 ÷ 40 = 25."},
    {id: 8, q:"Какое число следующее: 2, 4, 8, 16, ...?", a:["24", "32", "48", "64"], c:1, exp:"Каждое число умножается на 2: 16×2=32."},
    {id: 9, q:"Сколько градусов в прямом углу?", a:["45°", "90°", "180°", "360°"], c:1, exp:"Прямой угол всегда равен 90 градусам."},
    {id: 10, q:"Чему равно 0.5 в виде дроби?", a:["1/5", "1/4", "1/3", "1/2"], c:3, exp:"0.5 = 5/10 = 1/2."},
    
    // Алгебра (11-15)
    {id: 11, q:"Если x + 7 = 15, то x = ?", a:["6", "7", "8", "9"], c:2, exp:"x = 15 - 7 = 8."},
    {id: 12, q:"Решите: 2x - 5 = 11", a:["x = 6", "x = 7", "x = 8", "x = 9"], c:2, exp:"2x = 11 + 5 = 16, x = 16 ÷ 2 = 8."},
    {id: 13, q:"Упростите: 3a + 2b + 4a - b", a:["7a + b", "7a + 3b", "a + b", "7a - b"], c:0, exp:"3a + 4a = 7a, 2b - b = b."},
    {id: 14, q:"Чему равно (x + 3)(x - 3)?", a:["x² - 9", "x² + 9", "x² - 6", "x² + 6"], c:0, exp:"Формула разности квадратов: (a+b)(a-b) = a² - b²."},
    {id: 15, q:"Если y = 2x + 1 и x = 3, то y = ?", a:["5", "6", "7", "8"], c:2, exp:"y = 2×3 + 1 = 6 + 1 = 7."},
    
    // Геометрия (16-20)
    {id: 16, q:"Периметр квадрата со стороной 5 см?", a:["15 см", "20 см", "25 см", "30 см"], c:1, exp:"Периметр квадрата: P = 4 × a = 4 × 5 = 20 см."},
    {id: 17, q:"Площадь прямоугольника 6×8 см?", a:["48 см²", "42 см²", "36 см²", "28 см²"], c:0, exp:"Площадь = длина × ширина = 6 × 8 = 48 см²."},
    {id: 18, q:"Сколько градусов в треугольнике?", a:["90°", "180°", "270°", "360°"], c:1, exp:"Сумма углов треугольника всегда равна 180°."},
    {id: 19, q:"Диаметр круга 10 см. Радиус?", a:["5 см", "10 см", "15 см", "20 см"], c:0, exp:"Радиус = диаметр ÷ 2 = 10 ÷ 2 = 5 см."},
    {id: 20, q:"Объем куба с ребром 3 см?", a:["9 см³", "18 см³", "27 см³", "36 см³"], c:2, exp:"Объем куба: V = a³ = 3³ = 27 см³."},
    
    // Логика (21-25)
    {id: 21, q:"Следующее число: 1, 4, 9, 16, ...?", a:["20", "24", "25", "36"], c:2, exp:"Это квадраты чисел: 1²=1, 2²=4, 3²=9, 4²=16, 5²=25."},
    {id: 22, q:"Следующее число: 2, 6, 12, 20, ...?", a:["28", "30", "32", "36"], c:1, exp:"Разности: +4, +6, +8, следующее +10: 20+10=30."},
    {id: 23, q:"Сколько сторон у шестиугольника?", a:["5", "6", "7", "8"], c:1, exp:"Гексагон (шестиугольник) имеет 6 сторон."},
    {id: 24, q:"Какое число пропущено: 3, 7, 15, 31, ?", a:["47", "55", "63", "72"], c:2, exp:"Правило: ×2+1. 31×2+1=63."},
    {id: 25, q:"Сумма чисел от 1 до 10?", a:["45", "50", "55", "60"], c:2, exp:"Сумма арифметической прогрессии: (1+10)×10/2 = 55."},
    
    // Дополнительные (26-50)
    {id: 26, q:"Сколько будет ¾ + ½?", a:["1¼", "1½", "1¾", "2"], c:0, exp:"¾ + ½ = ¾ + 2/4 = 5/4 = 1¼"},
    {id: 27, q:"12 × 11 = ?", a:["121", "132", "144", "122"], c:1, exp:"12 × 11 = 132"},
    {id: 28, q:"45 ÷ 0.5 = ?", a:["22.5", "45", "90", "180"], c:2, exp:"45 ÷ 0.5 = 45 ÷ 1/2 = 45 × 2 = 90"},
    {id: 29, q:"2³ × 2² = ?", a:["16", "32", "64", "128"], c:1, exp:"2³ = 8, 2² = 4, 8 × 4 = 32"},
    {id: 30, q:"Сколько минут в 2.5 часа?", a:["120", "150", "180", "200"], c:1, exp:"2.5 × 60 = 150 минут"},
    {id: 31, q:"9 × 7 = ?", a:["56", "63", "72", "81"], c:1, exp:"9 × 7 = 63"},
    {id: 32, q:"Сколько будет 25% от 80?", a:["15", "20", "25", "30"], c:1, exp:"25% = 0.25, 80 × 0.25 = 20"},
    {id: 33, q:"√64 = ?", a:["6", "7", "8", "9"], c:2, exp:"8 × 8 = 64"},
    {id: 34, q:"Чему равно 1/3 от 99?", a:["30", "33", "36", "39"], c:1, exp:"99 ÷ 3 = 33"},
    {id: 35, q:"8² - 4² = ?", a:["48", "52", "56", "60"], c:0, exp:"64 - 16 = 48"},
    {id: 36, q:"Сколько градусов в окружности?", a:["180°", "270°", "360°", "450°"], c:2, exp:"Полная окружность = 360°"},
    {id: 37, q:"3/5 = ?%", a:["30%", "40%", "50%", "60%"], c:3, exp:"3/5 = 0.6 = 60%"},
    {id: 38, q:"Следующее число: 1, 3, 6, 10, ...?", a:["13", "14", "15", "16"], c:2, exp:"+2, +3, +4, +5 = 15"},
    {id: 39, q:"Площадь круга с радиусом 7 см? (π≈3.14)", a:["~154 см²", "~144 см²", "~134 см²", "~124 см²"], c:0, exp:"πr² = 3.14 × 49 ≈ 154"},
    {id: 40, q:"Сколько нулей в миллионе?", a:["4", "5", "6", "7"], c:2, exp:"1,000,000 - шесть нулей"},
    {id: 41, q:"15 + 27 = ?", a:["32", "42", "52", "62"], c:1, exp:"15 + 27 = 42"},
    {id: 42, q:"Чему равно 0.75 в процентах?", a:["7.5%", "75%", "750%", "0.75%"], c:1, exp:"0.75 × 100 = 75%"},
    {id: 43, q:"Сколько сторон у октагона?", a:["6", "7", "8", "9"], c:2, exp:"Октагон имеет 8 сторон"},
    {id: 44, q:"6 × 9 = ?", a:["45", "54", "63", "72"], c:1, exp:"6 × 9 = 54"},
    {id: 45, q:"Сколько будет 200 ÷ 8?", a:["20", "25", "30", "35"], c:1, exp:"200 ÷ 8 = 25"},
    {id: 46, q:"4³ = ?", a:["12", "16", "64", "256"], c:2, exp:"4 × 4 × 4 = 64"},
    {id: 47, q:"Сколько месяцев в 1.5 годах?", a:["12", "15", "18", "21"], c:2, exp:"1.5 × 12 = 18 месяцев"},
    {id: 48, q:"Чему равен √81?", a:["7", "8", "9", "10"], c:2, exp:"9 × 9 = 81"},
    {id: 49, q:"Сколько будет 5! (факториал)?", a:["60", "100", "120", "150"], c:2, exp:"5! = 5×4×3×2×1 = 120"},
    {id: 50, q:"Чему равно 2⁵?", a:["16", "32", "64", "128"], c:1, exp:"2⁵ = 2×2×2×2×2 = 32"}
];

// ========== ПРИЗЫ ДЛЯ КОЛЕСА ФОРТУНЫ ==========
const wheelPrizes = [
    { 
        name: "Удвоение очков", 
        icon: "💰", 
        color: "#FFD700",
        description: "Ваш следующий результат будет удвоен!",
        effect: function() { 
            localStorage.setItem('doublePoints', 'true');
            showNotification("💰 Удвоение очков активировано!");
        }
    },
    { 
        name: "Бессмертие", 
        icon: "🛡️", 
        color: "#4CAF50",
        description: "3 следующие ошибки не будут считаться!",
        effect: function() { 
            localStorage.setItem('immortality', '3');
            showNotification("🛡️ Бессмертие активировано (3 ошибки)!");
        }
    },
    { 
        name: "Секретный скин", 
        icon: "🎨", 
        color: "#9C27B0",
        description: "Эксклюзивный дизайн интерфейса!",
        effect: function() { 
            activateSecretSkin();
            showNotification("🎨 Секретный скин активирован!");
        }
    },
    { 
        name: "Турбо-режим", 
        icon: "⚡", 
        color: "#FF9800",
        description: "В 2 раза больше времени на ответы!",
        effect: function() { 
            localStorage.setItem('turboMode', 'true');
            showNotification("⚡ Турбо-режим активирован!");
        }
    },
    { 
        name: "Пропуск вопроса", 
        icon: "➡️", 
        color: "#2196F3",
        description: "Можете пропустить 1 сложный вопрос!",
        effect: function() { 
            localStorage.setItem('skipQuestion', '1');
            showNotification("➡️ Пропуск вопроса активирован!");
        }
    },
    { 
        name: "Бонусные очки", 
        icon: "➕", 
        color: "#E91E63",
        description: "+500 очков к следующей игре!",
        effect: function() { 
            const currentBonus = parseInt(localStorage.getItem('bonusPoints') || '0');
            localStorage.setItem('bonusPoints', (currentBonus + 500).toString());
            showNotification("➕ +500 бонусных очков!");
        }
    },
    { 
        name: "Эксперт", 
        icon: "👑", 
        color: "#795548",
        description: "Золотая рамка ника на 24 часа!",
        effect: function() { 
            localStorage.setItem('expertFrame', new Date(Date.now() + 24*60*60*1000).toISOString());
            showNotification("👑 Статус Эксперт активирован!");
        }
    },
    { 
        name: "Сюрприз", 
        icon: "🎁", 
        color: "#00BCD4",
        description: "Случайный эффект из всех возможных!",
        effect: function() { 
            const prizesWithoutSurprise = wheelPrizes.filter(p => p.name !== "Сюрприз");
            const randomPrize = prizesWithoutSurprise[Math.floor(Math.random() * prizesWithoutSurprise.length)];
            randomPrize.effect();
            return randomPrize;
        }
    }
];

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

// Перемешивание массива
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Получение уникальных вопросов
function getUniqueQuestions(count) {
    const maxQuestions = Math.min(count, autoQ.length);
    const shuffled = shuffleArray(autoQ);
    return shuffled.slice(0, maxQuestions);
}

// Генерация кода комнаты
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Показать/скрыть лоадер
function showLoader(show) {
    document.getElementById('loader').classList.toggle('hidden', !show);
}

// Обновить статус подключения
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    statusEl.textContent = connected ? '✅ Подключено к серверу' : '❌ Нет подключения';
    statusEl.className = connected ? 'status-online' : 'status-offline';
    statusEl.classList.remove('hidden');
}

// Показать уведомление
function showNotification(text) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = text;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s, fadeOut 0.3s 2.7s;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ========== КОЛЕСО ФОРТУНЫ ==========

// Проверка на секретное слово
function checkForSecretWord(text) {
    const secretWords = ['эпштейн', 'epstein', 'эпштей', 'epshtein', 'фортуна', 'удача'];
    const lowerText = text.toLowerCase();
    
    // Проверяем наличие любого из секретных слов
    const found = secretWords.some(word => lowerText.includes(word));
    
    // Дополнительная проверка: если слово "колесо" и "фортуна" рядом
    if (lowerText.includes('колесо') && lowerText.includes('фортуна')) {
        return true;
    }
    
    return found;
}

// Активация колеса
function activateWheel() {
    if (wheelActivated) return;
    
    wheelActivated = true;
    document.getElementById('wheel-container').classList.remove('hidden');
    createWheel();
    
    // Вибрация для мобильных устройств
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
    }
    
    // Звуковой эффект (если нужен)
    playWheelSound();
}

// Создание колеса
function createWheel() {
    const wheel = document.getElementById('wheel');
    wheel.innerHTML = '<div class="wheel-pointer"></div>';
    
    const totalSections = wheelPrizes.length;
    const anglePerSection = 360 / totalSections;
    
    wheelPrizes.forEach((prize, index) => {
        const section = document.createElement('div');
        section.className = 'wheel-section';
        section.innerHTML = `<div>${prize.icon}<br><small>${prize.name}</small></div>`;
        
        // Угол поворота
        const rotateAngle = anglePerSection * index;
        const skewAngle = 90 - anglePerSection;
        
        // Устанавливаем стили
        section.style.transform = `rotate(${rotateAngle}deg) skewY(${skewAngle}deg)`;
        section.style.background = prize.color;
        
        // Для четных секций делаем немного темнее
        if (index % 2 === 0) {
            section.style.filter = 'brightness(0.9)';
        }
        
        wheel.appendChild(section);
    });
}

// Вращение колеса
function spinWheel() {
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spin-btn');
    
    // Отключаем кнопку во время вращения
    spinBtn.disabled = true;
    spinBtn.textContent = '🌀 ВРАЩАЕТСЯ...';
    
    // Случайное количество оборотов (3-8 полных оборотов + смещение на приз)
    const fullRotations = 3 + Math.floor(Math.random() * 6);
    const prizeIndex = Math.floor(Math.random() * wheelPrizes.length);
    const anglePerSection = 360 / wheelPrizes.length;
    
    // Вычисляем конечный угол
    const finalAngle = (fullRotations * 360) + (prizeIndex * anglePerSection) - (anglePerSection / 2);
    
    // Устанавливаем CSS переменную для анимации
    wheel.style.setProperty('--rotation', `${finalAngle}deg`);
    wheel.classList.add('spinning');
    
    // Звук вращения
    playSpinSound();
    
    // Ждем окончания анимации
    setTimeout(() => {
        showPrizeResult(prizeIndex);
        wheel.classList.remove('spinning');
        spinBtn.disabled = false;
        spinBtn.textContent = '🎯 КРУТИТЬ КОЛЕСО!';
    }, 3000);
}

// Показать результат приза
function showPrizeResult(prizeIndex) {
    const prize = wheelPrizes[prizeIndex];
    currentPrize = prize;
    
    // Если приз "Сюрприз", получаем случайный
    let actualPrize = prize;
    if (prize.name === "Сюрприз") {
        actualPrize = prize.effect();
    } else {
        // Применяем эффект приза
        prize.effect();
    }
    
    // Показываем модальное окно
    document.getElementById('result-icon').textContent = actualPrize.icon;
    document.getElementById('result-text').textContent = `ВЫ ВЫИГРАЛИ: ${actualPrize.name}`;
    document.getElementById('result-description').textContent = actualPrize.description;
    document.getElementById('result-modal').classList.remove('hidden');
    
    // Эффект конфетти
    createConfetti();
    
    // Сохраняем в историю
    savePrizeHistory(actualPrize.name);
}

// Закрытие результата
function closeResult() {
    document.getElementById('result-modal').classList.add('hidden');
    document.getElementById('wheel-container').classList.add('hidden');
    
    // Через 24 часа можно снова активировать
    setTimeout(() => {
        wheelActivated = false;
    }, 24 * 60 * 60 * 1000);
}

// Эффект конфетти
function createConfetti() {
    const colors = ['#FFD700', '#4CAF50', '#2196F3', '#E91E63', '#9C27B0', '#FF9800'];
    
    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-20px';
        confetti.style.zIndex = '99999';
        confetti.style.pointerEvents = 'none';
        
        document.body.appendChild(confetti);
        
        // Анимация падения
        const animation = confetti.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight + 20}px) rotate(${360 + Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: 2000 + Math.random() * 2000,
            easing: 'cubic-bezier(0.215, 0.610, 0.355, 1)'
        });
        
        // Удаляем после анимации
        animation.onfinish = () => confetti.remove();
    }
}

// Активация секретного скина
function activateSecretSkin() {
    // Добавляем класс для секретного скина
    document.body.classList.add('secret-skin-active');
    
    // Сохраняем в localStorage
    localStorage.setItem('secretSkin', 'true');
    localStorage.setItem('secretSkinExpires', new Date(Date.now() + 24*60*60*1000).toISOString());
    
    // Через 24 часа удаляем скин
    setTimeout(() => {
        document.body.classList.remove('secret-skin-active');
        localStorage.removeItem('secretSkin');
        localStorage.removeItem('secretSkinExpires');
    }, 24 * 60 * 60 * 1000);
}

// Сохранить историю призов
function savePrizeHistory(prizeName) {
    const history = JSON.parse(localStorage.getItem('wheelHistory') || '[]');
    history.push({
        prize: prizeName,
        date: new Date().toISOString(),
        nick: nick || 'Аноним'
    });
    
    // Храним только последние 10 призов
    if (history.length > 10) {
        history.shift();
    }
    
    localStorage.setItem('wheelHistory', JSON.stringify(history));
}

// Звуковые эффекты (опционально)
function playWheelSound() {
    // Можно добавить звук появления колеса
    try {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
        audio.volume = 0.3;
        audio.play();
    } catch (e) {
        // Игнорируем ошибки с аудио
    }
}

function playSpinSound() {
    try {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-slot-machine-spin-1080.mp3');
        audio.volume = 0.3;
        audio.play();
    } catch (e) {
        // Игнорируем ошибки с аудио
    }
}

// ========== ИГРОВАЯ ЛОГИКА ==========

// Переключение режимов
document.getElementById("mode").addEventListener("change", function() {
    const mode = this.value;
    document.getElementById("single-settings").classList.toggle("hidden", mode !== "single");
    document.getElementById("multi-settings").classList.toggle("hidden", mode !== "multi");
});

// Одиночная игра
function startSingleGame() {
    nick = document.getElementById("nick").value.trim();
    if (!nick) return alert("Введите ваш ник!");
    
    const count = parseInt(document.getElementById("auto-count").value) || 20;
    qs = getUniqueQuestions(count);
    
    document.getElementById("start").classList.add("hidden");
    document.getElementById("test").classList.remove("hidden");
    document.getElementById("live-results").classList.add("hidden");
    
    startGame();
}

// Создание комнаты
async function createRoom() {
    nick = document.getElementById("nick").value.trim();
    if (!nick) return alert("Введите ваш ник!");
    
    showLoader(true);
    
    try {
        roomId = generateRoomCode();
        isCreator = true;
        
        const questionCount = 20;
        const roomQuestions = getUniqueQuestions(questionCount);
        
        await db.collection("rooms").doc(roomId).set({
            creator: nick,
            players: [{
                nick, 
                ready: false, 
                score: 0, 
                progress: 0,
                joinedAt: new Date().toISOString()
            }],
            status: "waiting",
            questions: roomQuestions,
            questionCount: questionCount,
            gameStarted: false,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        });
        
        showLobby();
        listenToRoom();
        
    } catch (error) {
        console.error("Ошибка создания комнаты:", error);
        alert("Не удалось создать комнату. Проверьте подключение.");
    } finally {
        showLoader(false);
    }
}

// Присоединение к комнате
async function joinRoom() {
    nick = document.getElementById("nick").value.trim();
    if (!nick) return alert("Введите ваш ник!");
    
    roomId = document.getElementById("room-code").value.trim().toUpperCase();
    if (!roomId || roomId.length !== 4) {
        return alert("Введите корректный код комнаты (4 символа)");
    }
    
    showLoader(true);
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        
        if (!roomDoc.exists) {
            throw new Error("Комната не найдена!");
        }
        
        const room = roomDoc.data();
        
        if (room.status !== "waiting") {
            throw new Error("Игра уже началась!");
        }
        
        if (room.players.length >= 8) {
            throw new Error("Комната заполнена (максимум 8 игроков)!");
        }
        
        // Проверяем уникальность ника
        if (room.players.some(p => p.nick === nick)) {
            throw new Error("Игрок с таким ником уже есть в комнате!");
        }
        
        // Добавляем игрока
        const newPlayer = {
            nick, 
            ready: false, 
            score: 0, 
            progress: 0,
            joinedAt: new Date().toISOString()
        };
        
        await roomRef.update({
            players: [...room.players, newPlayer],
            lastActive: new Date().toISOString()
        });
        
        isCreator = false;
        showLobby();
        listenToRoom();
        
    } catch (error) {
        alert(error.message);
    } finally {
        showLoader(false);
    }
}

// Показать лобби
function showLobby() {
    document.getElementById("start").classList.add("hidden");
    document.getElementById("lobby").classList.remove("hidden");
    document.getElementById("room-id-display").textContent = roomId;
    document.getElementById("room-code-display").textContent = roomId;
}

// Слушать изменения комнаты
function listenToRoom() {
    if (roomUnsubscribe) roomUnsubscribe();
    
    roomUnsubscribe = db.collection("rooms").doc(roomId).onSnapshot(
        (doc) => {
            if (!doc.exists) {
                alert("Комната была удалена!");
                location.reload();
                return;
            }
            
            const room = doc.data();
            players = room.players || [];
            
            // Обновляем активность комнаты
            if (room.status === "waiting") {
                db.collection("rooms").doc(roomId).update({
                    lastActive: new Date().toISOString()
                });
            }
            
            // Обновить список игроков
            updatePlayersList(room);
            
            // Обновить кнопки
            updateLobbyControls(room);
            
            // Если игра началась
            if (room.status === "started" && !room.gameStarted) {
                startCountdown();
            }
            
            // Если игра активна
            if (room.gameStarted && !gameStarted) {
                startMultiplayerGame(room);
            }
            
            // Если игра завершена
            if (room.status === "finished" && gameStarted) {
                showFinalResults(room);
            }
        },
        (error) => {
            console.error("Ошибка подписки на комнату:", error);
            alert("Ошибка подключения к комнате");
        }
    );
}

// Обновить список игроков
function updatePlayersList(room) {
    const playersList = document.getElementById("players-list");
    const playersCount = document.getElementById("players-count");
    
    playersCount.textContent = players.length;
    
    let html = "";
    players.forEach(player => {
        let playerClass = "player-card";
        if (player.ready) playerClass += " ready";
        if (player.nick === room.creator) playerClass += " creator";
        
        html += `
            <div class="${playerClass}">
                <strong>${player.nick}</strong>
                ${player.nick === room.creator ? "👑" : ""}
                <div>${player.ready ? "✅ Готов" : "⏳ Ожидает"}</div>
                ${player.score > 0 ? `<div>🏆 ${player.score}</div>` : ''}
            </div>
        `;
    });
    
    playersList.innerHTML = html;
}

// Обновить кнопки лобби
function updateLobbyControls(room) {
    const readyBtn = document.getElementById("ready-btn");
    const startBtn = document.getElementById("start-btn");
    
    // Найти текущего игрока
    const currentPlayer = players.find(p => p.nick === nick);
    isReady = currentPlayer ? currentPlayer.ready : false;
    
    // Кнопка готовности
    if (currentPlayer) {
        readyBtn.textContent = isReady ? "❌ Не готов" : "✅ Я готов";
        readyBtn.className = isReady ? "danger" : "success";
    }
    
    // Кнопка начала игры (только для создателя)
    if (isCreator) {
        const allReady = players.length > 0 && players.every(p => p.ready);
        startBtn.classList.toggle("hidden", !allReady || players.length < 1);
        startBtn.disabled = !allReady;
    } else {
        startBtn.classList.add("hidden");
    }
}

// Переключить готовность
async function toggleReady() {
    if (!roomId || !nick) return;
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        const room = roomDoc.data();
        
        // Найти игрока и обновить готовность
        const updatedPlayers = room.players.map(p => {
            if (p.nick === nick) {
                return {...p, ready: !p.ready};
            }
            return p;
        });
        
        await roomRef.update({ 
            players: updatedPlayers,
            lastActive: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("Ошибка обновления готовности:", error);
    }
}

// Обратный отсчет
function startCountdown() {
    const countdownEl = document.getElementById("countdown");
    countdownEl.classList.remove("hidden");
    
    let count = 3;
    countdownEl.textContent = count;
    
    const countdownInterval = setInterval(() => {
        count--;
        countdownEl.textContent = count;
        
        if (count <= 0) {
            clearInterval(countdownInterval);
            countdownEl.classList.add("hidden");
        }
    }, 1000);
}

// Начать игру в комнате
async function startRoomGame() {
    if (!isCreator || !roomId) return;
    
    try {
        const questionCount = 20;
        const selectedQuestions = getUniqueQuestions(questionCount);
        
        await db.collection("rooms").doc(roomId).update({
            status: "started",
            startTime: new Date().toISOString(),
            questions: selectedQuestions,
            questionCount: questionCount
        });
        
        // Ждем 3 секунды и начинаем игру
        setTimeout(async () => {
            await db.collection("rooms").doc(roomId).update({
                gameStarted: true
            });
        }, 3000);
        
    } catch (error) {
        console.error("Ошибка начала игры:", error);
        alert("Не удалось начать игру");
    }
}

// Начать мультиплеерную игру
function startMultiplayerGame(room) {
    gameStarted = true;
    
    // Все получают одинаковые вопросы
    qs = room.questions || getUniqueQuestions(room.questionCount || 20);
    
    document.getElementById("lobby").classList.add("hidden");
    document.getElementById("test").classList.remove("hidden");
    document.getElementById("live-results").classList.remove("hidden");
    
    startGame();
    listenToProgress();
}

// Слушать прогресс других игроков
function listenToProgress() {
    if (progressUnsubscribe) progressUnsubscribe();
    
    progressUnsubscribe = db.collection("rooms").doc(roomId).onSnapshot((doc) => {
        if (!doc.exists) return;
        
        const room = doc.data();
        const resultsContent = document.getElementById("live-results-content");
        
        // Сортируем по очкам
        const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
        
        let html = "";
        sortedPlayers.forEach((player, index) => {
            const place = index + 1;
            const progress = player.progress || 0;
            const total = room.questionCount || 20;
            const percent = total > 0 ? Math.round((progress / total) * 100) : 0;
            
            html += `
                <div class="result-row">
                    <div>
                        <strong>${place}. ${player.nick}</strong>
                        ${player.nick === room.creator ? "👑" : ""}
                    </div>
                    <div>
                        <strong>${player.score}</strong> очков
                    </div>
                    <div>
                        ${progress}/${total} (${percent}%)
                    </div>
                </div>
            `;
        });
        
        resultsContent.innerHTML = html;
    });
}

// Обновить прогресс игрока
async function updatePlayerProgress() {
    if (!roomId || !nick) return;
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        const room = roomDoc.data();
        
        // Обновляем только текущего игрока
        const updatedPlayers = room.players.map(p => {
            if (p.nick === nick) {
                return {
                    ...p,
                    score: score,
                    progress: i,
                    lastUpdate: new Date().toISOString()
                };
            }
            return p;
        });
        
        await roomRef.update({ 
            players: updatedPlayers,
            lastActive: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("Ошибка обновления прогресса:", error);
    }
}

// Начать игровой процесс
function startGame() {
    i = 0;
    score = 0;
    userAnswers = [];
    startTime = new Date();
    showQuestion();
    updateProgress();
    
    // Применяем бонусные очки если есть
    applyBonuses();
}

// Применить бонусы
function applyBonuses() {
    // Бонусные очки из колеса фортуны
    const bonusPoints = parseInt(localStorage.getItem('bonusPoints') || '0');
    if (bonusPoints > 0) {
        score += bonusPoints;
        localStorage.removeItem('bonusPoints');
        showNotification(`➕ Получено ${bonusPoints} бонусных очков!`);
    }
}

// Показать вопрос
function showQuestion() {
    if (i >= qs.length) {
        finishGame();
        return;
    }
    
    // Проверяем, нужно ли пропустить вопрос
    const skipQuestion = localStorage.getItem('skipQuestion');
    if (skipQuestion === '1') {
        if (confirm("Использовать пропуск вопроса?")) {
            localStorage.removeItem('skipQuestion');
            i++;
            showQuestion();
            updateProgress();
            return;
        }
    }
    
    const q = qs[i];
    elapsedQ = 0;
    
    document.getElementById("q").textContent = q.q;
    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";
    
    // Таймер
    clearInterval(questionTimer);
    document.getElementById("timer").textContent = "Время: 0 сек";
    
    // Учитываем турбо-режим
    const timeMultiplier = localStorage.getItem('turboMode') === 'true' ? 2 : 1;
    
    questionTimer = setInterval(() => {
        elapsedQ++;
        document.getElementById("timer").textContent = `Время: ${elapsedQ} сек`;
    }, 1000 / timeMultiplier);
    
    // Варианты ответов
    q.a.forEach((answer, index) => {
        const label = document.createElement("label");
        label.className = "option";
        label.innerHTML = `<input type="radio" name="opt" value="${index}"> ${answer}`;
        
        label.onclick = () => {
            clearInterval(questionTimer);
            Array.from(document.querySelectorAll(".option")).forEach(o => o.onclick = null);
            
            // Подсчет очков
            let points = 100 - Math.floor(elapsedQ / 5) * 5;
            if (points < 0) points = 0;
            
            // Удвоение очков
            if (localStorage.getItem('doublePoints') === 'true') {
                points *= 2;
                localStorage.removeItem('doublePoints');
            }
            
            const isCorrect = index === q.c;
            
            // Проверяем бессмертие
            const immortality = localStorage.getItem('immortality');
            if (immortality && !isCorrect) {
                const remaining = parseInt(immortality) - 1;
                if (remaining > 0) {
                    localStorage.setItem('immortality', remaining.toString());
                    showNotification(`🛡️ Бессмертие: осталось ${remaining} ошибок`);
                    points = 0; // Не даем очки за ошибку
                } else {
                    localStorage.removeItem('immortality');
                }
            }
            
            if (isCorrect) {
                label.classList.add("correct");
                score += points;
            } else {
                label.classList.add("wrong");
                document.querySelector(`.option input[value="${q.c}"]`).parentElement.classList.add("correct");
            }
            
            // Сохраняем ответ
            userAnswers.push({
                question: q.q,
                userAnswer: answer,
                correctAnswer: q.a[q.c],
                isCorrect: isCorrect,
                explanation: q.exp,
                time: elapsedQ,
                points: isCorrect ? points : 0
            });
            
            // Обновляем прогресс в мультиплеере
            if (roomId) {
                updatePlayerProgress();
            }
            
            // Следующий вопрос
            setTimeout(() => {
                i++;
                showQuestion();
                updateProgress();
            }, 700);
        };
        
        optionsDiv.appendChild(label);
    });
}

// Обновить прогресс-бар
function updateProgress() {
    const p = Math.round((i / qs.length) * 100);
    document.getElementById("prog").style.width = p + "%";
}

// Завершить игру
function finishGame() {
    clearInterval(questionTimer);
    
    const endTime = new Date();
    const elapsedSec = Math.round((endTime - startTime) / 1000);
    
    document.getElementById("test").classList.add("hidden");
    document.getElementById("end").classList.remove("hidden");
    
    if (roomId) {
        document.getElementById("return-btn").classList.remove("hidden");
        showMultiplayerResults(elapsedSec);
    } else {
        document.getElementById("return-btn").classList.add("hidden");
        showSingleResults(elapsedSec);
    }
}

// Показать результаты одиночной игры
function showSingleResults(elapsedSec) {
    const min = Math.floor(elapsedSec / 60);
    const sec = elapsedSec % 60;
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = qs.length > 0 ? Math.round((correctAnswers / qs.length) * 100) : 0;
    
    document.getElementById("res").textContent = 
        `${nick}, ваш результат: ${score} очков\n` +
        `Правильных ответов: ${correctAnswers} из ${qs.length} (${accuracy}%)\n` +
        `Время: ${min} мин ${sec} сек`;
    
    // Сохраняем в Firebase
    db.collection("scores").add({
        nick: nick,
        score: score,
        correctAnswers: correctAnswers,
        totalQuestions: qs.length,
        accuracy: accuracy,
        time: elapsedSec,
        mode: "single",
        date: new Date().toISOString()
    }).then(() => {
        updateLeaderboard();
    });
    
    // Показываем детальные результаты
    showDetailedResults();
}

// Показать результаты мультиплеера
async function showMultiplayerResults(elapsedSec) {
    const roomRef = db.collection("rooms").doc(roomId);
    const roomDoc = await roomRef.get();
    const room = roomDoc.data();
    
    // Обновляем финальный счет
    const updatedPlayers = room.players.map(p => {
        if (p.nick === nick) {
            return {
                ...p, 
                score: score, 
                finished: true, 
                finishTime: new Date().toISOString(),
                totalTime: elapsedSec
            };
        }
        return p;
    });
    
    await roomRef.update({ 
        players: updatedPlayers,
        lastActive: new Date().toISOString()
    });
    
    // Показываем результаты
    const sortedPlayers = [...updatedPlayers].sort((a, b) => b.score - a.score);
    const playerIndex = sortedPlayers.findIndex(p => p.nick === nick);
    const playerPlace = playerIndex + 1;
    const isWinner = playerPlace === 1;
    
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = qs.length > 0 ? Math.round((correctAnswers / qs.length) * 100) : 0;
    
    document.getElementById("res").textContent = 
        `${nick}, ваш результат: ${score} очков\n` +
        `Место: ${playerPlace} из ${sortedPlayers.length}\n` +
        `Правильных ответов: ${correctAnswers} из ${qs.length} (${accuracy}%)`;
    
    if (isWinner) {
        document.getElementById("winner").classList.remove("hidden");
    }
    
    // Таблица результатов
    let html = "";
    sortedPlayers.forEach((player, index) => {
        const place = index + 1;
        const totalQuestions = room.questionCount || 20;
        const progress = player.progress || 0;
        const accuracy = progress > 0 ? Math.round((player.score / (progress * 100)) * 100) || 0 : 0;
        const finishTime = player.finishTime ? "Завершил" : "В процессе";
        
        html += `
            <tr>
                <td>${place} ${place === 1 ? "🏆" : place === 2 ? "🥈" : place === 3 ? "🥉" : ""}</td>
                <td>${player.nick} ${player.nick === room.creator ? "👑" : ""}</td>
                <td><strong>${player.score}</strong></td>
                <td>${finishTime}</td>
                <td>${accuracy}%</td>
            </tr>
        `;
    });
    
    document.getElementById("final-results").innerHTML = html;
    
    // Показываем детальные результаты
    showDetailedResults();
}

// Показать детальные результаты
function showDetailedResults() {
    if (detailedResultsShown) return;
    
    const detailedResultsEl = document.getElementById("detailed-results");
    const answersListEl = document.getElementById("answers-list");
    
    detailedResultsEl.classList.remove("hidden");
    
    let html = "";
    let correctCount = 0;
    
    userAnswers.forEach((answer, index) => {
        const questionNumber = index + 1;
        const resultClass = answer.isCorrect ? "correct" : "wrong";
        const icon = answer.isCorrect ? "✅" : "❌";
        
        if (answer.isCorrect) correctCount++;
        
        html += `
            <div class="question-result ${resultClass}">
                <div><strong>${icon} Вопрос ${questionNumber}:</strong> ${answer.question}</div>
                <div><strong>Ваш ответ:</strong> ${answer.userAnswer}</div>
                <div><strong>Правильный ответ:</strong> ${answer.correctAnswer}</div>
                <div><strong>Объяснение:</strong> ${answer.explanation}</div>
                <div><strong>Время:</strong> ${answer.time} сек <strong>Очки:</strong> ${answer.points}</div>
            </div>
        `;
    });
    
    // Добавляем статистику
    const accuracy = qs.length > 0 ? Math.round((correctCount / qs.length) * 100) : 0;
    const totalTime = userAnswers.reduce((sum, answer) => sum + answer.time, 0);
    const avgTime = userAnswers.length > 0 ? Math.round(totalTime / userAnswers.length) : 0;
    
    html = `
        <div style="margin-bottom: 20px; padding: 15px; background: #e9ecef; border-radius: 8px;">
            <h4>📈 Статистика:</h4>
            <p>Правильных ответов: ${correctCount} из ${qs.length} (${accuracy}%)</p>
            <p>Общее время: ${totalTime} сек, Среднее время: ${avgTime} сек</p>
            <p>Общий счет: ${score} очков</p>
        </div>
    ` + html;
    
    answersListEl.innerHTML = html;
    detailedResultsShown = true;
    
    // Меняем текст кнопки
    const detailsBtn = document.getElementById("details-btn");
    detailsBtn.textContent = "📊 Детальные результаты";
    detailsBtn.onclick = () => {
        detailedResultsEl.classList.toggle("hidden");
    };
}

// Вернуться в лобби
async function returnToLobby() {
    if (!roomId) return;
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        
        if (roomDoc.exists) {
            const room = roomDoc.data();
            
            // Обновляем статус игрока
            const updatedPlayers = room.players.map(p => {
                if (p.nick === nick) {
                    return {
                        ...p,
                        ready: false,
                        score: 0,
                        progress: 0,
                        finished: false
                    };
                }
                return p;
            });
            
            await roomRef.update({
                players: updatedPlayers,
                status: "waiting",
                gameStarted: false,
                lastActive: new Date().toISOString()
            });
        }
        
        // Отписываемся от слушателей
        if (progressUnsubscribe) {
            progressUnsubscribe();
            progressUnsubscribe = null;
        }
        
        // Сбрасываем состояние
        gameStarted = false;
        i = 0;
        score = 0;
        userAnswers = [];
        detailedResultsShown = false;
        
        // Показываем лобби
        document.getElementById("end").classList.add("hidden");
        document.getElementById("detailed-results").classList.add("hidden");
        showLobby();
        
    } catch (error) {
        console.error("Ошибка возврата в лобби:", error);
        alert("Ошибка возврата в лобби");
    }
}

// Покинуть комнату
async function leaveRoom() {
    if (!roomId || !nick) return;
    
    isPageUnloading = true;
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        
        if (roomDoc.exists) {
            const room = roomDoc.data();
            
            // Удаляем только текущего игрока
            const updatedPlayers = room.players.filter(p => p.nick !== nick);
            
            if (updatedPlayers.length === 0) {
                await roomRef.delete();
            } else {
                await roomRef.update({ 
                    players: updatedPlayers,
                    lastActive: new Date().toISOString()
                });
                
                // Если создатель вышел, назначаем нового
                if (room.creator === nick && updatedPlayers.length > 0) {
                    await roomRef.update({ 
                        creator: updatedPlayers[0].nick 
                    });
                }
            }
        }
    } catch (error) {
        console.error("Ошибка при выходе:", error);
    }
    
    // Отписываемся от слушателей
    if (roomUnsubscribe) roomUnsubscribe();
    if (progressUnsubscribe) progressUnsubscribe();
    
    location.reload();
}

// Копировать код комнаты
function copyRoomCode() {
    const code = document.getElementById('room-code-display').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Код комнаты скопирован: ' + code);
    });
}

// Таблица лидеров
function updateLeaderboard() {
    const topEl = document.createElement('div');
    topEl.id = 'top';
    topEl.style.marginTop = '20px';
    
    db.collection("scores")
        .orderBy("score", "desc")
        .orderBy("time", "asc")
        .limit(10)
        .onSnapshot(snapshot => {
            if (!snapshot.empty) {
                let html = '<h3>🏆 Таблица лидеров:</h3><table><tr><th>Игрок</th><th>Очки</th><th>Время</th></tr>';
                snapshot.forEach((doc, index) => {
                    const x = doc.data();
                    const tMin = Math.floor((x.time || 0) / 60);
                    const tSec = (x.time || 0) % 60;
                    html += `
                        <tr>
                            <td>${x.nick}</td>
                            <td><strong>${x.score}</strong></td>
                            <td>${tMin}м ${tSec}с</td>
                        </tr>
                    `;
                });
                html += '</table>';
                topEl.innerHTML = html;
                
                // Добавляем на страницу если еще нет
                if (!document.getElementById('top')) {
                    document.querySelector('.container').appendChild(topEl);
                }
            }
        });
}

// Очистка старых комнат
setInterval(async () => {
    try {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const oldRooms = await db.collection("rooms")
            .where("lastActive", "<", hourAgo)
            .get();
        
        oldRooms.forEach(doc => {
            doc.ref.delete();
        });
    } catch (error) {
        console.error("Ошибка очистки комнат:", error);
    }
}, 30 * 60 * 1000);

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', function() {
    // Проверка подключения к Firebase
    db.enableNetwork().then(() => {
        updateConnectionStatus(true);
    }).catch(error => {
        updateConnectionStatus(false);
        console.error("Нет подключения к Firebase:", error);
    });
    
    // Обработчик закрытия страницы
    window.addEventListener('beforeunload', function(e) {
        if (!isPageUnloading && (gameStarted || roomId)) {
            e.preventDefault();
            e.returnValue = 'Вы находитесь в игре. Вы уверены, что хотите уйти?';
            leaveRoom();
        }
    });
    
    // Слушатель состояния подключения Firebase
    firebase.firestore().onSnapshotsInSync(() => {
        updateConnectionStatus(true);
    });
    
    // Проверка секретного скина
    const secretSkinExpires = localStorage.getItem('secretSkinExpires');
    if (secretSkinExpires && new Date(secretSkinExpires) > new Date()) {
        document.body.classList.add('secret-skin-active');
    } else {
        localStorage.removeItem('secretSkin');
        localStorage.removeItem('secretSkinExpires');
    }
    
    // Проверка рамки эксперта
    const expertFrameExpires = localStorage.getItem('expertFrame');
    if (expertFrameExpires && new Date(expertFrameExpires) > new Date()) {
        // Можно добавить визуальный эффект для эксперта
        console.log("Эксперт активен до:", expertFrameExpires);
    } else {
        localStorage.removeItem('expertFrame');
    }
    
    // Добавляем проверку на секретное слово в поле ника
    const nickInput = document.getElementById('nick');
    if (nickInput) {
        nickInput.addEventListener('input', function() {
            if (checkForSecretWord(this.value) && !wheelActivated) {
                // Небольшая задержка для сюрприза
                setTimeout(() => {
                    activateWheel();
                }, 500);
            }
        });
    }
    
    // Загружаем таблицу лидеров
    updateLeaderboard();
});
