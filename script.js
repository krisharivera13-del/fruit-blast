const gameBoard=document.getElementById('game-board');
const timerDisplay=document.getElementById('timer');
const movesDisplay=document.getElementById('moves');
const moveLimitDisplay=document.getElementById('move-limit');
const streakContainer=document.getElementById('streak-container');
const streakCountDisplay=document.getElementById('streak-count');
const coinsDisplay=document.getElementById('coins');
const bgMusic=document.getElementById('bg-music');
const clickSound=document.getElementById('click-sound');
const victorySound=document.getElementById('victory-sound');
const gameoverSound=document.getElementById('gameover-sound');

let level=1,moves=0,moveLimit=0,matchedPairs=0,timeLeft=0,timerId=null,streak=0,coins=0;
let firstCard,secondCard,hasFlippedCard=false,lockBoard=false,isMuted=false,isPaused=false;
let currentTheme="fruits";
let purchasedThemes=['fruits'];

// Expanded fruits pool for unique pairs
const fruits=[
  '🍓','🍑','🍒','🍉','🍍','🍎','🍇','🥝',
  '🥭','🍐','🍋','🍌','🥥','🥑','🍈','🍊',
  '🍏','🥝','🥑','🍒','🍉','🍎','🍍','🍇'
];

const themeNames={
  red:"RED THEME", orange:"ORANGE THEME", yellow:"YELLOW THEME", green:"GREEN THEME",
  blue:"BLUE THEME", skyblue:"SKYBLUE THEME", purple:"PURPLE THEME",
  hellokitty:"HELLO KITTY THEME", sanrio:"SANRIO THEME"
};

const themeCosts={red:50,orange:50,yellow:50,green:50,blue:50,skyblue:50,purple:50,hellokitty:200,sanrio:250};

const themeColors={
  fruits:{back:'#ff80ab',border:'#b3e5fc',button:'#ff80ab',text:'#fff'},
  red:{back:'#ff5252',border:'#ffcdd2',button:'#f44336',text:'#fff'},
  orange:{back:'#ff9800',border:'#ffe0b2',button:'#fb8c00',text:'#fff'},
  yellow:{back:'#ffeb3b',border:'#fff9c4',button:'#fbc02d',text:'#ad1457'},
  green:{back:'#4caf50',border:'#c8e6c9',button:'#43a047',text:'#fff'},
  blue:{back:'#2196f3',border:'#bbdefb',button:'#1e88e5',text:'#fff'},
  skyblue:{back:'#81d4fa',border:'#e1f5fe',button:'#4fc3f7',text:'#ad1457'},
  purple:{back:'#9c27b0',border:'#e1bee7',button:'#8e24aa',text:'#fff'},
  hellokitty:{back:'#ffb6c1',border:'#fff0f5',button:'#ff69b4',text:'#fff'},
  sanrio:{back:'#b39ddb',border:'#ede7f6',button:'#9575cd',text:'#fff'}
};

function applyTheme(){
  const t=themeColors[currentTheme]||themeColors.fruits;
  document.documentElement.style.setProperty('--card-back',t.back);
  document.documentElement.style.setProperty('--card-border',t.border);
  document.documentElement.style.setProperty('--btn-color',t.button);
  document.documentElement.style.setProperty('--btn-text',t.text);
}

// Start screen → Level menu
function showStartLevels(){
  document.getElementById('start-screen').style.display='none';
  const menu=document.getElementById('level-menu');
  menu.style.display='flex';
  const list=document.getElementById('level-list');
  list.innerHTML='';
  for(let i=1;i<=50;i++){
    const b=document.createElement('button');
    b.className='nav-btn';
    b.innerText=i;
    b.onclick=()=>{level=i;menu.style.display='none';startGame();}
    list.appendChild(b);
  }
}

function startGame(){applyTheme();initLevel();}

function initLevel(){
  applyTheme();
  clearInterval(timerId); isPaused=false; streak=0;
  gameBoard.innerHTML=''; moves=0; matchedPairs=0; lockBoard=false; hasFlippedCard=false;
  movesDisplay.innerText=moves; document.getElementById('current-level').innerText=level;

  // Determine grid size
  let sideLength;
  if(level===1) sideLength=2;
  else if(level===2) sideLength=4;
  else if(level===3) sideLength=8;
  else sideLength=10;
  document.documentElement.style.setProperty('--grid-cols',sideLength);

  moveLimit=sideLength*sideLength+10; moveLimitDisplay.innerText=moveLimit;
  timeLeft=50+sideLength*5; timerDisplay.innerText=timeLeft;

  startTimer(); generateCards(sideLength*sideLength);
}

