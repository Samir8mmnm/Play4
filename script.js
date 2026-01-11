// ========== КОНФИГУРАЦИЯ FIREBASE ==========
// РАБОЧАЯ КОНФИГУРАЦИЯ - ПРОЕКТ НАСТРОЕН ПРАВИЛЬНО
const firebaseConfig = {
    apiKey: "AIzaSyDeVrBxpeosfFQGfxEdrKkR2GTwoKj_eAI",


  authDomain: "math-battle-game-d9608.firebaseapp.com",

  databaseURL: "https://math-battle-game-d9608-default-rtdb.europe-west1.firebasedatabase.app",

  projectId: "math-battle-game-d9608",

  storageBucket: "math-battle-game-d9608.firebasestorage.app",

  messagingSenderId: "88861902806",

  appId: "1:88861902806:web:d9f134d18977d286dfc677",

  measurementId: "G-ZG1F8YVB4K"
};

// Инициализация Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase успешно инициализирован");
} catch (error) {
    console.error("❌ Ошибка инициализации Firebase:", error);
    alert("Ошибка подключения к серверу. Игра будет работать в локальном режиме.");
}

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

// ========== ОТЛАДКА ==========
function debugLog(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage, data || '');
    
    // Добавляем в отладочную панель
    const debugContent = document.getElementById('debug-content');
    if (debugContent) {
        const div = document.createElement('div');
        div.style.cssText = 'margin: 2px 0; padding: 2px; border-bottom: 1px solid rgba(0,255,0,0.1);';
        div.innerHTML = `<span style="color:#0f0">${logMessage}</span>`;
        if (data) {
            div.innerHTML += `<pre style="color:#ff0; margin:2px 0 2px 10px; font-size:10px;">${JSON.stringify(data, null, 2)}</pre>`;
        }
        debugContent.appendChild(div);
        debugContent.scrollTop = debugContent.scrollHeight;
        
        // Ограничиваем количество сообщений
        const children = debugContent.children;
        if (children.length > 50) {
            debugContent.removeChild(children[0]);
        }
    }
}

function showDebugInfo() {
    document.getElementById('debug-panel').classList.remove('hidden');
    debugLog("Отладочная панель открыта");
}

function toggleDebug() {
    const panel = document.getElementById('debug-panel');
    panel.classList.toggle('hidden');
}

function clearDebug() {
    document.getElementById('debug-content').innerHTML = '';
}

// ========== ТЕСТ FIREBASE ==========
async function testFirebase() {
    debugLog("🔍 Тестируем Firebase подключение...");
    
    try {
        // Тест 1: Проверка инициализации
        const isInitialized = firebase.apps.length > 0;
        debugLog("Firebase инициализирован:", isInitialized);
        
        if (!isInitialized) {
            alert("Firebase не инициализирован. Обновите страницу.");
            return;
        }
        
        // Тест 2: Проверка сети
        await db.enableNetwork();
        debugLog("Сеть Firebase включена");
        
        // Тест 3: Запись в Firestore
        const testRef = db.collection('test_connection').doc('test_doc');
        const testData = {
            test: "connection_test",
            timestamp: new Date().toISOString(),
            browser: navigator.userAgent.substring(0, 50)
        };
        
        await testRef.set(testData);
        debugLog("✅ Запись в Firestore успешна", testData);
        
        // Тест 4: Чтение из Firestore
        const doc = await testRef.get();
        if (doc.exists) {
            debugLog("✅ Чтение из Firestore успешно", doc.data());
            alert("✅ Firebase работает отлично!\n\nВсе тесты пройдены успешно.");
        } else {
            debugLog("⚠️ Документ не найден после записи");
            alert("⚠️ Firebase работает, но есть проблемы с чтением данных.");
        }
        
        // Тест 5: Удаление тестового документа
        await testRef.delete();
        debugLog("✅ Тестовый документ удален");
        
    } catch (error) {
        debugLog("❌ Ошибка теста Firebase:", error);
        
        let errorMessage = "Ошибка Firebase: ";
        switch (error.code) {
            case 'permission-denied':
                errorMessage += "Нет разрешений. Нужно настроить правила Firestore.";
                break;
            case 'failed-precondition':
                errorMessage += "База данных не активирована. Включите Firestore в консоли Firebase.";
                break;
            case 'unavailable':
                errorMessage += "Сервер недоступен. Проверьте интернет соединение.";
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage + "\n\nСоздайте проект на console.firebase.google.com");
    }
}

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getUniqueQuestions(count) {
    const shuffled = shuffleArray([...autoQ]);
    return shuffled.slice(0, Math.min(count, autoQ.length));
}

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function showLoader(show) {
    document.getElementById('loader').classList.toggle('hidden', !show);
}

