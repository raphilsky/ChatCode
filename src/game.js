diff --git a/src/game.js b/src/game.js
new file mode 100644
index 0000000000000000000000000000000000000000..47d6694f389ff6992838b0cc0184a8eee0058737
--- /dev/null
+++ b/src/game.js
@@ -0,0 +1,282 @@
+const canvas = document.getElementById("game");
+const ctx = canvas.getContext("2d");
+ctx.imageSmoothingEnabled = false;
+
+const startBtn = document.getElementById("start-btn");
+const scoreEl = document.getElementById("score");
+const highScoreEl = document.getElementById("high-score");
+
+const GAME_WIDTH = canvas.width;
+const GAME_HEIGHT = canvas.height;
+const GROUND_Y = GAME_HEIGHT - 32;
+const GRAVITY = 0.5;
+const JUMP_FORCE = -7.5;
+const OBSTACLE_MIN_GAP = 120;
+const OBSTACLE_MAX_GAP = 220;
+const OBSTACLE_SPEED_START = 2.2;
+const SPEED_INCREMENT = 0.0025;
+
+let running = false;
+let score = 0;
+let highScore = Number(localStorage.getItem("pixel-runner-high-score") ?? 0);
+let obstacleTimer = 0;
+let obstacleDelay = 90;
+let scrollSpeed = OBSTACLE_SPEED_START;
+let animationFrameId = null;
+
+const palette = {
+  sky: "#1f1632",
+  stars: "#f2f1cf",
+  mountainsDark: "#2b2144",
+  mountainsLight: "#3a2f5f",
+  ground: "#452d54",
+  accent: "#ff9f1c",
+  player: "#2ec4b6",
+  playerShadow: "#1b7f78",
+  obstacle: "#e71d36",
+};
+
+const player = {
+  x: 48,
+  y: GROUND_Y - 16,
+  width: 16,
+  height: 16,
+  vy: 0,
+  isJumping: false,
+  animationTime: 0,
+};
+
+const obstacles = [];
+const stars = Array.from({ length: 40 }, () => ({
+  x: Math.random() * GAME_WIDTH,
+  y: Math.random() * (GAME_HEIGHT - 50),
+  size: Math.random() > 0.85 ? 2 : 1,
+}));
+
+function resetGame() {
+  obstacles.length = 0;
+  player.y = GROUND_Y - player.height;
+  player.vy = 0;
+  player.isJumping = false;
+  player.animationTime = 0;
+  score = 0;
+  scrollSpeed = OBSTACLE_SPEED_START;
+  obstacleTimer = 0;
+  obstacleDelay = randomRange(OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP) / scrollSpeed;
+  scoreEl.textContent = score;
+  running = true;
+}
+
+function spawnObstacle() {
+  const height = randomRange(16, 28);
+  const width = randomRange(14, 22);
+  obstacles.push({
+    x: GAME_WIDTH + width,
+    y: GROUND_Y - height,
+    width,
+    height,
+  });
+}
+
+function update() {
+  if (!running) return;
+
+  player.animationTime += 1;
+  player.vy += GRAVITY;
+  player.y += player.vy;
+
+  if (player.y + player.height >= GROUND_Y) {
+    player.y = GROUND_Y - player.height;
+    player.vy = 0;
+    player.isJumping = false;
+  }
+
+  obstacleTimer += 1;
+  const spawnThreshold = obstacleDelay / scrollSpeed;
+  if (obstacleTimer > spawnThreshold) {
+    spawnObstacle();
+    obstacleTimer = 0;
+    obstacleDelay = randomRange(OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP);
+  }
+
+  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
+    const obs = obstacles[i];
+    obs.x -= scrollSpeed;
+
+    if (obs.x + obs.width < 0) {
+      obstacles.splice(i, 1);
+      score += 1;
+      scoreEl.textContent = score;
+      scrollSpeed += SPEED_INCREMENT;
+      continue;
+    }
+
+    if (checkCollision(player, obs)) {
+      gameOver();
+      return;
+    }
+  }
+
+  draw();
+  animationFrameId = requestAnimationFrame(update);
+}
+
+function draw() {
+  ctx.fillStyle = palette.sky;
+  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
+  drawStars();
+  drawMountains();
+  drawGround();
+  drawPlayer();
+  drawObstacles();
+}
+
+function drawStars() {
+  ctx.fillStyle = palette.stars;
+  stars.forEach((star) => {
+    ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
+    star.x -= scrollSpeed * 0.1;
+    if (star.x < 0) {
+      star.x = GAME_WIDTH;
+      star.y = Math.random() * (GAME_HEIGHT - 50);
+    }
+  });
+}
+
+function drawMountains() {
+  ctx.fillStyle = palette.mountainsDark;
+  ctx.fillRect(0, GROUND_Y - 40, GAME_WIDTH, 40);
+  ctx.fillStyle = palette.mountainsLight;
+  for (let i = 0; i < GAME_WIDTH; i += 64) {
+    ctx.beginPath();
+    ctx.moveTo(i, GROUND_Y - 8);
+    ctx.lineTo(i + 32, GROUND_Y - 36);
+    ctx.lineTo(i + 64, GROUND_Y - 8);
+    ctx.closePath();
+    ctx.fill();
+  }
+}
+
+function drawGround() {
+  ctx.fillStyle = palette.ground;
+  ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
+
+  ctx.fillStyle = "#2a1735";
+  for (let x = 0; x < GAME_WIDTH; x += 16) {
+    ctx.fillRect(x, GROUND_Y, 8, 8);
+  }
+}
+
+function drawPlayer() {
+  const frame = Math.floor(player.animationTime / 8) % 2;
+  const bodyHeight = player.height - 4;
+  const bodyY = Math.floor(player.y);
+  const bodyX = Math.floor(player.x);
+
+  ctx.fillStyle = palette.playerShadow;
+  ctx.fillRect(bodyX, bodyY + bodyHeight, player.width, 4);
+
+  ctx.fillStyle = palette.player;
+  ctx.fillRect(bodyX, bodyY + 2, player.width, bodyHeight - 2);
+  ctx.fillStyle = palette.accent;
+  ctx.fillRect(bodyX + player.width - 4, bodyY + 4, 3, 3);
+
+  ctx.fillStyle = palette.playerShadow;
+  const legWidth = 4;
+  if (!player.isJumping) {
+    if (frame === 0) {
+      ctx.fillRect(bodyX + 2, bodyY + bodyHeight, legWidth, 4);
+      ctx.fillRect(bodyX + player.width - legWidth - 2, bodyY + bodyHeight - 2, legWidth, 6);
+    } else {
+      ctx.fillRect(bodyX + 2, bodyY + bodyHeight - 2, legWidth, 6);
+      ctx.fillRect(bodyX + player.width - legWidth - 2, bodyY + bodyHeight, legWidth, 4);
+    }
+  }
+}
+
+function drawObstacles() {
+  ctx.fillStyle = palette.obstacle;
+  obstacles.forEach((obs) => {
+    ctx.fillRect(Math.floor(obs.x), Math.floor(obs.y), obs.width, obs.height);
+    ctx.fillStyle = "#8c1120";
+    ctx.fillRect(Math.floor(obs.x) + 2, Math.floor(obs.y) + 2, obs.width - 4, obs.height - 4);
+    ctx.fillStyle = palette.obstacle;
+  });
+}
+
+function checkCollision(a, b) {
+  return (
+    a.x < b.x + b.width &&
+    a.x + a.width > b.x &&
+    a.y < b.y + b.height &&
+    a.y + a.height > b.y
+  );
+}
+
+function jump() {
+  if (!running) return;
+  if (player.isJumping) return;
+  player.vy = JUMP_FORCE;
+  player.isJumping = true;
+}
+
+function handleStart() {
+  if (running) return;
+  resetGame();
+  cancelAnimationFrame(animationFrameId);
+  animationFrameId = requestAnimationFrame(update);
+}
+
+function gameOver() {
+  running = false;
+  cancelAnimationFrame(animationFrameId);
+  highScore = Math.max(highScore, score);
+  highScoreEl.textContent = highScore;
+  localStorage.setItem("pixel-runner-high-score", String(highScore));
+  drawGameOver();
+}
+
+function drawGameOver() {
+  draw();
+  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
+  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
+  ctx.fillStyle = "#ffffff";
+  ctx.font = "12px 'Press Start 2P', monospace";
+  ctx.textAlign = "center";
+  ctx.fillText("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);
+  ctx.fillText("Pressione espaço", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
+}
+
+function randomRange(min, max) {
+  return Math.random() * (max - min) + min;
+}
+
+function init() {
+  highScoreEl.textContent = highScore;
+  drawGameOver();
+}
+
+function handleKeyDown(event) {
+  if (event.code === "Space" || event.code === "ArrowUp") {
+    event.preventDefault();
+    if (!running) {
+      handleStart();
+    } else {
+      jump();
+    }
+  }
+}
+
+function handlePointer() {
+  if (!running) {
+    handleStart();
+  } else {
+    jump();
+  }
+}
+
+document.addEventListener("keydown", handleKeyDown);
+canvas.addEventListener("pointerdown", handlePointer);
+startBtn.addEventListener("click", handleStart);
+
+init();
