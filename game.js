const GameState = {
    START: 'start',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

const game = {
    state: GameState.START,
    score: 0,
    speed: 3,  // 초기 속도를 40% 낮게 설정
    groundHeight: 30,
    backgroundX: 0,
    speedMultiplier: 1.0005  // 속도 증가 계수 추가
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sonicImage = new Image();
sonicImage.src = 'sonic.svg';

const sonic = {
    x: 50,
    y: canvas.height - game.groundHeight,
    width: 50,
    height: 50,
    jumping: false,
    jumpForce: 15,  // 장애물을 넘을 수 있는 높이로 조정
    gravity: 0.8,
    velocityY: 0,
    velocityX: 0,
    maxSpeed: 12,
    acceleration: 0.5,
    isRunning: false,
    frame: 0,
    frameCount: 0,
    direction: 1,
    color: '#0000FF'  // 파란색으로 설정
};

let obstacles = [];
let fruits = [];
let animationFrameId;
let groundX = 0;

const fruitTypes = [
    { type: 'watermelon', score: 50, color: '#228B22', size: 25, seedColor: '#000000' },
    { type: 'grape', score: 30, color: '#6B2C91', size: 15, seedColor: '#FFFFFF' },
    { type: 'banana', score: 20, color: '#FFE135', size: 20, seedColor: '#8B4513' },
    { type: 'orange', score: 40, color: '#FFA500', size: 20, seedColor: '#FF7F00' },
    { type: 'avocado', score: 60, color: '#568203', size: 22, seedColor: '#8B4513' }
];

function drawSonic() {
    ctx.save();
    ctx.translate(sonic.x + sonic.width/2, sonic.y - sonic.height/2);
    
    if (sonic.isRunning) {
        sonic.frameCount++;
        if (sonic.frameCount >= 5) {
            sonic.frame = (sonic.frame + 1) % 4;
            sonic.frameCount = 0;
        }
        ctx.rotate(Math.sin(sonic.frame * Math.PI / 2) * 0.1);
    }
    
    if (sonic.jumping) {
        ctx.rotate(sonic.velocityY * 0.05);
    }
    
    ctx.scale(sonic.direction, 1);
    
    // 딸기 본체 그리기 (빨간색)
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(-sonic.width/4, 0, sonic.width/3, 0, Math.PI * 2);
    ctx.fill();
    
    // 딸기 씨앗 그리기 (노란색 점)
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const seedX = -sonic.width/4 + Math.cos(angle) * (sonic.width/5);
        const seedY = Math.sin(angle) * (sonic.width/5);
        ctx.beginPath();
        ctx.arc(seedX, seedY, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 딸기 꼭지 그리기 (초록색)
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(-sonic.width/4 - 10, -sonic.width/3);
    ctx.lineTo(-sonic.width/4 + 10, -sonic.width/3);
    ctx.lineTo(-sonic.width/4, -sonic.width/3 - 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function drawGround() {
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - game.groundHeight, canvas.width, game.groundHeight);

    // Draw ground pattern
    ctx.strokeStyle = '#1E6B1E';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - game.groundHeight);
    ctx.lineTo(canvas.width, canvas.height - game.groundHeight);
    ctx.stroke();
}

function drawBackground() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height - game.groundHeight);
    
    // Draw moving clouds
    game.backgroundX -= game.speed * 0.2;
    if (game.backgroundX <= -canvas.width) game.backgroundX = 0;
    
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 3; i++) {
        let cloudX = ((game.backgroundX + i * 300) % canvas.width);
        ctx.beginPath();
        ctx.arc(cloudX, 50, 20, 0, Math.PI * 2);
        ctx.arc(cloudX + 20, 50, 25, 0, Math.PI * 2);
        ctx.arc(cloudX + 40, 50, 20, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createObstacle() {
    return {
        x: canvas.width,
        y: canvas.height - game.groundHeight,
        width: Math.random() * 20 + 15,  // 15~35 사이의 랜덤한 너비
        height: Math.random() * 40 + 30  // 30~70 사이의 랜덤한 높이
    };
}

function createFruit() {
    const fruit = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
    // 장애물과 겹치지 않는 높이 계산
    const maxObstacleHeight = obstacles.length > 0 ? 
        Math.max(...obstacles.map(o => o.height)) : 70;
    const minHeight = maxObstacleHeight + 20; // 장애물 위 20픽셀 여유
    const maxHeight = canvas.height - game.groundHeight - 150;
    return {
        x: canvas.width,
        y: canvas.height - game.groundHeight - Math.max(minHeight, Math.random() * (maxHeight - minHeight)),
        type: fruit.type,
        score: fruit.score,
        color: fruit.color,
        size: fruit.size,
        seedColor: fruit.seedColor,
        collected: false
    };
}

function drawObstacles() {
    ctx.fillStyle = '#228B22';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y - obstacle.height, obstacle.width, obstacle.height);
    });
}