function updateConnectionStatus(connected) {
    const el = document.getElementById('connection-status');
    if (connected) {
        el.innerHTML = '<span class="status-online">✅ Подключено к серверу</span>';
        el.classList.remove('hidden');
    } else {
        el.innerHTML = '<span class="status-offline">❌ Нет подключения. Работает в локальном режиме.</span>';
        el.classList.remove('hidden');
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log("🎮 Математическая битва загружается...");
    
    // Проверяем Firebase подключение
    checkFirebaseConnection();
    
    // Настраиваем переключение режимов
    document.getElementById("mode").addEventListener("change", function() {
        const mode = this.value;
        document.getElementById("single-settings").classList.toggle("hidden", mode !== "single");
        document.getElementById("multi-settings").classList.toggle("hidden", mode !== "multi");
    });
    
    // Автоматически заполняем ник
    const savedNick = localStorage.getItem('mathBattleNick') || 'Игрок' + Math.floor(Math.random() * 1000);
    document.getElementById('nick').value = savedNick;
    
    // Сохраняем ник при изменении
    document.getElementById('nick').addEventListener('input', function() {
        localStorage.setItem('mathBattleNick', this.value);
    });
    
    // Показываем отладочную информацию
    debugLog("Приложение загружено");
});

async function checkFirebaseConnection() {
    try {
        await db.enableNetwork();
        
        // Пробуем прочитать что-то из Firestore
        const testRef = db.collection('rooms').limit(1);
        await testRef.get();
        
        updateConnectionStatus(true);
        debugLog("Firebase подключен успешно");
        
        // Слушаем изменения в сети
        firebase.firestore().onSnapshotsInSync(() => {
            updateConnectionStatus(true);
        });
        
    } catch (error) {
        updateConnectionStatus(false);
        debugLog("Firebase не подключен:", error.message);
    }
}

// ========== ОДИНОЧНАЯ ИГРА ==========
function startSingleGame() {
    nick = document.getElementById("nick").value.trim();
    if (!nick) {
        alert("Введите ваш ник!");
        return;
    }
    
    const count = parseInt(document.getElementById("auto-count").value) || 10;
    if (count < 1 || count > 50) {
        alert("Выберите от 1 до 50 вопросов!");
        return;
    }
    
    qs = getUniqueQuestions(count);
    
    document.getElementById("start").classList.add("hidden");
    document.getElementById("test").classList.remove("hidden");
    document.getElementById("live-results").classList.add("hidden");
    
    startGame();
    debugLog("Одиночная игра начата", { questions: qs.length, nick });
}

// ========== МУЛЬТИПЛЕЕР ==========
async function createRoom() {
    nick = document.getElementById("nick").value.trim();
    if (!nick) {
        alert("Введите ваш ник!");
        return;
    }
    
    showLoader(true);
    debugLog("Создание комнаты...");
    
    try {
        // Генерируем уникальный код комнаты
        roomId = generateRoomCode();
        isCreator = true;
        
        debugLog("Генерируем код комнаты:", roomId);
        
        // Подготавливаем вопросы
        const questionCount = 20;
        const roomQuestions = getUniqueQuestions(questionCount);
        
        // Создаем комнату в Firebase
        await db.collection("rooms").doc(roomId).set({
            creator: nick,
            players: [{
                nick: nick,
                ready: true,  // Создатель сразу готов
                score: 0,
                progress: 0,
                joinedAt: new Date().toISOString(),
                lastUpdate: new Date().toISOString()
            }],
            status: "waiting",
            questions: roomQuestions,
            questionCount: questionCount,
            gameStarted: false,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            version: "2.0"
        });
        
        debugLog("✅ Комната создана успешно!", { roomId, nick });
        
        // Показываем лобби
        showLobby();
        
        // Начинаем слушать изменения комнаты
        listenToRoom();
        
        // Обновляем ссылку для шаринга
        updateShareLink();
        
    } catch (error) {
        console.error("❌ Ошибка создания комнаты:", error);
        debugLog("Ошибка создания комнаты:", error);
        
        // Пробуем локальное создание
        if (error.code === 'permission-denied' || error.code === 'unavailable') {
            alert("Firebase недоступен. Создаю локальную комнату...");
            createLocalRoom();
        } else {
            alert("Не удалось создать комнату. Ошибка: " + error.message);
        }
    } finally {
        showLoader(false);
    }
}

