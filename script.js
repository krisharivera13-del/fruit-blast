const gameBoard = document.getElementById('game-board');
const movesDisplay = document.getElementById('moves');
const maxMovesDisplay = document.getElementById('max-moves');
const timerDisplay = document.getElementById('timer');
const levelDisplay = document.getElementById('current-level');
const streakDisplay = document.getElementById('streak-count');

const bgMusic = document.getElementById('bg-music');
const clickSound = document.getElementById('click-sound');
const gameoverSound = document.getElementById('gameover-sound');
const victorySound = document.getElementById('victory-sound');

const fruitIcons = ['🍎','🍌','🍊','🍇','🥝','🍒','🍓','🍉','🍍','🥭','🍑','🍐','🍏','🍋','🫐','🍈','🥥','🥑','🍆','🥕','🌽','🌶️','🥦','🍄','🥜','🌰','🍠','🫛','🥬','🍅'];
const themes = ["#FFB6C1", "#4ecdc4", "#ff6b6b", "#ffe66d", "#ff9f1c", "#2ec4b6"];

let level = parseInt(localStorage.getItem('fruitLevel')) || 1;
let maxUnlockedLevel = parseInt(localStorage.getItem('maxFruitLevel')) || 1;
let firstCard, secondCard;
let hasFlippedCard = false, lockBoard = false, isPaused = false, isMuted = false;
let moves = 0, maxMoves = 0, timeLeft = 0, matchedPairs = 0, totalPairsNeeded = 0, currentStreak = 0;
let timerInterval = null;

function playClick() { 
    if (!isMuted) { 
        clickSound.currentTime = 0; 
        clickSound.play().catch(()=>{}); 
    } 
}

function initLevel() {
    document.querySelectorAll('.overlay').forEach(o => o.style.display = 'none');
    gameBoard.innerHTML = '';
    moves = 0; matchedPairs = 0; currentStreak = 0; lockBoard = false;
    hasFlippedCard = false; firstCard = null; secondCard = null;
    movesDisplay.innerText = 0; streakDisplay.innerText = 0;
    clearInterval(timerInterval); timerInterval = null;

    levelDisplay.innerText = level;
    document.documentElement.style.setProperty('--card-color', themes[level % themes.length]);

    // Scaling Logic: 2x2 up to 8x8
    let sideLength = level <= 2 ? 2 : (level <= 5 ? 4 : 6); 
    document.documentElement.style.setProperty('--grid-cols', sideLength);
    
    let cardCount = sideLength * sideLength;
    totalPairsNeeded = cardCount / 2;
    timeLeft = 25 + (totalPairsNeeded * 6);
    maxMoves = Math.floor(totalPairsNeeded * 3);

    maxMovesDisplay.innerText = maxMoves;
    updateTimerDisplay();
    generateCards(cardCount);
}

function generateCards(count) {
    let icons = [];
    for(let i=0; i < (count/2); i++) icons.push(fruitIcons[i % fruitIcons.length]);
    const gameSet = [...icons, ...icons].sort(() => Math.random() - 0.5);
    gameSet.forEach(icon => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.fruit = icon;
        card.innerHTML = `<div class="front-face">${icon}</div><div class="back-face">?</div>`;
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
    });
}

function flipCard() {
    if (lockBoard || this === firstCard || isPaused) return;
    playClick();
    if (!timerInterval) { 
        if (!isMuted) bgMusic.play().catch(()=>{}); 
        startTimer(); 
    }

    this.classList.add('flip');
    if (!hasFlippedCard) { hasFlippedCard = true; firstCard = this; return; }
    secondCard = this;
    moves++;
    movesDisplay.innerText = moves;
    checkForMatch();
}

function checkForMatch() {
    if (firstCard.dataset.fruit === secondCard.dataset.fruit) {
        matchedPairs++;
        currentStreak++;
        streakDisplay.innerText = currentStreak;
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        resetBoard();
        if (matchedPairs === totalPairsNeeded) nextLevel();
    } else {
        currentStreak = 0; streakDisplay.innerText = 0;
        lockBoard = true;
        gameBoard.classList.add('shake');
        setTimeout(() => {
            firstCard.classList.remove('flip');
            secondCard.classList.remove('flip');
            gameBoard.classList.remove('shake');
            resetBoard();
        }, 800);
    }
    if (moves >= maxMoves && matchedPairs < totalPairsNeeded) gameOver("Out of moves!");
}

function resetBoard() { [hasFlippedCard, lockBoard] = [false, false]; [firstCard, secondCard] = [null, null]; }

function startTimer() {
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) gameOver("Time is up!");
        }
    }, 1000);
}

function updateTimerDisplay() {
    let m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    let s = (timeLeft % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `${m}:${s}`;
}

function nextLevel() {
    clearInterval(timerInterval);
    bgMusic.pause();
    if (!isMuted) {
        victorySound.currentTime = 0;
        victorySound.play().catch(()=>{});
    }
    setTimeout(() => {
        level++;
        localStorage.setItem('fruitLevel', level);
        if (level > maxUnlockedLevel) localStorage.setItem('maxFruitLevel', level);
        if (!isMuted) bgMusic.play();
        initLevel();
    }, 1800);
}

function gameOver(reason) {
    clearInterval(timerInterval);
    bgMusic.pause();
    if (!isMuted) {
        gameoverSound.currentTime = 0;
        gameoverSound.play().catch(()=>{});
    }
    document.getElementById('fail-reason').innerText = reason;
    document.getElementById('game-over-screen').style.display = 'flex';
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 400);
}

function togglePause() { 
    playClick(); 
    isPaused = !isPaused; 
    if (isPaused) bgMusic.pause(); else if (!isMuted && timerInterval) bgMusic.play();
    document.getElementById('pause-screen').style.display = isPaused ? 'flex' : 'none';
}

function toggleMute() { 
    playClick(); 
    isMuted = !isMuted; 
    bgMusic.muted = isMuted; 
    document.getElementById('mute-btn').innerText = isMuted ? "🔇 Muted" : "🔊 Sound"; 
}

function showLevelMenu() {
    playClick();
    document.getElementById('level-menu').style.display = 'flex';
    const list = document.getElementById('level-list');
    list.innerHTML = '';
    for(let i=1; i<=maxUnlockedLevel; i++) {
        const b = document.createElement('button');
        b.innerText = i;
        b.onclick = () => { level = i; initLevel(); };
        list.appendChild(b);
    }
}

function confirmRestart() { if(confirm("Restart level?")) { playClick(); initLevel(); } }

function resetProgress() { if(confirm("Reset all progress?")) { localStorage.clear(); location.reload(); } }

initLevel();