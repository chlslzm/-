const GameState = {
    START: 'start',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

const game = {
    state: GameState.START,
    score: 0,
    speed: 6,
    groundHeight: 30
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const dino = {
    x: 50,
    y: canvas.height - game.groundHeight,
    width: 40,
    height: 50,
    jumping: false,
    jumpForce: 15,
    gravity: 0.6,
    velocityY: 0
};

let obstacles = [];
let animationFrameId;
let groundX = 0;

function drawDino() {
    ctx.fillStyle = '#535353';
    ctx.fillRect(dino.x, dino.y - dino.height, dino.width, dino.height);
}

function drawGround() {
    ctx.fillStyle = '#535353';
    ctx.fillRect(0, canvas.height - game.groundHeight, canvas.width, game.groundHeight);

    // Draw ground pattern
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - game.groundHeight);
    ctx.lineTo(canvas.width, canvas.height - game.groundHeight);
    ctx.stroke();
}

function createObstacle() {
    return {
        x: canvas.width,
        y: canvas.height - game.groundHeight,
        width: 20,
        height: 40
    };
}

function drawObstacles() {
    ctx.fillStyle = '#535353';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y - obstacle.height, obstacle.width, obstacle.height);
    });
}

function updateObstacles() {
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 300) {
        obstacles.push(createObstacle());
    }

    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
    obstacles.forEach(obstacle => {
        obstacle.x -= game.speed;
    });
}

function checkCollision(dino, obstacle) {
    return dino.x < obstacle.x + obstacle.width &&
           dino.x + dino.width > obstacle.x &&
           dino.y - dino.height < obstacle.y &&
           dino.y > obstacle.y - obstacle.height;
}

function updateDino() {
    if (dino.jumping) {
        dino.velocityY += dino.gravity;
        dino.y += dino.velocityY;

        if (dino.y > canvas.height - game.groundHeight) {
            dino.y = canvas.height - game.groundHeight;
            dino.jumping = false;
            dino.velocityY = 0;
        }
    }
}

function jump() {
    if (!dino.jumping) {
        dino.jumping = true;
        dino.velocityY = -dino.jumpForce;
    }
}

function updateScore() {
    game.score++;
    document.getElementById('score').textContent = Math.floor(game.score / 10);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();
    drawDino();
    drawObstacles();
}

function gameLoop() {
    if (game.state === GameState.PLAYING) {
        updateDino();
        updateObstacles();
        updateScore();

        for (const obstacle of obstacles) {
            if (checkCollision(dino, obstacle)) {
                game.state = GameState.GAME_OVER;
                document.getElementById('finalScore').textContent = `점수: ${Math.floor(game.score / 10)}`;
                document.getElementById('gameOverScreen').classList.remove('hidden');
                document.getElementById('gameContainer').classList.add('hidden');
                return;
            }
        }

        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    game.state = GameState.PLAYING;
    game.score = 0;
    obstacles = [];
    dino.y = canvas.height - game.groundHeight;
    dino.jumping = false;
    dino.velocityY = 0;
    document.getElementById('score').textContent = '0';
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    gameLoop();
}

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartGameButton').addEventListener('click', startGame);

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && game.state === GameState.PLAYING) {
        event.preventDefault();
        jump();
    }
});

document.getElementById('pauseButton').addEventListener('click', () => {
    if (game.state === GameState.PLAYING) {
        game.state = GameState.PAUSED;
        cancelAnimationFrame(animationFrameId);
        document.getElementById('pauseScreen').classList.remove('hidden');
    }
});

document.getElementById('resumeButton').addEventListener('click', () => {
    if (game.state === GameState.PAUSED) {
        game.state = GameState.PLAYING;
        document.getElementById('pauseScreen').classList.add('hidden');
        gameLoop();
    }
});

document.getElementById('restartButton').addEventListener('click', startGame);