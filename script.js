const gameBoard = document.getElementById('game-board');
const bgMusic = document.getElementById('bg-music');
const clickSound = document.getElementById('click-sound');
const victorySound = document.getElementById('victory-sound');
const gameoverSound = document.getElementById('gameover-sound');
const timerDisplay = document.getElementById('timer');
const movesDisplay = document.getElementById('moves');
const moveLimitDisplay = document.getElementById('move-limit');
const streakContainer = document.getElementById('streak-container');
const streakCountDisplay = document.getElementById('streak-count');

let level = 1, moves = 0, moveLimit = 0, matchedPairs = 0, timeLeft = 0, timerId = null, streak = 0;
let firstCard, secondCard, hasFlippedCard = false, lockBoard = false, isMuted = false, isPaused = false;

function createBurst(x, y, emoji, className) {
    for (let i = 0; i < 6; i++) {
        const p = document.createElement('div');
        p.innerHTML = emoji; p.className = className;
        const tx = (Math.random() - 0.5) * 200 + 'px';
        const ty = (Math.random() - 0.5) * 200 + 'px';
        p.style.setProperty('--tx', tx); p.style.setProperty('--ty', ty);
        p.style.left = x + 'px'; p.style.top = y + 'px';
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }
}

document.addEventListener('click', (e) => createBurst(e.clientX, e.clientY, '💖', 'click-heart'));

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    if (!isMuted) bgMusic.play().catch(() => {});
    level = 1;
    initLevel();
}

function initLevel() {
    clearInterval(timerId);
    isPaused = false; streak = 0;
    updateStreakDisplay();
    document.querySelectorAll('.overlay').forEach(o => { if(o.id !== 'start-screen') o.style.display = 'none'; });
    
    gameBoard.innerHTML = '';
    moves = 0; matchedPairs = 0; lockBoard = false; hasFlippedCard = false;
    movesDisplay.innerText = moves;
    document.getElementById('current-level').innerText = level;

    let sideLength = level <= 2 ? 2 : 4; 
    document.documentElement.style.setProperty('--grid-cols', sideLength);
    
    moveLimit = sideLength === 2 ? 6 : 25;
    moveLimitDisplay.innerText = moveLimit;
    timeLeft = sideLength === 2 ? 30 : 60;
    
    updateTimerDisplay();
    if (!isMuted && bgMusic.paused) bgMusic.play().catch(() => {});
    startTimer();
    generateCards(sideLength * sideLength);
}

function startTimer() {
    timerId = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) gameOver("Time's Up!");
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timerDisplay.innerText = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function generateCards(count) {
    const fruits = ['🍓', '🍑', '🍒', '🍉', '🍍', '🍎', '🍇', '🥝'].slice(0, count/2);
    const gameSet = [...fruits, ...fruits].sort(() => Math.random() - 0.5);
    gameSet.forEach(icon => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.fruit = icon;
        card.innerHTML = `<div class="front-face">${icon}</div><div class="back-face"></div>`;
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
    });
}

function flipCard() {
    if (lockBoard || this === firstCard || isPaused) return;
    if (!isMuted && bgMusic.paused) bgMusic.play().catch(() => {});
    if (!isMuted) { clickSound.currentTime = 0; clickSound.play().catch(()=>{}); }
    
    this.classList.add('flip');
    if (!hasFlippedCard) { hasFlippedCard = true; firstCard = this; return; }
    
    secondCard = this;
    moves++;
    movesDisplay.innerText = moves;
    checkForMatch();
}

function checkForMatch() {
    const isMatch = firstCard.dataset.fruit === secondCard.dataset.fruit;
    if (isMatch) {
        matchedPairs++;
        streak++;
        if (streak >= 2) {
            updateStreakDisplay();
            const rect = secondCard.getBoundingClientRect();
            createBurst(rect.left + rect.width/2, rect.top + rect.height/2, '🔥', 'fire-particle');
        }
        resetBoard();
        let cols = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-cols'));
        if (matchedPairs === (cols * cols) / 2) nextLevel();
    } else {
        streak = 0;
        updateStreakDisplay();
        if (moves >= moveLimit) {
            setTimeout(() => gameOver("Out of Moves!"), 500);
            return;
        }
        lockBoard = true;
        setTimeout(() => {
            firstCard.classList.remove('flip');
            secondCard.classList.remove('flip');
            resetBoard();
        }, 800);
    }
}

function updateStreakDisplay() {
    if (streak >= 2) {
        streakContainer.style.display = 'block';
        streakCountDisplay.innerText = streak;
        movesDisplay.classList.add('streak-active');
    } else {
        streakContainer.style.display = 'none';
        movesDisplay.classList.remove('streak-active');
    }
}

function resetBoard() { [hasFlippedCard, lockBoard] = [false, false]; [firstCard, secondCard] = [null, null]; }

function nextLevel() {
    clearInterval(timerId);
    document.getElementById('victory-overlay').style.display = 'flex';
    if (!isMuted) victorySound.play();
    setTimeout(() => { level++; initLevel(); }, 2500);
}

function gameOver(reason) {
    clearInterval(timerId);
    if (!isMuted) gameoverSound.play();
    document.getElementById('game-over-text').innerText = `🎀 ${reason} 🎀`;
    document.getElementById('game-over-screen').style.display = 'flex';
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-overlay').style.display = isPaused ? 'flex' : 'none';
    document.getElementById('pause-btn').innerText = isPaused ? '▶' : '⏸';
    if (!isPaused) document.getElementById('level-menu').style.display = 'none';
}

function showLevelMenu() {
    isPaused = true;
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('level-menu').style.display = 'flex';
    const list = document.getElementById('level-list');
    list.innerHTML = '';
    for(let i=1; i<=10; i++) {
        const b = document.createElement('button');
        b.innerText = i; b.className = 'nav-btn';
        b.style.padding = "15px";
        b.onclick = () => { level = i; initLevel(); };
        list.appendChild(b);
    }
}

function closeMenu() {
    document.getElementById('level-menu').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'flex';
}

function toggleMute() { isMuted = !isMuted; bgMusic.muted = isMuted; }