function createLocalRoom() {
    nick = document.getElementById("nick").value.trim();
    roomId = generateRoomCode();
    isCreator = true;
    
    // Локальная комната (без Firebase)
    players = [{
        nick: nick,
        ready: true,
        score: 0,
        progress: 0
    }];
    
    showLobby();
    
    // Добавляем тестовых игроков для демонстрации
    setTimeout(() => {
        players.push({
            nick: "ТестИгрок1",
            ready: true,
            score: 0,
            progress: 0
        });
        
        players.push({
            nick: "ТестИгрок2",
            ready: false,
            score: 0,
            progress: 0
        });
        
        updatePlayersList({
            players: players,
            creator: nick
        });
    }, 1000);
    
    debugLog("Локальная комната создана", { roomId, players });
    alert(`✅ Локальная комната создана!\nКод: ${roomId}\n\nFirebase недоступен. Игра работает в локальном режиме.`);
}

async function joinRoom() {
    nick = document.getElementById("nick").value.trim();
    if (!nick) {
        alert("Введите ваш ник!");
        return;
    }
    
    roomId = document.getElementById("room-code").value.trim().toUpperCase();
    if (!roomId || roomId.length !== 4) {
        alert("Введите корректный код комнаты (4 символа)");
        return;
    }
    
    showLoader(true);
    debugLog("Присоединение к комнате:", roomId);
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        
        if (!roomDoc.exists) {
            throw new Error("Комната не найдена! Проверьте код.");
        }
        
        const room = roomDoc.data();
        
        if (room.status !== "waiting") {
            throw new Error("Игра уже началась или завершена!");
        }
        
        if (room.players.length >= 8) {
            throw new Error("Комната заполнена (максимум 8 игроков)!");
        }
        
        if (room.players.some(p => p.nick === nick)) {
            throw new Error("Игрок с таким ником уже есть в комнате!");
        }
        
        // Добавляем игрока
        const newPlayer = {
            nick: nick,
            ready: false,
            score: 0,
            progress: 0,
            joinedAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
        };
        
        await roomRef.update({
            players: [...room.players, newPlayer],
            lastActive: new Date().toISOString()
        });
        
        isCreator = false;
        
        debugLog("✅ Успешно присоединился к комнате", { roomId, nick });
        
        showLobby();
        listenToRoom();
        
    } catch (error) {
        console.error("❌ Ошибка присоединения:", error);
        debugLog("Ошибка присоединения:", error);
        alert("Ошибка: " + error.message);
    } finally {
        showLoader(false);
    }
}

function showLobby() {
    document.getElementById("start").classList.add("hidden");
    document.getElementById("lobby").classList.remove("hidden");
    
    document.getElementById("room-id-display").textContent = roomId;
    document.getElementById("room-code-display").textContent = roomId;
    
    debugLog("Лобби показано", { roomId, isCreator });
}

function updateShareLink() {
    const currentUrl = window.location.href.split('?')[0];
    const shareUrl = `${currentUrl}?room=${roomId}`;
    document.getElementById('share-link').textContent = shareUrl;
    
    // Копирование при клике
    document.getElementById('share-link').onclick = function() {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Ссылка скопирована в буфер обмена!');
        });
    };
}

