const gameBoard = document.getElementById('game-board');
const movesDisplay = document.getElementById('moves');
const maxMovesDisplay = document.getElementById('max-moves');
const timerDisplay = document.getElementById('timer');
const levelDisplay = document.getElementById('current-level');
const streakDisplay = document.getElementById('streak-count');
const bgMusic = document.getElementById('bg-music');
const muteBtn = document.getElementById('mute-btn');

const fruitIcons = ['🍎','🍌','🍊','🍇','🥝','🍒','🍓','🍉','🍍','🥭','🍑','🍐','🍏','🍋','🫐','🍈','🥥','🥑','🍆','🥕','🌽','🌶️','🥦','🍄','🥜','🌰','🍠','🫛','🥬','🍅'];
const themes = ["#FFB6C1", "#4ecdc4", "#ff6b6b", "#ffe66d", "#ff9f1c", "#2ec4b6"];
const SPECIAL_FRUIT = '🌟';

let level = parseInt(localStorage.getItem('fruitLevel')) || 1;
let maxUnlockedLevel = parseInt(localStorage.getItem('maxFruitLevel')) || 1;
let firstCard, secondCard;
let hasFlippedCard = false, lockBoard = false, isPaused = false, isMuted = false;
let moves = 0, maxMoves = 0, timeLeft = 0, matchedPairs = 0, totalPairsNeeded = 0, currentStreak = 0;
let timerInterval = null;

// Audio Fix: Handle autoplay restrictions and file names
function playMusic() {
    if (!isMuted) {
        bgMusic.volume = 0.4;
        bgMusic.play().catch(() => {
            console.log("Waiting for user interaction to play music...");
        });
    }
}

function initLevel() {
    // Resetting UI/State
    document.querySelectorAll('.overlay').forEach(o => o.style.display = 'none');
    gameBoard.innerHTML = '';
    moves = 0; matchedPairs = 0; currentStreak = 0; lockBoard = false;
    hasFlippedCard = false;
    movesDisplay.innerText = 0; streakDisplay.innerText = 0;
    clearInterval(timerInterval); timerInterval = null;

    levelDisplay.innerText = level;
    document.documentElement.style.setProperty('--card-color', themes[level % themes.length]);

    // Grid Layout Scaling
    let sideLength = level <= 2 ? 2 : (level <= 5 ? 4 : 6);
    document.documentElement.style.setProperty('--grid-cols', sideLength);
    
    let cardCount = sideLength * sideLength;
    totalPairsNeeded = cardCount / 2;
    timeLeft = 30 + (totalPairsNeeded * 5);
    maxMoves = totalPairsNeeded * 3;

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
    
    playMusic(); // Ensure music plays on interaction
    if (!timerInterval) startTimer();

    this.classList.add('flip');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    moves++;
    movesDisplay.innerText = moves;
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.fruit === secondCard.dataset.fruit;

    if (isMatch) {
        matchedPairs++;
        currentStreak++;
        streakDisplay.innerText = currentStreak;
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        resetBoard();
        if (matchedPairs === totalPairsNeeded) setTimeout(nextLevel, 500);
    } else {
        currentStreak = 0;
        streakDisplay.innerText = 0;
        lockBoard = true;
        
        // Realism: Shake board on fail
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

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) gameOver("Out of time!");
        }
    }, 1000);
}

function updateTimerDisplay() {
    let mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    let secs = (timeLeft % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `${mins}:${secs}`;
}

function nextLevel() {
    clearInterval(timerInterval);
    level++;
    localStorage.setItem('fruitLevel', level);
    if (level > maxUnlockedLevel) localStorage.setItem('maxFruitLevel', level);
    initLevel();
}

function gameOver(reason) {
    clearInterval(timerInterval);
    document.getElementById('fail-reason').innerText = reason;
    document.getElementById('game-over-screen').style.display = 'flex';
}

function toggleMute() {
    isMuted = !isMuted;
    bgMusic.muted = isMuted;
    muteBtn.innerText = isMuted ? "🔇 Muted" : "🔊 Sound";
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-screen').style.display = isPaused ? 'flex' : 'none';
    isPaused ? bgMusic.pause() : playMusic();
}

function showLevelMenu() {
    document.getElementById('level-menu').style.display = 'flex';
    // Add logic to populate level-list if needed
}

function confirmRestart() {
    if(confirm("Restart level?")) initLevel();
}

initLevel();