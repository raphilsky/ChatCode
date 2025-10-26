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
    const obs = obstacles[i];
    obs.x -= scrollSpeed;

    if (obs.x + obs.width < -8) {
      obstacles.splice(i, 1);
      score += 1;
      scoreEl.textContent = score;
      scrollSpeed += SPEED_INCREMENT;
      continue;
    }

    if (checkCollision(player, obs)) {
      gameOver();
      return;
    }
  }

  draw();
  animationFrameId = requestAnimationFrame(update);
}

function draw() {
  drawSky();
  drawStars(true);
  drawMountains();
  drawGround();
  drawObstacles();
  drawPlayer();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, palette.skyTop);
  gradient.addColorStop(0.65, palette.skyBottom);
  gradient.addColorStop(1, palette.horizon);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function drawStars(animate = false) {
  ctx.fillStyle = palette.stars;
  stars.forEach((star) => {
    ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
    if (animate) {
      star.x -= scrollSpeed * star.speed;
      if (star.x < -2) {
        star.x = GAME_WIDTH + Math.random() * 12;
        star.y = Math.random() * (GROUND_Y - 40);
      }
      if (Math.random() < 0.002) {
        star.size = star.size === 1 ? 2 : 1;
      }
    }
  });
}

function drawMountains() {
  ctx.fillStyle = palette.ridgeFar;
  for (let x = -32; x < GAME_WIDTH + 32; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y - 20);
    ctx.lineTo(x + 16, GROUND_Y - 50);
    ctx.lineTo(x + 32, GROUND_Y - 20);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = palette.ridgeNear;
  for (let x = -48; x < GAME_WIDTH + 48; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y - 8);
    ctx.lineTo(x + 24, GROUND_Y - 40);
    ctx.lineTo(x + 48, GROUND_Y - 8);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = palette.horizon;
  ctx.fillRect(0, GROUND_Y - 10, GAME_WIDTH, 10);
}

function drawGround() {
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

  ctx.fillStyle = palette.groundHighlight;
  for (let x = 0; x < GAME_WIDTH; x += 8) {
    ctx.fillRect(x, GROUND_Y, 4, 4);
  }

  ctx.fillStyle = palette.groundShadow;
  for (let x = 4; x < GAME_WIDTH; x += 8) {
    ctx.fillRect(x, GROUND_Y + 4, 4, 4);
  }

  ctx.fillStyle = palette.groundShadow;
  ctx.fillRect(0, GROUND_Y - 2, GAME_WIDTH, 2);
}

function drawObstacles() {
  obstacles.forEach((obs) => {
    paintObstacle(Math.floor(obs.x), Math.floor(obs.y), obs.width, obs.height);
  });
}

function paintObstacle(x, y, width, height) {
  ctx.fillStyle = palette.obstacleShadow;
  ctx.fillRect(x - 1, y + height, width + 2, 3);

  ctx.fillStyle = palette.obstacle;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = palette.obstacleHighlight;
  ctx.fillRect(x, y, width, 3);

  ctx.fillStyle = palette.obstacleShadow;
  ctx.fillRect(x + 1, y + height - 4, width - 2, 4);

  ctx.fillStyle = palette.obstacleHighlight;
  for (let stripe = 2; stripe < width - 1; stripe += 4) {
    ctx.fillRect(x + stripe, y + 4, 1, height - 8);
  }
}

function drawPlayer() {
  const frame = Math.floor(player.animationTime / 10) % duckFrames.length;
  const x = Math.floor(player.x);
  const y = Math.floor(player.y);

  const distanceFromGround = Math.max(0, GROUND_Y - (player.y + player.height));
  const shadowWidth = distanceFromGround > 6 ? 12 : 16;
  const shadowOpacity = distanceFromGround > 6 ? 0.22 : 0.38;
  const shadowX = Math.floor(player.x + (player.width - shadowWidth) / 2);

  ctx.save();
  ctx.globalAlpha = shadowOpacity;
  ctx.fillStyle = palette.duckShadow;
  ctx.fillRect(shadowX, GROUND_Y + 2, shadowWidth, 2);
  ctx.restore();

  drawDuckSprite(x, y, frame);
}

function drawDuckSprite(x, y, frameIndex) {
  const sprite = duckFrames[frameIndex];
  for (let row = 0; row < sprite.length; row += 1) {
    const line = sprite[row];
    for (let col = 0; col < line.length; col += 1) {
      const code = line[col];
      const color = duckPalette[code];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + col, y + row, 1, 1);
    }
  }
}