function listenToRoom() {
    if (roomUnsubscribe) {
        roomUnsubscribe();
        debugLog("Старая подписка отменена");
    }
    
    debugLog("Начинаю слушать комнату:", roomId);
    
    roomUnsubscribe = db.collection("rooms").doc(roomId).onSnapshot(
        (doc) => {
            if (!doc.exists) {
                debugLog("Комната удалена или не найдена");
                alert("Комната была удалена или не найдена!");
                location.reload();
                return;
            }
            
            const room = doc.data();
            players = room.players || [];
            
            debugLog("Получено обновление комнаты", {
                playersCount: players.length,
                status: room.status,
                gameStarted: room.gameStarted
            });
            
            // Обновляем активность комнаты
            if (room.status === "waiting") {
                db.collection("rooms").doc(roomId).update({
                    lastActive: new Date().toISOString()
                }).catch(e => debugLog("Ошибка обновления активности", e));
            }
            
            // Обновляем интерфейс
            updatePlayersList(room);
            updateLobbyControls(room);
            
            // Если игра началась
            if (room.status === "started" && !room.gameStarted) {
                startCountdown();
            }
            
            // Если игра активна
            if (room.gameStarted && !gameStarted && room.status === "started") {
                debugLog("Запускаем игру для всех игроков");
                startMultiplayerGame(room);
            }
            
            // Если игра завершена
            if (room.status === "finished" && gameStarted) {
                debugLog("Игра завершена, показываем результаты");
                showMultiplayerResults(room);
            }
        },
        (error) => {
            console.error("❌ Ошибка подписки на комнату:", error);
            debugLog("Ошибка подписки на комнату:", error);
            alert("Ошибка подключения к комнате. Попробуйте перезайти.");
        }
    );
}

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
                <div style="margin-top: 8px; font-size: 14px;">
                    ${player.ready ? 
                        '<span style="color: #38a169;">✅ Готов</span>' : 
                        '<span style="color: #718096;">⏳ Ожидает</span>'
                    }
                </div>
                ${player.score > 0 ? `
                    <div style="margin-top: 5px; font-size: 12px; color: #d69e2e;">
                        🏆 ${player.score} очков
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    playersList.innerHTML = html;
    debugLog("Список игроков обновлен", { count: players.length });
}

function updateLobbyControls(room) {
    const readyBtn = document.getElementById("ready-btn");
    const startBtn = document.getElementById("start-btn");
    const forceBtn = document.getElementById("force-start-btn");
    
    // Находим текущего игрока
    const currentPlayer = players.find(p => p.nick === nick);
    isReady = currentPlayer ? currentPlayer.ready : false;
    
    // Обновляем кнопку готовности
    if (currentPlayer) {
        readyBtn.textContent = isReady ? "❌ Не готов" : "✅ Я готов";
        readyBtn.className = isReady ? "danger" : "success";
        readyBtn.disabled = false;
    } else {
        readyBtn.disabled = true;
    }
    
    // Обновляем кнопку начала игры (только для создателя)
    if (isCreator) {
        const allReady = players.length > 1 && players.every(p => p.ready);
        const minPlayers = players.length >= 2;
        
        startBtn.classList.toggle("hidden", !(allReady && minPlayers));
        startBtn.disabled = !(allReady && minPlayers);
        
        // Показываем кнопку принудительного старта если игроков больше 1, но не все готовы
        forceBtn.classList.toggle("hidden", allReady || players.length < 2);
        
        debugLog("Кнопки создателя обновлены", {
            allReady,
            minPlayers,
            playersCount: players.length
        });
    } else {
        startBtn.classList.add("hidden");
        forceBtn.classList.add("hidden");
    }
}

async function toggleReady() {
    if (!roomId || !nick) return;
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        const room = roomDoc.data();
        
        const updatedPlayers = room.players.map(p => {
            if (p.nick === nick) {
                const newReadyStatus = !p.ready;
                debugLog(`${nick} меняет готовность: ${newReadyStatus ? 'готов' : 'не готов'}`);
                return {
                    ...p,
                    ready: newReadyStatus,
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
        console.error("Ошибка изменения готовности:", error);
        debugLog("Ошибка изменения готовности:", error);
        alert("Не удалось изменить статус готовности");
    }
}

function startCountdown() {
    const countdownEl = document.getElementById("countdown");
    countdownEl.classList.remove("hidden");
    
    let count = 3;
    countdownEl.textContent = count;
    debugLog("Обратный отсчет начат", { seconds: count });
    
    const countdownInterval = setInterval(() => {
        count--;
        countdownEl.textContent = count;
        
        if (count <= 0) {
            clearInterval(countdownInterval);
            countdownEl.classList.add("hidden");
            debugLog("Обратный отсчет завершен");
        }
    }, 1000);
}

async function startRoomGame() {
    if (!isCreator || !roomId) {
        alert("Только создатель комнаты может начать игру!");
        return;
    }
    
    debugLog("Создатель начинает игру...");
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        const room = roomDoc.data();
        
        // Проверяем условия начала
        const allReady = players.length >= 2 && players.every(p => p.ready);
        if (!allReady) {
            alert("Не все игроки готовы или недостаточно игроков!");
            return;
        }
        
        const questionCount = 20;
        const selectedQuestions = getUniqueQuestions(questionCount);
        
        debugLog("Начинаем игру", {
            players: players.length,
            questions: questionCount
        });
        
        // Обновляем статус комнаты
        await roomRef.update({
            status: "started",
            startTime: new Date().toISOString(),
            questions: selectedQuestions,
            questionCount: questionCount,
            gameStarted: false,
            lastActive: new Date().toISOString()
        });
        
        // Запускаем обратный отсчет
        startCountdown();
        
        // Через 3 секунды начинаем игру
        setTimeout(async () => {
            await roomRef.update({
                gameStarted: true
            });
            debugLog("Игра официально начата!");
        }, 3000);
        
    } catch (error) {
        console.error("Ошибка начала игры:", error);
        debugLog("Ошибка начала игры:", error);
        alert("Не удалось начать игру: " + error.message);
    }
}

async function forceStartGame() {
    if (!isCreator || !roomId) return;
    
    if (!confirm("Начать игру, даже если не все готовы?\n\nИгроки, которые не готовы, будут автоматически помечены как готовые.")) {
        return;
    }
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        const room = roomDoc.data();
        
        // Делаем всех игроков готовыми
        const updatedPlayers = room.players.map(player => ({
            ...player,
            ready: true,
            lastUpdate: new Date().toISOString()
        }));
        
        const questionCount = 20;
        const selectedQuestions = getUniqueQuestions(questionCount);
        
        debugLog("Принудительный старт игры", {
            players: updatedPlayers.length
        });
        
        // Обновляем комнату
        await roomRef.update({
            players: updatedPlayers,
            status: "started",
            startTime: new Date().toISOString(),
            questions: selectedQuestions,
            questionCount: questionCount,
            gameStarted: false
        });
        
        // Запускаем обратный отсчет
        startCountdown();
        
        // Через 3 секунды начинаем игру
        setTimeout(async () => {
            await roomRef.update({ gameStarted: true });
            debugLog("Игра начата принудительно!");
        }, 3000);
        
    } catch (error) {
        console.error("Ошибка принудительного старта:", error);
        debugLog("Ошибка принудительного старта:", error);
        alert("Не удалось начать игру: " + error.message);
    }
}

function startMultiplayerGame(room) {
    if (gameStarted) return;
    
    gameStarted = true;
    debugLog("Запускаем мультиплеерную игру...");
    
    // Получаем вопросы из комнаты
    qs = room.questions || getUniqueQuestions(room.questionCount || 20);
    
    // Переключаем экраны
    document.getElementById("lobby").classList.add("hidden");
    document.getElementById("test").classList.remove("hidden");
    document.getElementById("live-results").classList.remove("hidden");
    
    // Сбрасываем состояние
    i = 0;
    score = 0;
    userAnswers = [];
    startTime = new Date();
    
    // Запускаем игру
    startGame();
    
    // Начинаем слушать прогресс других игроков
    listenToProgress();
}

function listenToProgress() {
    if (progressUnsubscribe) progressUnsubscribe();
    
    progressUnsubscribe = db.collection("rooms").doc(roomId).onSnapshot((doc) => {
        if (!doc.exists) return;
        
        const room = doc.data();
        const resultsContent = document.getElementById("live-results-content");
        
        // Сортируем игроков по очкам
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

async function updatePlayerProgress() {
    if (!roomId || !nick) return;
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        const room = roomDoc.data();
        
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
        debugLog("Ошибка обновления прогресса:", error);
    }
}

// ========== ИГРОВОЙ ПРОЦЕСС ==========
function startGame() {
    i = 0;
    score = 0;
    userAnswers = [];
    startTime = new Date();
    
    showQuestion();
    updateProgress();
    
    debugLog("Игра начата", { totalQuestions: qs.length });
}

function showQuestion() {
    if (i >= qs.length) {
        finishGame();
        return;
    }
    
    const q = qs[i];
    elapsedQ = 0;
    
    document.getElementById("q").textContent = q.q;
    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";
    
    // Сбрасываем таймер
    clearInterval(questionTimer);
    document.getElementById("timer").textContent = "Время: 0 сек";
    
    // Запускаем новый таймер
    questionTimer = setInterval(() => {
        elapsedQ++;
        document.getElementById("timer").textContent = `Время: ${elapsedQ} сек`;
    }, 1000);
    
    // Создаем варианты ответов
    q.a.forEach((answer, index) => {
        const label = document.createElement("label");
        label.className = "option";
        label.innerHTML = `<input type="radio" name="opt" value="${index}"> ${answer}`;
        
        label.onclick = () => {
            clearInterval(questionTimer);
            
            // Блокируем все варианты
            Array.from(document.querySelectorAll(".option")).forEach(o => o.onclick = null);
            
            // Подсчет очков
            let points = 100 - Math.floor(elapsedQ / 5) * 5;
            if (points < 0) points = 0;
            
            const isCorrect = index === q.c;
            
            if (isCorrect) {
                label.classList.add("correct");
                score += points;
                debugLog(`Правильный ответ! +${points} очков`, { question: i + 1, time: elapsedQ });
            } else {
                label.classList.add("wrong");
                document.querySelector(`.option input[value="${q.c}"]`).parentElement.classList.add("correct");
                debugLog(`Неправильный ответ`, { question: i + 1 });
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
            
            // Следующий вопрос через 1 секунду
            setTimeout(() => {
                i++;
                showQuestion();
                updateProgress();
            }, 1000);
        };
        
        optionsDiv.appendChild(label);
    });
}

function updateProgress() {
    const percent = Math.round((i / qs.length) * 100);
    document.getElementById("prog").style.width = percent + "%";
}

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
    
    debugLog("Игра завершена", {
        score: score,
        time: elapsedSec,
        correctAnswers: userAnswers.filter(a => a.isCorrect).length,
        totalQuestions: qs.length
    });
}

function showSingleResults(elapsedSec) {
    const min = Math.floor(elapsedSec / 60);
    const sec = elapsedSec % 60;
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = qs.length > 0 ? Math.round((correctAnswers / qs.length) * 100) : 0;
    
    document.getElementById("res").innerHTML = `
        <strong>${nick}</strong>, ваш результат: <span style="color:#667eea; font-size:1.2em;">${score}</span> очков<br>
        Правильных ответов: <strong>${correctAnswers} из ${qs.length}</strong> (${accuracy}%)<br>
        Время: ${min} мин ${sec} сек
    `;
    
    // Сохраняем в Firebase если доступен
    if (db) {
        db.collection("scores").add({
            nick: nick,
            score: score,
            correctAnswers: correctAnswers,
            totalQuestions: qs.length,
            accuracy: accuracy,
            time: elapsedSec,
            mode: "single",
            date: new Date().toISOString()
        }).catch(e => debugLog("Не удалось сохранить результат", e));
    }
    
    // Показываем детальные результаты
    showDetailedResults();
}

async function showMultiplayerResults(elapsedSec) {
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        const room = roomDoc.data();
        
        // Обновляем наш финальный счет
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
            lastActive: new Date().toISOString(),
            status: "finished"
        });
        
        // Сортируем игроков по очкам
        const sortedPlayers = [...updatedPlayers].sort((a, b) => b.score - a.score);
        const playerIndex = sortedPlayers.findIndex(p => p.nick === nick);
        const playerPlace = playerIndex + 1;
        const isWinner = playerPlace === 1;
        
        const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
        const accuracy = qs.length > 0 ? Math.round((correctAnswers / qs.length) * 100) : 0;
        
        document.getElementById("res").innerHTML = `
            <strong>${nick}</strong>, ваш результат: <span style="color:#667eea; font-size:1.2em;">${score}</span> очков<br>
            Место: <strong>${playerPlace} из ${sortedPlayers.length}</strong><br>
            Правильных ответов: <strong>${correctAnswers} из ${qs.length}</strong> (${accuracy}%)
        `;
        
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
            const finishTime = player.finished ? "Завершил" : "Не завершил";
            
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
        
        debugLog("Мультиплеерные результаты показаны", {
            place: playerPlace,
            totalPlayers: sortedPlayers.length,
            isWinner: isWinner
        });
        
    } catch (error) {
        console.error("Ошибка показа результатов:", error);
        debugLog("Ошибка показа результатов:", error);
        alert("Не удалось загрузить результаты.");
    }
}

function showDetailedResults() {
    if (detailedResultsShown) return;
    
    detailedResultsShown = true;
    
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
                <div style="margin-top: 5px; font-size: 14px; color: #718096;">
                    <strong>Время:</strong> ${answer.time} сек 
                    <strong>Очки:</strong> ${answer.points}
                </div>
            </div>
        `;
    });
    
    // Добавляем статистику
    const accuracy = qs.length > 0 ? Math.round((correctCount / qs.length) * 100) : 0;
    const totalTime = userAnswers.reduce((sum, answer) => sum + answer.time, 0);
    const avgTime = userAnswers.length > 0 ? Math.round(totalTime / userAnswers.length) : 0;
    
    const statsHtml = `
        <div style="margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; border-left: 5px solid #667eea;">
            <h4 style="margin-top: 0; color: #4a5568;">📈 Статистика игры</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; color: #718096;">Правильных ответов</div>
                    <div style="font-size: 28px; font-weight: 700; color: #48bb78;">${correctCount}/${qs.length}</div>
                    <div style="font-size: 14px; color: #718096;">${accuracy}%</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; color: #718096;">Общее время</div>
                    <div style="font-size: 28px; font-weight: 700; color: #4299e1;">${totalTime} сек</div>
                    <div style="font-size: 14px; color: #718096;">${avgTime} сек/вопрос</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; color: #718096;">Общий счет</div>
                    <div style="font-size: 28px; font-weight: 700; color: #d69e2e;">${score}</div>
                    <div style="font-size: 14px; color: #718096;">очков</div>
                </div>
            </div>
        </div>
    `;
    
    answersListEl.innerHTML = statsHtml + html;
    
    // Обновляем кнопку
    const detailsBtn = document.getElementById("details-btn");
    detailsBtn.textContent = "📊 Скрыть детальные результаты";
    detailsBtn.onclick = () => {
        detailedResultsEl.classList.toggle("hidden");
        detailsBtn.textContent = detailedResultsEl.classList.contains("hidden") 
            ? "📊 Показать детальные результаты" 
            : "📊 Скрыть детальные результаты";
    };
}

