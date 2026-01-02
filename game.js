// ===== GAME CONFIGURATION =====

// Fixed game logic - same for all players
const GAME_LOGIC = {
    GRID_COLS: 90,              // Fixed logical grid width
    GRID_ROWS: 160,             // Fixed logical grid height
    CELLS_PER_SECOND: 30,       // Movement speed (cells per second)
    GAME_DURATION: 120,         // 2 minutes in seconds
    MAX_PLAYERS: 6,
    COLORS: [
        '#FF4444', // Red
        '#4444FF', // Blue
        '#44FF44', // Green
        '#FFFF44', // Yellow
        '#FF44FF', // Purple
        '#FF8844'  // Orange
    ]
};

// Canvas size constraints
const CANVAS_CONSTRAINTS = {
    MIN_WIDTH: 280,
    MAX_WIDTH: 1200,
    MIN_HEIGHT: 400,
    MAX_HEIGHT: 1600,
    HEADER_HEIGHT: 60,
    CONTROLS_HEIGHT: 100
};

// Dynamic display settings - calculated per device
let DISPLAY = {
    canvasWidth: 360,
    canvasHeight: 640,
    cellSize: 4,
    pixelRatio: 1,
    performanceTier: 'medium'
};

// Legacy CONFIG for backward compatibility during transition
const CONFIG = {
    get CANVAS_WIDTH() { return DISPLAY.canvasWidth; },
    get CANVAS_HEIGHT() { return DISPLAY.canvasHeight; },
    get CELL_SIZE() { return DISPLAY.cellSize; },
    BRUSH_SPEED: 2,
    GAME_DURATION: GAME_LOGIC.GAME_DURATION,
    MAX_PLAYERS: GAME_LOGIC.MAX_PLAYERS,
    COLORS: GAME_LOGIC.COLORS
};

// ===== GLOBAL STATE =====
let gun;
let roomRef;
let gameState = {
    roomCode: null,
    playerId: null,
    playerName: null,
    isHost: false,
    players: {},
    gameStarted: false,
    gameEnded: false,
    timeRemaining: CONFIG.GAME_DURATION
};

let canvas, ctx;
let grid = [];
let animationId;
let lastUpdateTime = 0;
let timerInterval;

// Rotation state
let rotationState = {
    isRotatingLeft: false,
    isRotatingRight: false,
    rotationSpeed: 180 // degrees per second
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeGun();
    detectPerformanceTier();
    calculateCanvasSize();
    setupEventListeners();
    setupCanvas();
    setupKeyboardControls();
    setupResizeHandler();
});

function initializeGun() {
    // Initialize GunDB with public relay peers
    // gun = GUN(['https://gun-manhattan.herokuapp.com/gun', 'https://gun-us.herokuapp.com/gun']);
//   gun = Gun(['http://localhost:8765/gun']);
  gun = Gun(['https://gundb.onrender.com/gun']);

    console.log('GunDB initialized');
}