// Timer
function startTimer(){
  timerId=setInterval(()=>{
    if(!isPaused){timeLeft--; timerDisplay.innerText=timeLeft;
      if(timeLeft<=0) gameOver("Time's Up!");
    }
  },1000);
}

// Generate cards with unique pairs
function generateCards(count){
  const pairCount = Math.floor(count/2);
  const pool = fruits.slice(0,pairCount); // pick unique fruits for pairs
  let cards = [...pool, ...pool]; // duplicate each for a pair
  cards.sort(()=>Math.random()-0.5); // shuffle

  gameBoard.innerHTML='';
  cards.forEach(icon=>{
    const card=document.createElement('div');
    card.className='memory-card';
    card.dataset.fruit=icon;
    card.innerHTML=`<div class="front-face">${icon}</div><div class="back-face"></div>`;
    card.addEventListener('click',flipCard);
    gameBoard.appendChild(card);
  });
}

// Flip card
function flipCard(){
  if(lockBoard||this===firstCard||isPaused) return;
  this.classList.add('flip');
  if(!hasFlippedCard){hasFlippedCard=true; firstCard=this; return;}
  secondCard=this; moves++; movesDisplay.innerText=moves; checkForMatch();
}

// Check match
function checkForMatch(){
  if(firstCard.dataset.fruit===secondCard.dataset.fruit){
    matchedPairs++;
    resetBoard();
    if(matchedPairs>=gameBoard.children.length/2) nextLevel();
  } else{
    lockBoard=true;
    setTimeout(()=>{firstCard.classList.remove('flip'); secondCard.classList.remove('flip'); resetBoard();},800);
  }
}

function resetBoard(){[hasFlippedCard,lockBoard]=[false,false]; [firstCard,secondCard]=[null,null];}

// Next level
function nextLevel(){
  clearInterval(timerId); coins+=10; updateCoins();
  document.getElementById('victory-overlay').style.display='flex';
  setTimeout(()=>{document.getElementById('victory-overlay').style.display='none'; level++; initLevel();},2000);
}

// Game over
function gameOver(reason){
  clearInterval(timerId);
  document.getElementById('game-over-text').innerText=reason;
  document.getElementById('game-over-screen').style.display='flex';
}

// Try again
function tryAgain(){
  document.getElementById('game-over-screen').style.display='none';
  initLevel();
}

// Pause
function togglePause(){
  isPaused=!isPaused;
  document.getElementById('pause-overlay').style.display=isPaused?'flex':'none';
  document.getElementById('pause-btn').innerText=isPaused?'▶':'⏸';
}

// Mute
function toggleMute(){
  isMuted=!isMuted;
  bgMusic.muted=isMuted;
  document.getElementById("mute-btn").innerText=isMuted?"🔇":"🔊";
}

// Shop
function showShop(){
  const shopOverlay=document.getElementById('shop-overlay'); 
  shopOverlay.style.display='flex';
  const shopList=document.getElementById('shop-list'); 
  shopList.innerHTML='';
  for(let key in themeNames){
    const btn=document.createElement('button'); 
    btn.className='nav-btn'; 
    btn.style.padding='12px';

    if(purchasedThemes.includes(key)){
      btn.innerText = `${themeNames[key]} - Unlocked`;
      btn.disabled = true;
      btn.style.opacity = 0.6;
      btn.style.cursor = 'default';
    } else {
      btn.innerText=`${themeNames[key]} - ${themeCosts[key]} COINS`;
      btn.onclick=()=>buyTheme(key,themeCosts[key]);
    }

    shopList.appendChild(btn);
  }
}

function closeShop(){document.getElementById('shop-overlay').style.display='none';}

// Buy theme
function buyTheme(theme, cost){
  if(purchasedThemes.includes(theme)){
    alert(`${themeNames[theme]} is already unlocked!`);
    return;
  }
  if(coins>=cost){
    coins-=cost;
    purchasedThemes.push(theme);
    updateCoins();
    currentTheme=theme;
    applyTheme();
    initLevel();
    alert(`${themeNames[theme]} unlocked!`);
  } else alert("Not enough coins!");
}

function updateCoins(){coinsDisplay.innerText=coins;}