// ========== УПРАВЛЕНИЕ КОМНАТОЙ ==========
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
        
        debugLog("Вернулись в лобби");
        
    } catch (error) {
        console.error("Ошибка возврата в лобби:", error);
        debugLog("Ошибка возврата в лобби:", error);
        alert("Не удалось вернуться в лобби");
    }
}

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
                // Если комната пуста, удаляем её
                await roomRef.delete();
                debugLog("Комната удалена (последний игрок вышел)");
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
                    debugLog("Новый создатель комнаты:", updatedPlayers[0].nick);
                }
            }
        }
    } catch (error) {
        console.error("Ошибка при выходе:", error);
        debugLog("Ошибка при выходе:", error);
    }
    
    // Отписываемся от слушателей
    if (roomUnsubscribe) {
        roomUnsubscribe();
        roomUnsubscribe = null;
    }
    
    if (progressUnsubscribe) {
        progressUnsubscribe();
        progressUnsubscribe = null;
    }
    
    location.reload();
}

function copyRoomCode() {
    const code = document.getElementById('room-code-display').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('✅ Код комнаты скопирован: ' + code);
    }).catch(err => {
        alert('❌ Не удалось скопировать код');
    });
}

// ========== КОЛЕСО ФОРТУНЫ ==========
const wheelPrizes = [
    {name:"Удвоение",icon:"💰",color:"#F6E05E",desc:"Следующий результат ×2",effect:()=>{localStorage.setItem('doublePoints','true');showNotification("💰 Удвоение очков активировано!");}},
    {name:"Бессмертие",icon:"🛡️",color:"#48BB78",desc:"3 ошибки не считаются",effect:()=>{localStorage.setItem('immortality','3');showNotification("🛡️ Бессмертие активировано (3 ошибки)!");}},
    {name:"Секретный скин",icon:"🎨",color:"#9F7AEA",desc:"Эксклюзивный дизайн",effect:()=>{activateSecretSkin();showNotification("🎨 Секретный скин активирован!");}},
    {name:"Турбо-режим",icon:"⚡",color:"#ED8936",desc:"+50% времени",effect:()=>{localStorage.setItem('turboMode','true');showNotification("⚡ Турбо-режим активирован!");}},
    {name:"Пропуск",icon:"➡️",color:"#4299E1",desc:"Пропустить 1 вопрос",effect:()=>{localStorage.setItem('skipQuestion','1');showNotification("➡️ Пропуск вопроса активирован!");}},
    {name:"Бонус+500",icon:"➕",color:"#F56565",desc:"+500 очков",effect:()=>{const bp=(parseInt(localStorage.getItem('bonusPoints')||'0')+500);localStorage.setItem('bonusPoints',bp);showNotification(`➕ +${bp} бонусных очков!`);}},
    {name:"Эксперт",icon:"👑",color:"#D69E2E",desc:"Золотая рамка",effect:()=>{localStorage.setItem('expertFrame',new Date(Date.now()+86400000).toISOString());showNotification("👑 Статус Эксперт активирован!");}},
    {name:"Сюрприз",icon:"🎁",color:"#38B2AC",desc:"Случайный приз",effect:function(){const p=wheelPrizes.filter(x=>x.name!=="Сюрприз");const rp=p[Math.floor(Math.random()*p.length)];rp.effect();return rp;}}
];