function setupCanvas() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size based on calculated dimensions
    canvas.width = DISPLAY.canvasWidth;
    canvas.height = DISPLAY.canvasHeight;
    
    // Apply pixel ratio for crisp rendering on high-DPI displays
    if (DISPLAY.pixelRatio > 1) {
        canvas.style.width = DISPLAY.canvasWidth + 'px';
        canvas.style.height = DISPLAY.canvasHeight + 'px';
        canvas.width = DISPLAY.canvasWidth * DISPLAY.pixelRatio;
        canvas.height = DISPLAY.canvasHeight * DISPLAY.pixelRatio;
        ctx.scale(DISPLAY.pixelRatio, DISPLAY.pixelRatio);
    }
    
    // Initialize grid based on FIXED logical dimensions
    for (let y = 0; y < GAME_LOGIC.GRID_ROWS; y++) {
        grid[y] = [];
        for (let x = 0; x < GAME_LOGIC.GRID_COLS; x++) {
            grid[y][x] = null; // null means unpainted
        }
    }
    
    console.log(`Canvas initialized: ${DISPLAY.canvasWidth}x${DISPLAY.canvasHeight}, Grid: ${GAME_LOGIC.GRID_COLS}x${GAME_LOGIC.GRID_ROWS}`);
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Lobby buttons
    document.getElementById('create-room-btn').addEventListener('click', createRoom);
    document.getElementById('join-room-btn').addEventListener('click', showJoinRoom);
    document.getElementById('back-btn').addEventListener('click', showLobbyOptions);
    document.getElementById('join-btn').addEventListener('click', joinRoom);
    document.getElementById('copy-code-btn').addEventListener('click', copyRoomCode);
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    
    // Game controls - Hold to rotate
    const leftBtn = document.getElementById('turn-left-btn');
    const rightBtn = document.getElementById('turn-right-btn');
    
    // Mouse events
    leftBtn.addEventListener('mousedown', () => startRotating('left'));
    leftBtn.addEventListener('mouseup', () => stopRotating('left'));
    leftBtn.addEventListener('mouseleave', () => stopRotating('left'));
    
    rightBtn.addEventListener('mousedown', () => startRotating('right'));
    rightBtn.addEventListener('mouseup', () => stopRotating('right'));
    rightBtn.addEventListener('mouseleave', () => stopRotating('right'));
    
    // Touch events for mobile
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startRotating('left');
    });
    leftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopRotating('left');
    });
    leftBtn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        stopRotating('left');
    });
    
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startRotating('right');
    });
    rightBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopRotating('right');
    });
    rightBtn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        stopRotating('right');
    });
    
    // Results buttons
    document.getElementById('play-again-btn').addEventListener('click', playAgain);
    document.getElementById('leave-room-btn').addEventListener('click', leaveRoom);
}

function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (!gameState.gameStarted || gameState.gameEnded) return;
        
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            if (!rotationState.isRotatingLeft) {
                startRotating('left');
            }
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            if (!rotationState.isRotatingRight) {
                startRotating('right');
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (!gameState.gameStarted || gameState.gameEnded) return;
        
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            stopRotating('left');
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            stopRotating('right');
        }
    });
}

function startRotating(direction) {
    if (!gameState.gameStarted || gameState.gameEnded) return;
    
    if (direction === 'left') {
        rotationState.isRotatingLeft = true;
    } else if (direction === 'right') {
        rotationState.isRotatingRight = true;
    }
}

function stopRotating(direction) {
    if (direction === 'left') {
        rotationState.isRotatingLeft = false;
    } else if (direction === 'right') {
        rotationState.isRotatingRight = false;
    }
}

// ===== ROOM MANAGEMENT =====
function createRoom() {
    const roomCode = generateRoomCode();
    gameState.roomCode = roomCode;
    gameState.isHost = true;
    gameState.playerId = generatePlayerId();
    gameState.playerName = 'Player 1';
    
    // Initialize room in GunDB
    roomRef = gun.get('inkwar-rooms').get(roomCode);
    
    // Set up room data
    roomRef.put({
        host: gameState.playerId,
        gameStarted: false,
        gameEnded: false,
        timeRemaining: CONFIG.GAME_DURATION,
        createdAt: Date.now()
    });
    
    // Add host as first player
    addPlayerToRoom(gameState.playerId, gameState.playerName, 0);
    
    // Show room code section
    document.getElementById('room-code').textContent = roomCode;
    document.querySelector('.lobby-options').classList.add('hidden');
    document.getElementById('room-code-section').classList.remove('hidden');
    document.getElementById('start-game-btn').classList.remove('hidden');
    
    // Listen for players joining
    listenForPlayers();
    
    // Listen for game start (host needs this too!)
    listenForGameStart();
}

function showJoinRoom() {
    document.querySelector('.lobby-options').classList.add('hidden');
    document.getElementById('join-room-section').classList.remove('hidden');
}

function showLobbyOptions() {
    document.getElementById('join-room-section').classList.add('hidden');
    document.querySelector('.lobby-options').classList.remove('hidden');
}

