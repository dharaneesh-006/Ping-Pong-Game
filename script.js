// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAJhx7zJPHT-otg-MwbYwzW0nZ4Qdp8IPg",
  authDomain: "ping-pong-6206f.firebaseapp.com",
  databaseURL: "https://ping-pong-6206f-default-rtdb.firebaseio.com",
  projectId: "ping-pong-6206f",
  storageBucket: "ping-pong-6206f.firebasestorage.app",
  messagingSenderId: "602425829782",
  appId: "1:602425829782:web:126f9c9a415a0d8d5e15b7",
  measurementId: "G-S9NHZL3LDC"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const paddle = document.getElementById("player-tracker");
const ball = document.getElementById("ball");
const scoreText = document.getElementById("score");
const leaderboard = document.getElementById("leaderboard");

let ballX, ballY, ballVX = 3, ballVY = 3;
let score = 0;
let interval;
let playerName = "";

// Load player name from cache on load
window.addEventListener("DOMContentLoaded", () => {
  const cachedName = localStorage.getItem("playerName");
  if (cachedName) {
    document.getElementById("player-name").value = cachedName;
    document.getElementById("plyr-name").textContent = `Player: ${cachedName}`;
  }
});

// Move paddle logic (shared for mouse and touch)
function movePaddle(xPosition) {
  const game = document.getElementById("game");
  const gameRect = game.getBoundingClientRect();
  const paddleWidth = paddle.offsetWidth;
  let x = xPosition - gameRect.left - paddleWidth / 2;
  x = Math.max(0, Math.min(x, game.offsetWidth - paddleWidth));
  paddle.style.left = `${x}px`;
}

// Mouse move
document.addEventListener("mousemove", (e) => movePaddle(e.clientX));

// Touch move
document.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  movePaddle(touch.clientX);
});

// Start the game
function startGame() {
  playerName = document.getElementById("player-name").value.trim();

  if (!playerName) {
    alert("Please enter your name!");
    return;
  }

  // Check for forbidden name (case insensitive)
  if (playerName.toLowerCase().includes("dharaneesh")) {
    alert("Invalid name. Please enter a different name.");
    return;
  }

  // Cache the name
  localStorage.setItem("playerName", playerName);
  document.getElementById("plyr-name").textContent = `Player: ${playerName}`;

  score = 0;
  scoreText.textContent = `Score: ${score}`;

  const game = document.getElementById("game");
  const gameWidth = game.offsetWidth;
  ballX = (gameWidth - 32) / 2;
  ballY = 100;
  ballVX = 3 + Math.random() * 2;
  ballVY = 3 + Math.random() * 2;

  if (interval) clearInterval(interval);
  interval = setInterval(gameLoop, 16);
}


// Main game loop
function gameLoop() {
  ballX += ballVX;
  ballY += ballVY;

  const game = document.getElementById("game");
  const gameRect = game.getBoundingClientRect();
  const paddleRect = paddle.getBoundingClientRect();

  const paddleX = paddleRect.left - gameRect.left;
  const paddleY = paddleRect.top - gameRect.top;
  const paddleWidth = paddle.offsetWidth;
  const paddleHeight = paddle.offsetHeight;

  const ballSize = 32;

  // Wall collision
  if (ballX <= 0 || ballX >= game.offsetWidth - ballSize) ballVX *= -1;
  if (ballY <= 0) ballVY *= -1;

  // Paddle collision
  const ballBottom = ballY + ballSize;
  const paddleTop = game.offsetHeight - paddleHeight - 10;

  if (
    ballVY > 0 &&
    ballBottom >= paddleTop &&
    ballBottom <= paddleTop + 10 &&
    ballX + ballSize / 2 >= paddleX &&
    ballX + ballSize / 2 <= paddleX + paddleWidth
  ) {
    ballVY *= -1;
    score++;
    scoreText.textContent = `Score: ${score}`;

    // ✅ Gradually increase speed after each hit
    ballVX *= 1.03;
    ballVY *= 1.03;
  }

  // Missed paddle
  if (ballY > game.offsetHeight) {
    clearInterval(interval);
    updateLeaderboard(playerName, score);
    alert("Game Over! Your Score: " + score);
  }

  // Render ball
  ball.style.left = `${ballX}px`;
  ball.style.top = `${ballY}px`;
}

// Firebase leaderboard
function updateLeaderboard(name, newScore) {
  const ref = db.ref('leaderboard/' + name);
  ref.once('value').then(snapshot => {
    const prevScore = snapshot.val();
    if (!prevScore || newScore > prevScore) {
      ref.set(newScore);
    }
  });
}

// Leaderboard fetch
function fetchLeaderboard() {
  db.ref('leaderboard').orderByValue().limitToLast(10).on('value', snapshot => {
    const scores = [];
    snapshot.forEach(child => {
      scores.push({ name: child.key, score: child.val() });
    });

    leaderboard.innerHTML = scores
      .sort((a, b) => b.score - a.score)
      .map(player => `<li>${player.name}: ${player.score}</li>`)
      .join('');
  });
}

fetchLeaderboard();