function drawFruits() {
    fruits.forEach(fruit => {
        if (!fruit.collected) {
            ctx.save();
            ctx.translate(fruit.x, fruit.y);

            // 과일 본체 그리기
            ctx.fillStyle = fruit.color;
            ctx.beginPath();
            ctx.arc(0, 0, fruit.size, 0, Math.PI * 2);
            ctx.fill();

            // 과일별 특징 그리기
            switch(fruit.type) {
                case 'watermelon':
                    // 수박 씨 그리기
                    ctx.fillStyle = fruit.seedColor;
                    for(let i = 0; i < 5; i++) {
                        const angle = (i / 5) * Math.PI * 2;
                        const seedX = Math.cos(angle) * (fruit.size/2);
                        const seedY = Math.sin(angle) * (fruit.size/2);
                        ctx.beginPath();
                        ctx.ellipse(seedX, seedY, 3, 1.5, angle, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                case 'grape':
                    // 포도 알맹이 효과
                    ctx.fillStyle = fruit.seedColor;
                    ctx.beginPath();
                    ctx.arc(0, -fruit.size/3, 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'banana':
                    // 바나나 곡선 효과
                    ctx.strokeStyle = fruit.seedColor;
                    ctx.beginPath();
                    ctx.arc(0, 0, fruit.size/2, 0.2, Math.PI - 0.2);
                    ctx.stroke();
                    break;
                case 'orange':
                    // 오렌지 무늬
                    ctx.strokeStyle = fruit.seedColor;
                    ctx.beginPath();
                    ctx.arc(0, 0, fruit.size/1.5, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'avocado':
                    // 아보카도 씨
                    ctx.fillStyle = fruit.seedColor;
                    ctx.beginPath();
                    ctx.arc(0, 0, fruit.size/2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
            ctx.restore();
        }
    });
}

function updateObstacles() {
    const minGap = 300;  // 최소 간격
    const randomGap = Math.random() * 400;  // 0~400 사이의 추가 랜덤 간격
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - (minGap + randomGap)) {
        obstacles.push(createObstacle());
    }

    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
    obstacles.forEach(obstacle => {
        obstacle.x -= game.speed;
    });
}

function updateFruits() {
    if (fruits.length === 0 || fruits[fruits.length - 1].x < canvas.width - 200) {
        fruits.push(createFruit());
    }

    fruits = fruits.filter(fruit => fruit.x + fruit.size > 0);
    fruits.forEach(fruit => {
        fruit.x -= game.speed;
    });
}

function checkCollision(sonic, obstacle) {
    const sonicRadius = sonic.width / 2;
    const sonicCenterX = sonic.x + sonicRadius;
    const sonicCenterY = sonic.y - sonicRadius;
    
    return sonicCenterX + sonicRadius > obstacle.x &&
           sonicCenterX - sonicRadius < obstacle.x + obstacle.width &&
           sonicCenterY + sonicRadius > obstacle.y - obstacle.height &&
           sonicCenterY - sonicRadius < obstacle.y;
}

function checkFruitCollection(sonic, fruit) {
    if (fruit.collected) return false;
    
    const sonicCenterX = sonic.x + sonic.width/2;
    const sonicCenterY = sonic.y - sonic.height/2;
    const distance = Math.sqrt(
        Math.pow(sonicCenterX - fruit.x, 2) +
        Math.pow(sonicCenterY - fruit.y, 2)
    );
    
    return distance < (sonic.width/2 + fruit.size);
}

function updateSonic() {
    if (sonic.jumping) {
        sonic.velocityY += sonic.gravity;
        sonic.y += sonic.velocityY;

        if (sonic.y > canvas.height - game.groundHeight) {
            sonic.y = canvas.height - game.groundHeight;
            sonic.jumping = false;
            sonic.velocityY = 0;
        }
    }

    if (sonic.isRunning) {
        sonic.velocityX = Math.min(sonic.velocityX + sonic.acceleration, sonic.maxSpeed);
        game.speed = 8 + sonic.velocityX;
    } else {
        sonic.velocityX = Math.max(sonic.velocityX - sonic.acceleration, 0);
        game.speed = 8 + sonic.velocityX;
    }
}

function jump() {
    if (!sonic.jumping) {
        sonic.jumping = true;
        sonic.velocityY = -sonic.jumpForce;
    }
}

function updateScore() {
    game.score++;
    // 점수에 따라 게임 속도 증가
    game.speed *= game.speedMultiplier;
    document.getElementById('score').textContent = Math.floor(game.score / 10);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawGround();
    drawSonic();
    drawObstacles();
    drawFruits();
}

function gameLoop() {
    if (game.state === GameState.PLAYING) {
        updateSonic();
        updateObstacles();
        updateFruits();
        updateScore();

        // Check fruit collections
        fruits.forEach(fruit => {
            if (!fruit.collected && checkFruitCollection(sonic, fruit)) {
                fruit.collected = true;
                game.score += fruit.score;
            }
        });

        // Check obstacle collisions
        for (const obstacle of obstacles) {
            if (checkCollision(sonic, obstacle)) {
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
    game.speed = 5;  // 초기 속도 재설정
    obstacles = [];
    fruits = [];
    sonic.y = canvas.height - game.groundHeight;
    sonic.jumping = false;
    sonic.velocityY = 0;
    sonic.velocityX = 0;
    sonic.isRunning = false;
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
    } else if (event.code === 'ShiftLeft' && game.state === GameState.PLAYING) {
        sonic.isRunning = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'ShiftLeft' && game.state === GameState.PLAYING) {
        sonic.isRunning = false;
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