function joinRoom() {
    const roomCode = document.getElementById('room-code-input').value.toUpperCase().trim();
    const playerName = document.getElementById('player-name-input').value.trim() || 'Player';
    
    if (roomCode.length !== 6) {
        alert('Please enter a valid 6-character room code');
        return;
    }
    
    gameState.roomCode = roomCode;
    gameState.playerId = generatePlayerId();
    gameState.playerName = playerName;
    gameState.isHost = false;
    
    // Check if room exists
    roomRef = gun.get('inkwar-rooms').get(roomCode);
    
    showLoading();
    
    roomRef.once((data) => {
        hideLoading();
        
        if (!data) {
            alert('Room not found. Please check the code.');
            return;
        }
        
        if (data.gameStarted) {
            alert('Game already in progress. Cannot join.');
            return;
        }
        
        // Count existing players
        roomRef.get('players').once((players) => {
            const playerCount = players ? Object.keys(players).length : 0;
            
            if (playerCount >= CONFIG.MAX_PLAYERS) {
                alert('Room is full (max 6 players)');
                return;
            }
            
            // Add player to room
            addPlayerToRoom(gameState.playerId, playerName, playerCount);
            
            // Switch to waiting screen
            document.getElementById('lobby-screen').classList.remove('active');
            document.getElementById('room-code-section').classList.remove('hidden');
            document.getElementById('join-room-section').classList.add('hidden');
            document.getElementById('room-code').textContent = roomCode;
            document.getElementById('lobby-screen').classList.add('active');
            document.querySelector('.lobby-options').classList.add('hidden');
            
            // Listen for game start
            listenForPlayers();
            listenForGameStart();
        });
    });
}

function addPlayerToRoom(playerId, playerName, colorIndex) {
    const playerData = {
        id: playerId,
        name: playerName,
        color: GAME_LOGIC.COLORS[colorIndex % GAME_LOGIC.COLORS.length],
        colorIndex: colorIndex,
        x: Math.floor(Math.random() * GAME_LOGIC.GRID_COLS),
        y: Math.floor(Math.random() * GAME_LOGIC.GRID_ROWS),
        angle: Math.random() * 360 // Random angle in degrees (0-360)
    };
    
    roomRef.get('players').get(playerId).put(playerData);
    gameState.players[playerId] = playerData;
    
    updatePlayerList();
}

function listenForPlayers() {
    roomRef.get('players').map().on((player, playerId) => {
        if (player && playerId) {
            gameState.players[playerId] = player;
            updatePlayerList();
        }
    });
}

function listenForGameStart() {
    roomRef.on((data) => {
        if (data && data.gameStarted && !gameState.gameStarted) {
            gameState.gameStarted = true;
            gameState.timeRemaining = data.timeRemaining || CONFIG.GAME_DURATION;
            startGameplay();
        }
        
        if (data && data.gameEnded && !gameState.gameEnded) {
            gameState.gameEnded = true;
            endGame();
        }
        
        if (data && typeof data.timeRemaining === 'number') {
            gameState.timeRemaining = data.timeRemaining;
        }
    });
}

function updatePlayerList() {
    const container = document.getElementById('players-container');
    const playerCount = document.getElementById('player-count');
    
    container.innerHTML = '';
    const players = Object.values(gameState.players);
    playerCount.textContent = players.length;
    
    players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-item';
        item.style.borderLeftColor = player.color;
        
        item.innerHTML = `
            <div class="player-color" style="background-color: ${player.color}"></div>
            <div class="player-name">${player.name}</div>
        `;
        
        container.appendChild(item);
    });
}

function copyRoomCode() {
    const code = gameState.roomCode;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('copy-code-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = 'Copy';
        }, 2000);
    });
}

// ===== GAME LOGIC =====
function startGame() {
    if (Object.keys(gameState.players).length < 2) {
        alert('Need at least 2 players to start');
        return;
    }
    
    // Update room state
    roomRef.put({
        gameStarted: true,
        gameEnded: false,
        timeRemaining: CONFIG.GAME_DURATION,
        startTime: Date.now()
    });
}