function checkForSecretWord(text) {
    const words=['эпштейн','epstein','эпштей','epshtein','фортуна','wheel','колесо','секрет'];
    const lower=text.toLowerCase();
    return words.some(word=>lower.includes(word));
}

function activateWheel(){
    if(wheelActivated)return;
    wheelActivated=true;
    document.getElementById('wheel-container').classList.remove('hidden');
    createWheel();
    debugLog("Колесо фортуны активировано");
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
        section.style.background=`linear-gradient(135deg,${prize.color},${darkenColor(prize.color,20)})`;
        if(index%2===0)section.style.filter='brightness(0.9)';
        section.style.border='2px solid rgba(255,255,255,0.4)';
        wheel.appendChild(section);
    });
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
    debugLog("Выигран приз колеса фортуны", { prize: actualPrize.name });
}

function closeResult(){
    document.getElementById('result-modal').classList.add('hidden');
    document.getElementById('wheel-container').classList.add('hidden');
    setTimeout(()=>{wheelActivated=false;},86400000);
}

function createConfetti(){
    const colors=['#F6E05E','#48BB78','#4299E1','#ED8936','#9F7AEA','#F56565'];
    for(let i=0;i<150;i++){
        const confetti=document.createElement('div');
        confetti.style.cssText=`position:fixed;width:12px;height:12px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>0.5?'50%':'0'};left:${Math.random()*100}vw;top:-20px;z-index:99999;pointer-events:none;`;
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

function showNotification(text){
    const notification=document.createElement('div');
    notification.textContent=text;
    notification.style.cssText='position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#48BB78,#38A169);color:white;padding:15px 25px;border-radius:12px;z-index:9999;box-shadow:0 10px 30px rgba(72,187,120,0.3);font-weight:600;font-size:16px;max-width:400px;animation:slideIn 0.3s;';
    document.body.appendChild(notification);
    setTimeout(()=>notification.remove(),3000);
}

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

// ========== ОБРАБОТЧИК СЕКРЕТНОГО СЛОВА ==========
document.getElementById('nick').addEventListener('input', function() {
    if (checkForSecretWord(this.value) && !wheelActivated) {
        setTimeout(() => {
            activateWheel();
        }, 500);
    }
});

// ========== УДАЛЕНИЕ СТАРЫХ КОМНАТ ==========
setInterval(async () => {
    try {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const oldRooms = await db.collection("rooms")
            .where("lastActive", "<", hourAgo)
            .get();
        
        oldRooms.forEach(doc => {
            doc.ref.delete();
            debugLog("Удалена старая комната:", doc.id);
        });
    } catch (error) {
        debugLog("Ошибка очистки комнат:", error);
    }
}, 30 * 60 * 1000); // Каждые 30 минут

// ========== ОБРАБОТКА ЗАКРЫТИЯ СТРАНИЦЫ ==========
window.addEventListener('beforeunload', function(e) {
    if (!isPageUnloading && (gameStarted || roomId)) {
        e.preventDefault();
        e.returnValue = 'Вы находитесь в игре. Вы уверены, что хотите уйти?';
        leaveRoom();
    }
});

// ========== СТИЛЬ ДЛЯ АНИМАЦИИ УВЕДОМЛЕНИЯ ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

console.log("🎮 Математическая битва полностью загружена и готова к работе!");
debugLog("Система готова. Добро пожаловать в игру!");
