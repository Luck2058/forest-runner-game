(function () {
    'use strict';

    const ForestRunner3D = {
        canvas: null,
        ctx: null,
        width: 960,
        height: 540,
        running: false,
        paused: false,
        gameOver: false,
        lastTime: 0,
        score: 0,
        speed: 0.32,
        spawnTimer: 0,
        laneIndex: 1,
        targetLaneIndex: 1,
        laneOffset: 0,
        jumpVelocity: 0,
        jumpHeight: 0,
        obstacles: [],
        trees: [],
        clouds: [],
        dom: {}
    };

    const LANES = [-1, 0, 1];
    const HORIZON_Y = 150;
    const PLAYER_Z = 0.93;
    const PLAYER_BASE_SIZE = 46;

    function cacheDom() {
        ForestRunner3D.canvas = document.getElementById('game3dCanvas');
        ForestRunner3D.ctx = ForestRunner3D.canvas.getContext('2d');
        ForestRunner3D.dom.score = document.getElementById('game3dScore');
        ForestRunner3D.dom.state = document.getElementById('game3dState');
        ForestRunner3D.dom.speed = document.getElementById('game3dSpeed');
        ForestRunner3D.dom.startOverlay = document.getElementById('game3dStartOverlay');
        ForestRunner3D.dom.overOverlay = document.getElementById('game3dOverOverlay');
        ForestRunner3D.dom.finalScore = document.getElementById('game3dFinalScore');
        ForestRunner3D.dom.pauseBtn = document.getElementById('game3dPauseBtn');
        document.getElementById('game3dStartBtn').addEventListener('click', start);
        document.getElementById('game3dRestartBtn').addEventListener('click', restart);
        document.getElementById('game3dResetBtn').addEventListener('click', restart);
        ForestRunner3D.dom.pauseBtn.addEventListener('click', togglePause);
    }

    function resetWorld() {
        ForestRunner3D.running = false;
        ForestRunner3D.paused = false;
        ForestRunner3D.gameOver = false;
        ForestRunner3D.lastTime = 0;
        ForestRunner3D.score = 0;
        ForestRunner3D.speed = 0.32;
        ForestRunner3D.spawnTimer = 0;
        ForestRunner3D.laneIndex = 1;
        ForestRunner3D.targetLaneIndex = 1;
        ForestRunner3D.laneOffset = 0;
        ForestRunner3D.jumpVelocity = 0;
        ForestRunner3D.jumpHeight = 0;
        ForestRunner3D.obstacles = [];

        // 远近树木循环滚动，强化跑道两侧的纵深感。
        ForestRunner3D.trees = [];
        for (let i = 0; i < 26; i += 1) {
            ForestRunner3D.trees.push({
                side: i % 2 === 0 ? -1 : 1,
                z: (i % 13) / 13,
                sway: Math.random() * Math.PI * 2
            });
        }

        ForestRunner3D.clouds = [
            { x: 0.18, y: 0.13, scale: 1.0 },
            { x: 0.55, y: 0.09, scale: 0.8 },
            { x: 0.82, y: 0.16, scale: 1.15 }
        ];

        updateHud('待开始');
    }

    function resizeCanvas() {
        const rect = ForestRunner3D.canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        ForestRunner3D.width = Math.max(640, Math.round(rect.width * ratio));
        ForestRunner3D.height = Math.max(360, Math.round(rect.height * ratio));
        ForestRunner3D.canvas.width = ForestRunner3D.width;
        ForestRunner3D.canvas.height = ForestRunner3D.height;
    }

    function project(lane, z) {
        const depth = Math.max(0.02, z);
        const centerX = ForestRunner3D.width / 2;
        const y = HORIZON_Y + (ForestRunner3D.height - HORIZON_Y - 34) * Math.pow(depth, 1.72);
        const laneSpread = 42 + 245 * Math.pow(depth, 1.46);
        const roadHalf = 96 + 352 * Math.pow(depth, 1.36);
        return {
            x: centerX + lane * laneSpread,
            y,
            scale: 0.18 + 1.08 * Math.pow(depth, 1.38),
            roadLeft: centerX - roadHalf,
            roadRight: centerX + roadHalf
        };
    }

    function drawSky() {
        const ctx = ForestRunner3D.ctx;
        const sky = ctx.createLinearGradient(0, 0, 0, ForestRunner3D.height);
        sky.addColorStop(0, '#8ed0f4');
        sky.addColorStop(0.52, '#d9f4ff');
        sky.addColorStop(1, '#8abf65');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, ForestRunner3D.width, ForestRunner3D.height);
        ForestRunner3D.clouds.forEach((cloud) => {
            drawCloud(cloud.x * ForestRunner3D.width, cloud.y * ForestRunner3D.height, 34 * cloud.scale);
        });
    }

    function drawCloud(x, y, r) {
        const ctx = ForestRunner3D.ctx;
        ctx.fillStyle = 'rgba(255,255,255,0.84)';
        ctx.beginPath();
        ctx.arc(x - r * 0.7, y + r * 0.15, r * 0.65, 0, Math.PI * 2);
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.arc(x + r * 0.85, y + r * 0.18, r * 0.72, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawRoad() {
        const ctx = ForestRunner3D.ctx;
        const bottom = project(0, 1);
        const horizonLeft = ForestRunner3D.width / 2 - 42;
        const horizonRight = ForestRunner3D.width / 2 + 42;
        ctx.fillStyle = '#577544';
        ctx.fillRect(0, HORIZON_Y, ForestRunner3D.width, ForestRunner3D.height - HORIZON_Y);
        ctx.beginPath();
        ctx.moveTo(horizonLeft, HORIZON_Y);
        ctx.lineTo(horizonRight, HORIZON_Y);
        ctx.lineTo(bottom.roadRight, ForestRunner3D.height);
        ctx.lineTo(bottom.roadLeft, ForestRunner3D.height);
        ctx.closePath();
        ctx.fillStyle = '#7a5a32';
        ctx.fill();
        ctx.strokeStyle = 'rgba(244, 226, 157, 0.72)';
        ctx.lineWidth = Math.max(2, ForestRunner3D.width * 0.004);
        [-0.5, 0.5].forEach((laneMark) => {
            ctx.beginPath();
            for (let z = 0.05; z <= 1; z += 0.04) {
                const p = project(laneMark, z);
                if (z === 0.05) {
                    ctx.moveTo(p.x, p.y);
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            }
            ctx.stroke();
        });

        // 横向纹理随透视压缩，帮助判断障碍物正在向玩家靠近。
        for (let z = 0.08; z < 1; z += 0.1) {
            const p = project(0, z);
            ctx.strokeStyle = `rgba(255, 238, 177, ${0.12 + z * 0.22})`;
            ctx.lineWidth = 1 + z * 4;
            ctx.beginPath();
            ctx.moveTo(p.roadLeft, p.y);
            ctx.lineTo(p.roadRight, p.y);
            ctx.stroke();
        }
    }

    function drawTrees() {
        const ctx = ForestRunner3D.ctx;
        const sorted = ForestRunner3D.trees.slice().sort((a, b) => a.z - b.z);
        sorted.forEach((tree) => {
            const p = project(tree.side * 1.78, tree.z);
            const trunkH = 28 * p.scale;
            const crown = 42 * p.scale;
            const baseY = p.y + 12 * p.scale;
            ctx.fillStyle = '#5a3726';
            ctx.fillRect(p.x - 5 * p.scale, baseY - trunkH, 10 * p.scale, trunkH);
            ctx.fillStyle = tree.z > 0.55 ? '#155c36' : '#2f8050';
            ctx.beginPath();
            ctx.moveTo(p.x, baseY - trunkH - crown);
            ctx.lineTo(p.x - crown * 0.7, baseY - trunkH * 0.15);
            ctx.lineTo(p.x + crown * 0.7, baseY - trunkH * 0.15);
            ctx.closePath();
            ctx.fill();
        });
    }

    function drawPlayer() {
        const ctx = ForestRunner3D.ctx;
        const lane = LANES[ForestRunner3D.laneIndex] + ForestRunner3D.laneOffset;
        const p = project(lane, PLAYER_Z);
        const size = PLAYER_BASE_SIZE * p.scale;
        const jumpLift = ForestRunner3D.jumpHeight * 150 * p.scale;
        const x = p.x;
        const y = p.y - jumpLift;
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + size * 0.32, size * 0.62, size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd36b';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.72, size * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1f7a4b';
        roundRect(ctx, x - size * 0.31, y - size * 0.55, size * 0.62, size * 0.82, size * 0.14);
        ctx.fill();
        ctx.strokeStyle = '#173d2a';
        ctx.lineWidth = Math.max(2, size * 0.08);
        ctx.beginPath();
        ctx.moveTo(x - size * 0.18, y + size * 0.25);
        ctx.lineTo(x - size * 0.34, y + size * 0.58);
        ctx.moveTo(x + size * 0.18, y + size * 0.25);
        ctx.lineTo(x + size * 0.34, y + size * 0.58);
        ctx.stroke();
    }

    function drawObstacle(obstacle) {
        const ctx = ForestRunner3D.ctx;
        const p = project(LANES[obstacle.lane], obstacle.z);
        const w = 48 * p.scale;
        const h = 56 * p.scale;
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + h * 0.48, w * 0.62, h * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = obstacle.type === 'stone' ? '#6b706d' : '#754626';
        roundRect(ctx, p.x - w / 2, p.y - h * 0.45, w, h, Math.max(4, 8 * p.scale));
        ctx.fill();
        ctx.fillStyle = obstacle.type === 'stone' ? '#9aa19b' : '#9a6a3a';
        ctx.fillRect(p.x - w * 0.26, p.y - h * 0.28, w * 0.52, h * 0.16);
    }

    function roundRect(ctx, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
    }

    function spawnObstacle() {
        ForestRunner3D.obstacles.push({
            lane: Math.floor(Math.random() * 3),
            z: 0.04,
            type: Math.random() > 0.5 ? 'stone' : 'stump'
        });
    }

    function update(dt) {
        if (!ForestRunner3D.running || ForestRunner3D.paused || ForestRunner3D.gameOver) {
            return;
        }
        ForestRunner3D.score += dt * 14;
        ForestRunner3D.speed = Math.min(0.78, ForestRunner3D.speed + dt * 0.006);
        ForestRunner3D.spawnTimer -= dt;
        if (ForestRunner3D.spawnTimer <= 0) {
            spawnObstacle();
            ForestRunner3D.spawnTimer = Math.max(0.72, 1.42 - ForestRunner3D.speed * 0.55 + Math.random() * 0.35);
        }
        const laneDelta = ForestRunner3D.targetLaneIndex - ForestRunner3D.laneIndex;
        ForestRunner3D.laneOffset += (laneDelta - ForestRunner3D.laneOffset) * Math.min(1, dt * 12);
        if (Math.abs(ForestRunner3D.laneOffset - laneDelta) < 0.02) {
            ForestRunner3D.laneIndex = ForestRunner3D.targetLaneIndex;
            ForestRunner3D.laneOffset = 0;
        }
        if (ForestRunner3D.jumpHeight > 0 || ForestRunner3D.jumpVelocity > 0) {
            ForestRunner3D.jumpHeight += ForestRunner3D.jumpVelocity * dt;
            ForestRunner3D.jumpVelocity -= 2.7 * dt;
            if (ForestRunner3D.jumpHeight <= 0) {
                ForestRunner3D.jumpHeight = 0;
                ForestRunner3D.jumpVelocity = 0;
            }
        }
        ForestRunner3D.obstacles.forEach((obstacle) => {
            obstacle.z += ForestRunner3D.speed * dt;
        });
        ForestRunner3D.obstacles = ForestRunner3D.obstacles.filter((obstacle) => obstacle.z < 1.12);
        ForestRunner3D.trees.forEach((tree) => {
            tree.z += ForestRunner3D.speed * dt * 0.82;
            if (tree.z > 1.08) {
                tree.z = 0.02;
                tree.side = Math.random() > 0.5 ? -1 : 1;
            }
        });
        checkCollision();
        if (ForestRunner3D.gameOver) {
            return;
        }
        updateHud('进行中');
    }

    function checkCollision() {
        ForestRunner3D.obstacles.forEach((obstacle) => {
            const sameLane = obstacle.lane === ForestRunner3D.laneIndex && Math.abs(ForestRunner3D.laneOffset) < 0.28;
            const close = obstacle.z > 0.82 && obstacle.z < 1.01;
            const grounded = ForestRunner3D.jumpHeight < 0.34;
            if (sameLane && close && grounded) {
                endGame();
            }
        });
    }

    function draw() {
        drawSky();
        drawRoad();
        drawTrees();
        ForestRunner3D.obstacles.slice().sort((a, b) => a.z - b.z).forEach(drawObstacle);
        drawPlayer();
    }

    function loop(time) {
        const dt = ForestRunner3D.lastTime ? Math.min(0.05, (time - ForestRunner3D.lastTime) / 1000) : 0;
        ForestRunner3D.lastTime = time;
        update(dt);
        draw();
        window.requestAnimationFrame(loop);
    }

    function start() {
        if (ForestRunner3D.gameOver) {
            resetWorld();
        }
        ForestRunner3D.running = true;
        ForestRunner3D.paused = false;
        ForestRunner3D.dom.startOverlay.classList.add('game3d-hidden');
        ForestRunner3D.dom.overOverlay.classList.add('game3d-hidden');
        ForestRunner3D.dom.pauseBtn.disabled = false;
        ForestRunner3D.dom.pauseBtn.textContent = '暂停';
        updateHud('进行中');
    }

    function restart() {
        resetWorld();
        start();
    }

    function endGame() {
        ForestRunner3D.gameOver = true;
        ForestRunner3D.running = false;
        ForestRunner3D.dom.finalScore.textContent = Math.floor(ForestRunner3D.score).toString();
        ForestRunner3D.dom.overOverlay.classList.remove('game3d-hidden');
        ForestRunner3D.dom.pauseBtn.disabled = true;
        updateHud('已结束');
    }

    function togglePause() {
        if (!ForestRunner3D.running || ForestRunner3D.gameOver) {
            return;
        }
        ForestRunner3D.paused = !ForestRunner3D.paused;
        ForestRunner3D.dom.pauseBtn.textContent = ForestRunner3D.paused ? '继续' : '暂停';
        updateHud(ForestRunner3D.paused ? '已暂停' : '进行中');
    }

    function moveLane(direction) {
        if (!ForestRunner3D.running || ForestRunner3D.paused || ForestRunner3D.gameOver) {
            return;
        }
        ForestRunner3D.targetLaneIndex = Math.max(0, Math.min(2, ForestRunner3D.targetLaneIndex + direction));
    }

    function jump() {
        if (!ForestRunner3D.running || ForestRunner3D.paused || ForestRunner3D.gameOver) {
            return;
        }
        if (ForestRunner3D.jumpHeight === 0) {
            ForestRunner3D.jumpVelocity = 1.12;
        }
    }

    function updateHud(stateText) {
        ForestRunner3D.dom.score.textContent = Math.floor(ForestRunner3D.score).toString();
        ForestRunner3D.dom.state.textContent = stateText;
        ForestRunner3D.dom.speed.textContent = `${(ForestRunner3D.speed / 0.32).toFixed(1)}x`;
    }

    function bindKeys() {
        window.addEventListener('keydown', (event) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(event.code)) {
                event.preventDefault();
            }
            if (event.repeat) {
                return;
            }
            if (event.code === 'ArrowLeft') {
                moveLane(-1);
            } else if (event.code === 'ArrowRight') {
                moveLane(1);
            } else if (event.code === 'ArrowUp' || event.code === 'Space') {
                jump();
            } else if (event.code === 'KeyP') {
                togglePause();
            } else if (event.code === 'KeyR') {
                restart();
            }
        });
    }

    function init() {
        cacheDom();
        resizeCanvas();
        resetWorld();
        bindKeys();
        draw();
        window.addEventListener('resize', () => {
            resizeCanvas();
            draw();
        });
        window.requestAnimationFrame(loop);
    }

    document.addEventListener('DOMContentLoaded', init);
    window.ForestRunner3D = ForestRunner3D;
})();
