const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const startBtn = document.getElementById("start-btn");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const GROUND_Y = GAME_HEIGHT - 32;
const GRAVITY = 0.5;
const JUMP_FORCE = -7.6;
const OBSTACLE_MIN_GAP = 120;
const OBSTACLE_MAX_GAP = 220;
const OBSTACLE_SPEED_START = 2.2;
const SPEED_INCREMENT = 0.0028;
const STORAGE_KEY = "duck-dash-high-score";
const LEGACY_STORAGE_KEY = "pixel-runner-high-score";

let gameState = "intro";
let score = 0;
let obstacleTimer = 0;
let obstacleDelay = 90;
let scrollSpeed = OBSTACLE_SPEED_START;
let animationFrameId = null;

const storedHighScore = localStorage.getItem(STORAGE_KEY);
const legacyHighScore = localStorage.getItem(LEGACY_STORAGE_KEY);
let highScore = Number(storedHighScore ?? legacyHighScore ?? 0);
if (!Number.isFinite(highScore)) {
  highScore = 0;
}

const palette = {
  skyTop: "#050b24",
  skyBottom: "#172b56",
  horizon: "#0d1834",
  ridgeFar: "#182947",
  ridgeNear: "#243a63",
  ground: "#111a33",
  groundHighlight: "#1f2d4f",
  groundShadow: "#080f23",
  stars: "#f5f9d7",
  obstacle: "#ffb703",
  obstacleShadow: "#a35713",
  obstacleHighlight: "#ffe59d",
  duckShadow: "#071122",
  titleGlow: "#64ffda",
  textLight: "#f4f8ff",
  textDim: "#8ea9ff",
};

const duckPalette = {
  H: "#8fd4ff",
  B: "#3c82f6",
  S: "#1f4fb7",
  E: "#f8fbff",
  K: "#0a1328",
  Y: "#f7d441",
  y: "#d08e17",
  ".": null,
};

const duckFrames = [
  [
    "..................",
    ".......HHH........",
    "......HHHHH.......",
    ".....HHHHHHH......",
    "....HBBBBBBBH.....",
    "...HBBBBBBBBBH....",
    "..HBBBBBBBBBBBH...",
    "..HBBBBBBBEBBBH...",
    ".HBBBBBBBKBBBBBY..",
    ".HBBBBBBBBBBBBYYy.",
    ".HBBBBBBBBBBBBHY..",
    "..HBBBBBBBBBBBH...",
    "..HBBBBSSSBBBBH...",
    "...HBBBSSSSBBBH...",
    "....HHB....BBH....",
    "..................",
  ],
  [
    "..................",
    ".......HHH........",
    "......HHHHH.......",
    ".....HHHHHHH......",
    "....HBBBBBBBH.....",
    "...HBBBBBBBBBH....",
    "..HBBBBBBBBBBBH...",
    "..HBBBBBBBEBBBH...",
    ".HBBBBBBBKBBBBBY..",
    ".HBBBBBBBBBBBBYYy.",
    ".HBBBBBBBBBBBBHY..",
    "..HBBBBBBBBBBBH...",
    "...HBBBBBBBBBHH...",
    "...HBBBBSSBHHH....",
    "....HHB...HH......",
    "..................",
  ],
];

const DUCK_WIDTH = duckFrames[0][0].length;
const DUCK_HEIGHT = duckFrames[0].length;

const player = {
  x: 44,
  y: GROUND_Y - DUCK_HEIGHT,
  width: DUCK_WIDTH,
  height: DUCK_HEIGHT,
  vy: 0,
  isJumping: false,
  animationTime: 0,
};

const obstacles = [];
const stars = Array.from({ length: 42 }, () => ({
  x: Math.random() * GAME_WIDTH,
  y: Math.random() * (GROUND_Y - 40),
  size: Math.random() > 0.8 ? 2 : 1,
  speed: Math.random() * 0.25 + 0.05,
}));

function resetGame() {
  obstacles.length = 0;
  player.y = GROUND_Y - player.height;
  player.vy = 0;
  player.isJumping = false;
  player.animationTime = 0;
  score = 0;
  scrollSpeed = OBSTACLE_SPEED_START;
  obstacleTimer = 0;
  obstacleDelay = randomRange(OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP) / scrollSpeed;
  scoreEl.textContent = score;
  gameState = "running";
}

function spawnObstacle() {
  const height = randomRange(18, 38);
  const width = randomRange(12, 20);
  obstacles.push({
    x: GAME_WIDTH + width,
    y: GROUND_Y - height,
    width: Math.floor(width),
    height: Math.floor(height),
  });
}

function update() {
  if (gameState !== "running") return;

  player.animationTime += 1;
  player.vy += GRAVITY;
  player.y += player.vy;

  if (player.y + player.height >= GROUND_Y) {
    player.y = GROUND_Y - player.height;
    player.vy = 0;
    player.isJumping = false;
  }

  obstacleTimer += 1;
  const spawnThreshold = obstacleDelay / scrollSpeed;
  if (obstacleTimer > spawnThreshold) {
    spawnObstacle();
    obstacleTimer = 0;
    obstacleDelay = randomRange(OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP);
  }

  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obs =