function drawIntroScreen() {
  drawSky();
  drawStars(false);
  drawMountains();
  drawGround();

  const panelX = 36;
  const panelY = 20;
  const panelWidth = GAME_WIDTH - 72;
  const panelHeight = 80;

  drawPanel(panelX, panelY, panelWidth, panelHeight);

  ctx.textAlign = "center";
  ctx.fillStyle = palette.titleGlow;
  ctx.font = "16px 'Press Start 2P', monospace";
  ctx.fillText("DUCK DASH", GAME_WIDTH / 2, panelY + 26);

  ctx.fillStyle = palette.textLight;
  ctx.font = "8px 'Press Start 2P', monospace";
  ctx.fillText("8-BIT FLIGHT", GAME_WIDTH / 2, panelY + 44);

  ctx.fillStyle = palette.textDim;
  ctx.fillText("Pressione START", GAME_WIDTH / 2, panelY + 64);

  ctx.textAlign = "right";
  ctx.fillStyle = palette.textLight;
  ctx.fillText(`REC ${String(highScore).padStart(2, "0")}`, panelX + panelWidth - 10, panelY + 20);
  ctx.textAlign = "center";

  const duckX = Math.floor(GAME_WIDTH / 2) - Math.floor(player.width / 2);
  const duckY = GROUND_Y - player.height - 6;
  paintObstacle(duckX - 34, GROUND_Y - 28, 14, 28);
  paintObstacle(duckX + player.width + 12, GROUND_Y - 36, 16, 36);
  drawDuckSprite(duckX, duckY, 0);

  drawSparkle(duckX - 16, duckY + 6);
  drawSparkle(duckX + player.width + 10, duckY + 4);
}

function drawSparkle(x, y) {
  ctx.fillStyle = palette.titleGlow;
  ctx.fillRect(x, y, 1, 1);
  ctx.fillRect(x + 1, y - 1, 1, 1);
  ctx.fillRect(x + 2, y, 1, 1);
  ctx.fillRect(x + 1, y + 1, 1, 1);
  ctx.fillRect(x + 1, y, 1, 1);
}

function drawPanel(x, y, width, height) {
  ctx.fillStyle = "rgba(8, 13, 34, 0.9)";
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = palette.titleGlow;
  ctx.fillRect(x - 2, y - 2, width + 4, 2);
  ctx.fillRect(x - 2, y + height, width + 4, 2);
  ctx.fillRect(x - 2, y - 2, 2, height + 4);
  ctx.fillRect(x + width, y - 2, 2, height + 4);

  ctx.fillStyle = "rgba(12, 24, 54, 0.9)";
  ctx.fillRect(x - 4, y - 4, width + 8, 2);
  ctx.fillRect(x - 4, y + height + 2, width + 8, 2);
  ctx.fillRect(x - 4, y - 4, 2, height + 8);
  ctx.fillRect(x + width + 2, y - 4, 2, height + 8);
}

function drawGameOver() {
  draw();
  ctx.fillStyle = "rgba(4, 8, 22, 0.75)";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  const panelWidth = GAME_WIDTH - 80;
  const panelHeight = 70;
  const panelX = (GAME_WIDTH - panelWidth) / 2;
  const panelY = (GAME_HEIGHT - panelHeight) / 2 - 10;

  drawPanel(panelX, panelY, panelWidth, panelHeight);

  ctx.textAlign = "center";
  ctx.fillStyle = palette.textLight;
  ctx.font = "12px 'Press Start 2P', monospace";
  ctx.fillText("PATO CAIU!", GAME_WIDTH / 2, panelY + 24);

  ctx.fillStyle = palette.textDim;
  ctx.font = "8px 'Press Start 2P', monospace";
  ctx.fillText(`Pontuação ${String(score).padStart(2, "0")}`, GAME_WIDTH / 2, panelY + 40);
  ctx.fillText(`Recorde ${String(highScore).padStart(2, "0")}`, GAME_WIDTH / 2, panelY + 52);

  ctx.fillStyle = palette.textLight;
  ctx.fillText("Pressione START", GAME_WIDTH / 2, panelY + 64);
}

function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function jump() {
  if (gameState !== "running") return;
  if (player.isJumping) return;
  player.vy = JUMP_FORCE;
  player.isJumping = true;
}

function handleStart() {
  if (gameState === "running") return;
  resetGame();
  cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(update);
}

function gameOver() {
  gameState = "gameover";
  cancelAnimationFrame(animationFrameId);
  highScore = Math.max(highScore, score);
  highScoreEl.textContent = highScore;
  localStorage.setItem(STORAGE_KEY, String(highScore));
  if (LEGACY_STORAGE_KEY !== STORAGE_KEY) {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
  drawGameOver();
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function init() {
  scoreEl.textContent = score;
  highScoreEl.textContent = highScore;
  drawIntroScreen();
}

function handleKeyDown(event) {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    if (gameState !== "running") {
      handleStart();
    } else {
      jump();
    }
  }
}

function handlePointer() {
  if (gameState !== "running") {
    handleStart();
  } else {
    jump();
  }
}

document.addEventListener("keydown", handleKeyDown);
canvas.addEventListener("pointerdown", handlePointer);
startBtn.addEventListener("click", handleStart);

init();
