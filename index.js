// Tetris with refined canvas UI and smoother movement
"use strict";

const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
context.scale(20, 20);

let showMenu = true;
let keyState = {};
let port, reader;

document.getElementById("connect").addEventListener("click", async () => {
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });

        reader = port.readable.getReader();
        readSerial(); // start reading
    } catch (err) {
        console.error("Serial connection failed", err);
    }
});

async function readSerial() {
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value).trim();

        switch (text) {
            case "LEFT": playerMove(-1); break;
            case "RIGHT": playerMove(1); break;
            case "DOWN": playerDrop(); break;
            case "ROTATE": playerRotate(1); break;
            case "DROP": instantDrop(); break;
        }
        moveInterval = 10; // Reset move interval after serial input
    }
}


function drawMenu() {
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "white";
    context.font = "1.5px Courier New";
    context.fillText("TETRIS", 4.8, 9);
    context.font = "0.8px Courier New";
    context.fillText("Press Enter to Start", 2.8, 12);
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 10;
        rowCount *= 2;
        playSound("line");
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'I') return [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]];
    if (type === 'L') return [[0, 0, 2], [2, 2, 2], [0, 0, 0]];
    if (type === 'J') return [[3, 0, 0], [3, 3, 3], [0, 0, 0]];
    if (type === 'O') return [[4, 4], [4, 4]];
    if (type === 'Z') return [[5, 5, 0], [0, 5, 5], [0, 0, 0]];
    if (type === 'S') return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
    if (type === 'T') return [[0, 7, 0], [7, 7, 7], [0, 0, 0]];
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
    drawResetButton();
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        playSound("drop");
    }
    dropCounter = 0;
}

function instantDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    playSound("drop");
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerReset() {
    const pieces = 'IJLOSTZ';
    player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
    player.pos.y = 0;
    player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        bestScore = Math.max(bestScore, player.score);
        localStorage.setItem("bestScore", bestScore.toString());
        player.score = 0;
        updateScore();
        playSound("reset");
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function drawResetButton() {
    context.fillStyle = "white";
    context.font = "0.8px Courier New";
    context.fillText("[R] Reset", 8.5, 1);
}

let dropCounter = 0;
let dropInterval = 1000;
let moveCounter = 0;
let moveInterval = 200;
let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    if (showMenu) {
        drawMenu();
        requestAnimationFrame(update);
        return;
    }

    dropCounter += deltaTime;
    moveCounter += deltaTime;
// arduino change 
    if (moveCounter > moveInterval) {
        if (keyState['a']) playerMove(-1);
        if (keyState['d']) playerMove(1);
        moveCounter = 0;
    }

    if (dropCounter > dropInterval) {
        playerDrop();
    }
    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById("score").innerText = `Score: ${player.score} | Best: ${bestScore}`;
}

function playSound(type) {
    const sounds = {
        drop: new Audio("./sounds/drop.wav"),
        line: new Audio("./sounds/line.wav"),
        reset: new Audio("./sounds/reset.wav")
    };
    if (sounds[type]) {
        sounds[type].currentTime = 0;
        sounds[type].play();
    }
}

// Controls

document.addEventListener("keydown", (event) => {
    if (showMenu && event.key === "Enter") {
        showMenu = false;
        playerReset();
        updateScore();
        return;
    }
    keyState[event.key.toLowerCase()] = true;
    switch (event.key.toLowerCase()) {
        case 's': playerDrop(); break;
        case 'w': playerRotate(1); break;
        case 'z': playerRotate(-1); break;
        case ' ': instantDrop(); break;
        case 'r':
            arena.forEach(row => row.fill(0));
            player.score = 0;
            playerReset();
            updateScore();
            break;
    }
});

document.addEventListener("keyup", (event) => {
    keyState[event.key.toLowerCase()] = false;
});

const colors = [
    null, "#FF0D72", "#0DC2FF", "#0DFF72",
    "#F538FF", "#FF8E0D", "#FFE138", "#3877FF"
];

const arena = createMatrix(12, 20);
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0
};

let bestScore = parseInt(localStorage.getItem("bestScore")) || 0;

update();