function startGameplay() {
    // Switch to game screen
    document.getElementById('lobby-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    
    // Initialize scores display
    updateScoresDisplay();
    
    // Start game loop
    gameLoop();
    
    // Start timer
    startTimer();
    
    // Listen for player position updates
    listenForPositionUpdates();
}

function gameLoop(timestamp = 0) {
    if (gameState.gameEnded) return;
    
    const deltaTime = timestamp - lastUpdateTime;
    
    if (deltaTime >= 1000 / 30) { // 30 FPS
        updatePlayerPositions();
        render();
        lastUpdateTime = timestamp;
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

function updatePlayerPositions() {
    const myPlayer = gameState.players[gameState.playerId];
    if (!myPlayer) return;
    
    // Apply rotation if buttons are held
    const deltaTime = 1 / 30; // 30 FPS
    if (rotationState.isRotatingLeft) {
        myPlayer.angle -= rotationState.rotationSpeed * deltaTime;
    }
    if (rotationState.isRotatingRight) {
        myPlayer.angle += rotationState.rotationSpeed * deltaTime;
    }
    
    // Normalize angle to 0-360 range
    myPlayer.angle = ((myPlayer.angle % 360) + 360) % 360;
    
    // Convert angle to radians for trigonometry
    const angleRad = (myPlayer.angle * Math.PI) / 180;
    
    // Move player forward based on angle
    // Note: 0° = right, 90° = down, 180° = left, 270° = up (standard math convention)
    // Adjust to game convention: 0° = up, 90° = right, 180° = down, 270° = left
    const gameAngleRad = angleRad - Math.PI / 2;
    
    myPlayer.x += Math.cos(gameAngleRad);
    myPlayer.y += Math.sin(gameAngleRad);
    
    // Wrap around edges using logical grid dimensions
    if (myPlayer.x < 0) myPlayer.x = GAME_LOGIC.GRID_COLS - 1;
    if (myPlayer.x >= GAME_LOGIC.GRID_COLS) myPlayer.x = 0;
    if (myPlayer.y < 0) myPlayer.y = GAME_LOGIC.GRID_ROWS - 1;
    if (myPlayer.y >= GAME_LOGIC.GRID_ROWS) myPlayer.y = 0;
    
    // Paint current cell (use floor to get integer grid position)
    const gridX = Math.floor(myPlayer.x);
    const gridY = Math.floor(myPlayer.y);
    
    if (gridY >= 0 && gridY < GAME_LOGIC.GRID_ROWS && 
        gridX >= 0 && gridX < GAME_LOGIC.GRID_COLS) {
        grid[gridY][gridX] = myPlayer.colorIndex;
    }
    
    // Update position in GunDB
    roomRef.get('players').get(gameState.playerId).put({
        x: myPlayer.x,
        y: myPlayer.y,
        angle: myPlayer.angle
    });
    
    // Update grid in GunDB (throttled)
    if (Math.random() < 0.1) { // Only sync 10% of the time to reduce load
        syncGridCell(gridX, gridY, myPlayer.colorIndex);
    }
}

function listenForPositionUpdates() {
    roomRef.get('players').map().on((player, playerId) => {
        if (player && playerId && playerId !== gameState.playerId) {
            if (!gameState.players[playerId]) {
                gameState.players[playerId] = player;
            } else {
                gameState.players[playerId].x = player.x;
                gameState.players[playerId].y = player.y;
                gameState.players[playerId].angle = player.angle || 0;
            }
            
            // Paint cell for remote player using logical grid
            const gridX = Math.floor(player.x);
            const gridY = Math.floor(player.y);
            if (gridY >= 0 && gridY < GAME_LOGIC.GRID_ROWS && 
                gridX >= 0 && gridX < GAME_LOGIC.GRID_COLS) {
                grid[gridY][gridX] = player.colorIndex;
            }
        }
    });
    
    // Listen for grid updates
    roomRef.get('grid').map().on((cell, key) => {
        if (cell && key) {
            const [x, y] = key.split('_').map(Number);
            if (y >= 0 && y < GAME_LOGIC.GRID_ROWS && 
                x >= 0 && x < GAME_LOGIC.GRID_COLS) {
                grid[y][x] = cell.colorIndex;
            }
        }
    });
}

function syncGridCell(x, y, colorIndex) {
    roomRef.get('grid').get(`${x}_${y}`).put({ colorIndex });
}

function turnBrush(direction) {
    if (!gameState.gameStarted || gameState.gameEnded) return;
    
    const myPlayer = gameState.players[gameState.playerId];
    if (!myPlayer) return;
    
    if (direction === 'left') {
        myPlayer.direction = (myPlayer.direction + 3) % 4; // Turn counter-clockwise
    } else if (direction === 'right') {
        myPlayer.direction = (myPlayer.direction + 1) % 4; // Turn clockwise
    }
    
    // Update in GunDB
    roomRef.get('players').get(gameState.playerId).get('direction').put(myPlayer.direction);
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#0f0f1e';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // Draw grid
    const rows = grid.length;
    const cols = grid[0].length;
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (grid[y][x] !== null) {
                ctx.fillStyle = CONFIG.COLORS[grid[y][x]];
                ctx.fillRect(
                    x * CONFIG.CELL_SIZE,
                    y * CONFIG.CELL_SIZE,
                    CONFIG.CELL_SIZE,
                    CONFIG.CELL_SIZE
                );
            }
        }
    }
    
    // Draw players (brushes)
    Object.values(gameState.players).forEach(player => {
        const px = player.x * CONFIG.CELL_SIZE;
        const py = player.y * CONFIG.CELL_SIZE;
        
        // Draw brush circle
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(
            px + CONFIG.CELL_SIZE / 2,
            py + CONFIG.CELL_SIZE / 2,
            CONFIG.CELL_SIZE * 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw direction indicator based on angle
        ctx.fillStyle = 'white';
        ctx.beginPath();
        const centerX = px + CONFIG.CELL_SIZE / 2;
        const centerY = py + CONFIG.CELL_SIZE / 2;
        const size = CONFIG.CELL_SIZE * 1.5;
        
        // Use angle if available, otherwise fall back to direction
        const angle = player.angle !== undefined ? player.angle : (player.direction || 0) * 90;
        const angleRad = (angle * Math.PI) / 180;
        const gameAngleRad = angleRad - Math.PI / 2;
        
        // Calculate arrow points
        const tipX = centerX + Math.cos(gameAngleRad) * size;
        const tipY = centerY + Math.sin(gameAngleRad) * size;
        const leftX = centerX + Math.cos(gameAngleRad + (2.5 * Math.PI / 3)) * (size / 2);
        const leftY = centerY + Math.sin(gameAngleRad + (2.5 * Math.PI / 3)) * (size / 2);
        const rightX = centerX + Math.cos(gameAngleRad - (2.5 * Math.PI / 3)) * (size / 2);
        const rightY = centerY + Math.sin(gameAngleRad - (2.5 * Math.PI / 3)) * (size / 2);
        
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(leftX, leftY);
        ctx.lineTo(rightX, rightY);
        ctx.closePath();
        ctx.fill();
    });
    
    // Update scores
    updateScoresDisplay();
}

function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        
        // Host updates timer in GunDB
        if (gameState.isHost) {
            roomRef.get('timeRemaining').put(gameState.timeRemaining);
        }
        
        updateTimerDisplay();
        
        if (gameState.timeRemaining <= 0) {
            clearInterval(timerInterval);
            if (gameState.isHost) {
                roomRef.put({ gameEnded: true });
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    document.getElementById('timer-display').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateScoresDisplay() {
    const scores = calculateScores();
    const container = document.getElementById('scores-container');
    
    container.innerHTML = '';
    
    Object.entries(scores).forEach(([colorIndex, percentage]) => {
        const item = document.createElement('div');
        item.className = 'score-item';
        item.innerHTML = `
            <div class="score-color" style="background-color: ${CONFIG.COLORS[colorIndex]}"></div>
            <div class="score-percentage">${percentage}%</div>
        `;
        container.appendChild(item);
    });
}

function calculateScores() {
    const scores = {};
    let totalPainted = 0;
    
    // Count painted cells per color
    grid.forEach(row => {
        row.forEach(cell => {
            if (cell !== null) {
                scores[cell] = (scores[cell] || 0) + 1;
                totalPainted++;
            }
        });
    });
    
    // Convert to percentages
    const percentages = {};
    Object.entries(scores).forEach(([colorIndex, count]) => {
        percentages[colorIndex] = totalPainted > 0 
            ? Math.round((count / totalPainted) * 100) 
            : 0;
    });
    
    return percentages;
}

function endGame() {
    gameState.gameEnded = true;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Calculate final scores
    const scores = calculateScores();
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    
    // Find winner
    const winnerColorIndex = sortedScores[0][0];
    const winnerPlayer = Object.values(gameState.players).find(
        p => p.colorIndex === parseInt(winnerColorIndex)
    );
    
    // Display results
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('results-screen').classList.add('active');
    
    document.getElementById('winner-display').innerHTML = 
        `🎉 ${winnerPlayer ? winnerPlayer.name : 'Player'} Wins! 🎉`;
    
    const finalScoresContainer = document.getElementById('final-scores');
    finalScoresContainer.innerHTML = '';
    
    sortedScores.forEach(([colorIndex, percentage]) => {
        const player = Object.values(gameState.players).find(
            p => p.colorIndex === parseInt(colorIndex)
        );
        
        const item = document.createElement('div');
        item.className = 'final-score-item';
        item.style.borderLeftColor = CONFIG.COLORS[colorIndex];
        item.innerHTML = `
            <div class="final-score-left">
                <div class="final-score-color" style="background-color: ${CONFIG.COLORS[colorIndex]}"></div>
                <div class="final-score-name">${player ? player.name : 'Player'}</div>
            </div>
            <div class="final-score-percentage">${percentage}%</div>
        `;
        finalScoresContainer.appendChild(item);
    });
}

function playAgain() {
    // Reset game state
    gameState.gameStarted = false;
    gameState.gameEnded = false;
    gameState.timeRemaining = CONFIG.GAME_DURATION;
    
    // Clear grid
    grid.forEach(row => row.fill(null));
    
    // Reset player positions using logical grid
    Object.values(gameState.players).forEach((player, index) => {
        player.x = Math.floor(Math.random() * GAME_LOGIC.GRID_COLS);
        player.y = Math.floor(Math.random() * GAME_LOGIC.GRID_ROWS);
        player.direction = Math.floor(Math.random() * 4);
    });
    
    if (gameState.isHost) {
        roomRef.put({
            gameStarted: false,
            gameEnded: false,
            timeRemaining: CONFIG.GAME_DURATION
        });
        
        // Clear grid in GunDB
        roomRef.get('grid').put(null);
    }
    
    // Return to lobby
    document.getElementById('results-screen').classList.remove('active');
    document.getElementById('lobby-screen').classList.add('active');
    document.getElementById('room-code-section').classList.remove('hidden');
    
    if (gameState.isHost) {
        document.getElementById('start-game-btn').classList.remove('hidden');
    }
}

function leaveRoom() {
    // Remove player from room
    if (roomRef && gameState.playerId) {
        roomRef.get('players').get(gameState.playerId).put(null);
    }
    
    // Reset state
    gameState = {
        roomCode: null,
        playerId: null,
        playerName: null,
        isHost: false,
        players: {},
        gameStarted: false,
        gameEnded: false,
        timeRemaining: CONFIG.GAME_DURATION
    };
    
    // Return to initial lobby
    document.getElementById('results-screen').classList.remove('active');
    document.getElementById('lobby-screen').classList.add('active');
    document.getElementById('room-code-section').classList.add('hidden');
    document.querySelector('.lobby-options').classList.remove('hidden');
}

// ===== RESPONSIVE CANVAS FUNCTIONS =====

function detectPerformanceTier() {
    // Detect device performance based on hardware concurrency and memory
    const cores = navigator.hardwareConcurrency || 2;
    const memory = navigator.deviceMemory || 4; // GB
    
    if (cores >= 8 && memory >= 8) {
        DISPLAY.performanceTier = 'high';
    } else if (cores >= 4 && memory >= 4) {
        DISPLAY.performanceTier = 'medium';
    } else {
        DISPLAY.performanceTier = 'low';
    }
    
    console.log(`Performance tier: ${DISPLAY.performanceTier} (cores: ${cores}, memory: ${memory}GB)`);
}

function calculateCanvasSize() {
    // Get viewport dimensions
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    
    // Calculate available space for canvas
    const availableWidth = Math.min(viewportWidth, CANVAS_CONSTRAINTS.MAX_WIDTH);
    const availableHeight = Math.min(
        viewportHeight - CANVAS_CONSTRAINTS.HEADER_HEIGHT - CANVAS_CONSTRAINTS.CONTROLS_HEIGHT,
        CANVAS_CONSTRAINTS.MAX_HEIGHT
    );
    
    // Calculate aspect ratio from logical grid
    const aspectRatio = GAME_LOGIC.GRID_COLS / GAME_LOGIC.GRID_ROWS;
    
    let canvasWidth, canvasHeight;
    
    // Fit canvas to available space while maintaining aspect ratio
    if (availableWidth / availableHeight > aspectRatio) {
        // Height constrained
        canvasHeight = Math.max(availableHeight, CANVAS_CONSTRAINTS.MIN_HEIGHT);
        canvasWidth = canvasHeight * aspectRatio;
    } else {
        // Width constrained
        canvasWidth = Math.max(availableWidth, CANVAS_CONSTRAINTS.MIN_WIDTH);
        canvasHeight = canvasWidth / aspectRatio;
    }
    
    // Ensure minimum constraints
    canvasWidth = Math.max(canvasWidth, CANVAS_CONSTRAINTS.MIN_WIDTH);
    canvasHeight = Math.max(canvasHeight, CANVAS_CONSTRAINTS.MIN_HEIGHT);
    
    // Update DISPLAY settings
    DISPLAY.canvasWidth = Math.floor(canvasWidth);
    DISPLAY.canvasHeight = Math.floor(canvasHeight);
    DISPLAY.cellSize = DISPLAY.canvasWidth / GAME_LOGIC.GRID_COLS;
    DISPLAY.pixelRatio = window.devicePixelRatio || 1;
    
    console.log(`Canvas size calculated: ${DISPLAY.canvasWidth}x${DISPLAY.canvasHeight}, cell size: ${DISPLAY.cellSize.toFixed(2)}px`);
}

function setupResizeHandler() {
    let resizeTimeout;
    
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Only recalculate if not in active gameplay
            if (!gameState.gameStarted || gameState.gameEnded) {
                calculateCanvasSize();
                if (canvas) {
                    canvas.width = DISPLAY.canvasWidth;
                    canvas.height = DISPLAY.canvasHeight;
                    
                    // Apply pixel ratio for crisp rendering
                    if (DISPLAY.pixelRatio > 1) {
                        canvas.style.width = DISPLAY.canvasWidth + 'px';
                        canvas.style.height = DISPLAY.canvasHeight + 'px';
                        canvas.width = DISPLAY.canvasWidth * DISPLAY.pixelRatio;
                        canvas.height = DISPLAY.canvasHeight * DISPLAY.pixelRatio;
                        ctx.scale(DISPLAY.pixelRatio, DISPLAY.pixelRatio);
                    }
                }
            }
        }, 250);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
}

// ===== UTILITY FUNCTIONS =====
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}
