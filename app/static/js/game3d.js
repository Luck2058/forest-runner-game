(function () {
    'use strict';

    const ForestRunner3D = {
        canvas: null,
        ctx: null,
        width: 1120,
        height: 630,
        ratio: 1,
        running: false,
        paused: false,
        gameOver: false,
        lastTime: 0,
        worldTime: 0,
        score: 0,
        distance: 0,
        speed: 0.34,
        spawnTimer: 0,
        pickupTimer: 0,
        laneIndex: 1,
        targetLaneIndex: 1,
        laneOffset: 0,
        jumpVelocity: 0,
        jumpHeight: 0,
        slideTimer: 0,
        energy: 0,
        shieldTimer: 0,
        boostTimer: 0,
        shake: 0,
        flash: 0,
        obstacles: [],
        pickups: [],
        trees: [],
        fireflies: [],
        particles: [],
        dom: {}
    };

    const LANES = [-1, 0, 1];
    const PLAYER_Z = 0.91;
    const MAX_ENERGY = 100;
    const COLORS = {
        skyTop: '#8ed4f4',
        skyMid: '#d9f6ff',
        grass: '#427a45',
        grassDark: '#1d4a31',
        roadA: '#70512e',
        roadB: '#815f36',
        roadEdge: '#e4d084',
        lane: 'rgba(255, 244, 184, 0.78)',
        player: '#22a35d',
        playerDark: '#0f5f3b',
        gold: '#ffd666',
        shield: '#75d8ff',
        danger: '#c95b3b'
    };

    function cacheDom() {
        ForestRunner3D.canvas = document.getElementById('game3dCanvas');
        ForestRunner3D.ctx = ForestRunner3D.canvas.getContext('2d');
        ForestRunner3D.dom.score = document.getElementById('game3dScore');
        ForestRunner3D.dom.energy = document.getElementById('game3dEnergy');
        ForestRunner3D.dom.state = document.getElementById('game3dState');
        ForestRunner3D.dom.speed = document.getElementById('game3dSpeed');
        ForestRunner3D.dom.curve = document.getElementById('game3dCurve');
        ForestRunner3D.dom.depth = document.getElementById('game3dDepth');
        ForestRunner3D.dom.shield = document.getElementById('game3dShield');
        ForestRunner3D.dom.startOverlay = document.getElementById('game3dStartOverlay');
        ForestRunner3D.dom.overOverlay = document.getElementById('game3dOverOverlay');
        ForestRunner3D.dom.finalScore = document.getElementById('game3dFinalScore');
        ForestRunner3D.dom.finalNote = document.getElementById('game3dFinalNote');
        ForestRunner3D.dom.pauseBtn = document.getElementById('game3dPauseBtn');
        ForestRunner3D.dom.boostBtn = document.getElementById('game3dBoostBtn');

        document.getElementById('game3dStartBtn').addEventListener('click', start);
        document.getElementById('game3dRestartBtn').addEventListener('click', restart);
        document.getElementById('game3dResetBtn').addEventListener('click', restart);
        ForestRunner3D.dom.pauseBtn.addEventListener('click', togglePause);
        ForestRunner3D.dom.boostBtn.addEventListener('click', boost);

        bindHoldButton('game3dTouchLeft', () => moveLane(-1));
        bindHoldButton('game3dTouchRight', () => moveLane(1));
        bindHoldButton('game3dTouchJump', jump);
        bindHoldButton('game3dTouchSlide', slide);
    }

    function bindHoldButton(id, action) {
        const button = document.getElementById(id);
        if (!button) {
            return;
        }
        button.addEventListener('click', action);
        button.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            action();
        });
    }

    function resizeCanvas() {
        const rect = ForestRunner3D.canvas.getBoundingClientRect();
        ForestRunner3D.ratio = window.devicePixelRatio || 1;
        ForestRunner3D.width = Math.max(720, Math.round(rect.width * ForestRunner3D.ratio));
        ForestRunner3D.height = Math.max(420, Math.round(rect.height * ForestRunner3D.ratio));
        ForestRunner3D.canvas.width = ForestRunner3D.width;
        ForestRunner3D.canvas.height = ForestRunner3D.height;
    }

    function resetWorld() {
        ForestRunner3D.running = false;
        ForestRunner3D.paused = false;
        ForestRunner3D.gameOver = false;
        ForestRunner3D.lastTime = 0;
        ForestRunner3D.worldTime = 0;
        ForestRunner3D.score = 0;
        ForestRunner3D.distance = 0;
        ForestRunner3D.speed = 0.34;
        ForestRunner3D.spawnTimer = 0.35;
        ForestRunner3D.pickupTimer = 0.5;
        ForestRunner3D.laneIndex = 1;
        ForestRunner3D.targetLaneIndex = 1;
        ForestRunner3D.laneOffset = 0;
        ForestRunner3D.jumpVelocity = 0;
        ForestRunner3D.jumpHeight = 0;
        ForestRunner3D.slideTimer = 0;
        ForestRunner3D.energy = 0;
        ForestRunner3D.shieldTimer = 0;
        ForestRunner3D.boostTimer = 0;
        ForestRunner3D.shake = 0;
        ForestRunner3D.flash = 0;
        ForestRunner3D.obstacles = [];
        ForestRunner3D.pickups = [];
        ForestRunner3D.particles = [];

        // 树木使用独立深度循环，让近景遮挡和远景森林一直滚动。
        ForestRunner3D.trees = [];
        for (let i = 0; i < 42; i += 1) {
            ForestRunner3D.trees.push({
                side: i % 2 === 0 ? -1 : 1,
                z: 0.02 + (i % 21) / 21,
                offset: 1.45 + Math.random() * 0.8,
                height: 0.85 + Math.random() * 0.65,
                hue: Math.random()
            });
        }

        ForestRunner3D.fireflies = [];
        for (let i = 0; i < 38; i += 1) {
            ForestRunner3D.fireflies.push({
                lane: -2.4 + Math.random() * 4.8,
                z: Math.random(),
                lift: Math.random(),
                phase: Math.random() * Math.PI * 2
            });
        }

        updateHud('待开始');
    }

    function horizonY() {
        const h = ForestRunner3D.height;
        const bob = Math.sin(ForestRunner3D.worldTime * 1.5) * h * 0.012;
        return h * 0.25 + bob;
    }

    function curveAt(z) {
        const t = ForestRunner3D.worldTime;
        return Math.sin(t * 0.28 + z * 4.3) * 0.42 + Math.sin(t * 0.13 + z * 8.4) * 0.18;
    }

    function hillAt(z) {
        const t = ForestRunner3D.worldTime;
        return Math.sin(t * 0.32 + z * 6.1) * 0.035 + Math.cos(t * 0.18 + z * 10.7) * 0.02;
    }

    function project(lane, z, lift) {
        const depth = clamp(z, 0.02, 1.16);
        const ease = Math.pow(depth, 1.62);
        const centerX = ForestRunner3D.width / 2;
        const cameraLean = (ForestRunner3D.targetLaneIndex - 1) * ForestRunner3D.width * 0.018;
        const roadCurve = curveAt(depth) * ForestRunner3D.width * 0.15 * ease;
        const y = horizonY() + (ForestRunner3D.height - horizonY() - 36) * ease - hillAt(depth) * ForestRunner3D.height;
        const laneSpread = 42 + 300 * Math.pow(depth, 1.36);
        const roadHalf = 98 + 430 * Math.pow(depth, 1.28);
        const scale = 0.16 + 1.18 * Math.pow(depth, 1.34);
        return {
            x: centerX + cameraLean + roadCurve + lane * laneSpread,
            y: y - (lift || 0) * 170 * scale,
            scale,
            roadLeft: centerX + cameraLean + roadCurve - roadHalf,
            roadRight: centerX + cameraLean + roadCurve + roadHalf,
            laneSpread,
            roadCenter: centerX + cameraLean + roadCurve
        };
    }

    function drawSky() {
        const ctx = ForestRunner3D.ctx;
        const w = ForestRunner3D.width;
        const h = ForestRunner3D.height;
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, COLORS.skyTop);
        sky.addColorStop(0.45, COLORS.skyMid);
        sky.addColorStop(1, '#6ba35a');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        drawSun(w * 0.16, h * 0.12, h * 0.055);
        drawCloud(w * 0.32 + Math.sin(ForestRunner3D.worldTime * 0.12) * 18, h * 0.12, h * 0.05);
        drawCloud(w * 0.72 + Math.cos(ForestRunner3D.worldTime * 0.1) * 22, h * 0.17, h * 0.065);
        drawMountains();
    }

    function drawSun(x, y, r) {
        const ctx = ForestRunner3D.ctx;
        const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.7);
        glow.addColorStop(0, 'rgba(255, 226, 124, 0.95)');
        glow.addColorStop(1, 'rgba(255, 226, 124, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffe07d';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawCloud(x, y, r) {
        const ctx = ForestRunner3D.ctx;
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.beginPath();
        ctx.arc(x - r * 1.15, y + r * 0.18, r * 0.68, 0, Math.PI * 2);
        ctx.arc(x - r * 0.35, y, r, 0, Math.PI * 2);
        ctx.arc(x + r * 0.58, y + r * 0.14, r * 0.82, 0, Math.PI * 2);
        ctx.arc(x + r * 1.28, y + r * 0.22, r * 0.56, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawMountains() {
        const ctx = ForestRunner3D.ctx;
        const h = ForestRunner3D.height;
        const w = ForestRunner3D.width;
        const base = horizonY() + h * 0.04;
        ctx.fillStyle = 'rgba(50, 115, 89, 0.38)';
        ctx.beginPath();
        ctx.moveTo(0, base);
        for (let i = 0; i <= 8; i += 1) {
            const x = (w / 8) * i;
            const y = base - h * (0.08 + (i % 3) * 0.035);
            ctx.lineTo(x + w * 0.06, y);
            ctx.lineTo(x + w * 0.13, base);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
    }

    function drawRoad() {
        const ctx = ForestRunner3D.ctx;
        const h = ForestRunner3D.height;
        ctx.fillStyle = COLORS.grass;
        ctx.fillRect(0, horizonY(), ForestRunner3D.width, h - horizonY());

        // 分段绘制赛道，曲线和坡度会让道路更接近 3D 赛道。
        const segments = [];
        for (let i = 0; i <= 36; i += 1) {
            const z = i / 36;
            segments.push(project(0, z));
        }

        for (let i = 0; i < segments.length - 1; i += 1) {
            const a = segments[i];
            const b = segments[i + 1];
            ctx.beginPath();
            ctx.moveTo(a.roadLeft, a.y);
            ctx.lineTo(a.roadRight, a.y);
            ctx.lineTo(b.roadRight, b.y);
            ctx.lineTo(b.roadLeft, b.y);
            ctx.closePath();
            ctx.fillStyle = i % 2 === 0 ? COLORS.roadA : COLORS.roadB;
            ctx.fill();
        }

        drawRoadEdges();
        drawLaneLines();
        drawSpeedStrips();
    }

    function drawRoadEdges() {
        const ctx = ForestRunner3D.ctx;
        ctx.strokeStyle = COLORS.roadEdge;
        ctx.lineWidth = Math.max(3, ForestRunner3D.width * 0.0045);
        [-1, 1].forEach((side) => {
            ctx.beginPath();
            for (let z = 0.04; z <= 1.02; z += 0.035) {
                const p = project(0, z);
                const x = side < 0 ? p.roadLeft : p.roadRight;
                if (z === 0.04) {
                    ctx.moveTo(x, p.y);
                } else {
                    ctx.lineTo(x, p.y);
                }
            }
            ctx.stroke();
        });
    }

    function drawLaneLines() {
        const ctx = ForestRunner3D.ctx;
        ctx.strokeStyle = COLORS.lane;
        ctx.lineWidth = Math.max(2, ForestRunner3D.width * 0.0034);
        [-0.5, 0.5].forEach((lane) => {
            ctx.beginPath();
            for (let z = 0.05; z <= 1.02; z += 0.035) {
                const p = project(lane, z);
                if (z === 0.05) {
                    ctx.moveTo(p.x, p.y);
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            }
            ctx.stroke();
        });
    }

    function drawSpeedStrips() {
        const ctx = ForestRunner3D.ctx;
        const phase = (ForestRunner3D.distance * 0.025) % 0.12;
        for (let z = 0.08 + phase; z < 1; z += 0.12) {
            const p = project(0, z);
            const alpha = 0.08 + z * 0.3;
            ctx.strokeStyle = `rgba(255, 241, 177, ${alpha})`;
            ctx.lineWidth = 1 + z * 5;
            ctx.beginPath();
            ctx.moveTo(p.roadLeft + p.scale * 20, p.y);
            ctx.lineTo(p.roadRight - p.scale * 20, p.y);
            ctx.stroke();
        }
    }

    function drawTrees() {
        const ctx = ForestRunner3D.ctx;
        const sorted = ForestRunner3D.trees.slice().sort((a, b) => a.z - b.z);
        sorted.forEach((tree) => {
            const p = project(tree.side * tree.offset, tree.z);
            const trunkH = 34 * p.scale * tree.height;
            const crown = 52 * p.scale * tree.height;
            const baseY = p.y + 20 * p.scale;
            const sway = Math.sin(ForestRunner3D.worldTime * 1.2 + tree.z * 7) * 5 * p.scale;
            ctx.fillStyle = '#5a3726';
            ctx.fillRect(p.x - 6 * p.scale + sway * 0.15, baseY - trunkH, 12 * p.scale, trunkH);
            ctx.fillStyle = tree.hue > 0.55 ? '#145333' : '#226d45';
            ctx.beginPath();
            ctx.moveTo(p.x + sway, baseY - trunkH - crown * 1.18);
            ctx.lineTo(p.x - crown * 0.78 + sway, baseY - trunkH * 0.14);
            ctx.lineTo(p.x + crown * 0.78 + sway, baseY - trunkH * 0.14);
            ctx.closePath();
            ctx.fill();

            if (tree.z > 0.82) {
                ctx.fillStyle = 'rgba(12, 50, 31, 0.18)';
                ctx.beginPath();
                ctx.ellipse(p.x, baseY + 8 * p.scale, crown * 0.66, 12 * p.scale, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    function drawFireflies() {
        const ctx = ForestRunner3D.ctx;
        ForestRunner3D.fireflies.forEach((fly) => {
            const lift = 0.48 + fly.lift * 0.7 + Math.sin(ForestRunner3D.worldTime * 2.2 + fly.phase) * 0.06;
            const p = project(fly.lane, fly.z, lift);
            const r = (2 + fly.z * 4) * ForestRunner3D.ratio;
            const alpha = 0.22 + Math.sin(ForestRunner3D.worldTime * 4 + fly.phase) * 0.16;
            ctx.fillStyle = `rgba(255, 230, 105, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawPlayer() {
        const ctx = ForestRunner3D.ctx;
        const lane = LANES[ForestRunner3D.laneIndex] + ForestRunner3D.laneOffset;
        const p = project(lane, PLAYER_Z, ForestRunner3D.jumpHeight);
        const size = 54 * p.scale;
        const sliding = ForestRunner3D.slideTimer > 0;
        const bodyH = sliding ? size * 0.48 : size * 0.86;
        const bodyY = p.y - bodyH * 0.62;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(p.x, project(lane, PLAYER_Z).y + size * 0.34, size * 0.72, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        if (ForestRunner3D.shieldTimer > 0) {
            ctx.strokeStyle = 'rgba(117, 216, 255, 0.76)';
            ctx.lineWidth = Math.max(3, size * 0.06);
            ctx.beginPath();
            ctx.arc(p.x, bodyY + bodyH * 0.08, size * 0.72, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = COLORS.playerDark;
        roundRect(ctx, p.x - size * 0.36, bodyY - size * 0.03, size * 0.72, bodyH, size * 0.13);
        ctx.fill();
        ctx.fillStyle = COLORS.player;
        roundRect(ctx, p.x - size * 0.29, bodyY - size * 0.08, size * 0.58, bodyH * 0.82, size * 0.12);
        ctx.fill();

        if (!sliding) {
            ctx.fillStyle = '#ffd36b';
            ctx.beginPath();
            ctx.arc(p.x, bodyY - size * 0.2, size * 0.22, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = '#0d3c28';
        ctx.lineWidth = Math.max(2, size * 0.08);
        ctx.beginPath();
        ctx.moveTo(p.x - size * 0.16, bodyY + bodyH * 0.76);
        ctx.lineTo(p.x - size * 0.34, bodyY + bodyH * 1.13);
        ctx.moveTo(p.x + size * 0.16, bodyY + bodyH * 0.76);
        ctx.lineTo(p.x + size * 0.34, bodyY + bodyH * 1.13);
        ctx.stroke();
    }

    function drawObstacle(obstacle) {
        const p = project(LANES[obstacle.lane], obstacle.z, obstacle.kind === 'branch' ? 0.34 : 0);
        if (obstacle.kind === 'branch') {
            drawBranch(p, obstacle);
        } else if (obstacle.kind === 'gate') {
            drawGate(p, obstacle);
        } else {
            drawRockOrStump(p, obstacle);
        }
    }

    function drawRockOrStump(p, obstacle) {
        const ctx = ForestRunner3D.ctx;
        const w = 54 * p.scale;
        const h = obstacle.kind === 'stone' ? 48 * p.scale : 62 * p.scale;
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + h * 0.42, w * 0.7, h * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = obstacle.kind === 'stone' ? '#68706c' : '#754626';
        roundRect(ctx, p.x - w / 2, p.y - h * 0.45, w, h, Math.max(4, 8 * p.scale));
        ctx.fill();
        ctx.fillStyle = obstacle.kind === 'stone' ? '#9ca59e' : '#a36d3c';
        ctx.fillRect(p.x - w * 0.26, p.y - h * 0.22, w * 0.52, h * 0.13);
    }

    function drawBranch(p) {
        const ctx = ForestRunner3D.ctx;
        const w = 86 * p.scale;
        const h = 22 * p.scale;
        ctx.fillStyle = 'rgba(0,0,0,0.17)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + h * 1.4, w * 0.5, h * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6a3c21';
        roundRect(ctx, p.x - w / 2, p.y - h, w, h, Math.max(4, h * 0.5));
        ctx.fill();
        ctx.fillStyle = '#2c7a47';
        ctx.beginPath();
        ctx.ellipse(p.x - w * 0.22, p.y - h * 1.1, w * 0.18, h * 0.8, -0.5, 0, Math.PI * 2);
        ctx.ellipse(p.x + w * 0.25, p.y - h * 1.05, w * 0.15, h * 0.75, 0.45, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawGate(p) {
        const ctx = ForestRunner3D.ctx;
        const w = 76 * p.scale;
        const h = 86 * p.scale;
        ctx.strokeStyle = '#8a5a2b';
        ctx.lineWidth = Math.max(4, 8 * p.scale);
        ctx.beginPath();
        ctx.moveTo(p.x - w * 0.45, p.y + h * 0.34);
        ctx.lineTo(p.x - w * 0.45, p.y - h * 0.5);
        ctx.lineTo(p.x + w * 0.45, p.y - h * 0.5);
        ctx.lineTo(p.x + w * 0.45, p.y + h * 0.34);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 214, 102, 0.75)';
        ctx.beginPath();
        ctx.arc(p.x, p.y - h * 0.12, 10 * p.scale, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPickup(item) {
        const ctx = ForestRunner3D.ctx;
        const lift = item.type === 'shield' ? 0.28 : 0.18;
        const p = project(LANES[item.lane], item.z, lift + Math.sin(ForestRunner3D.worldTime * 3 + item.phase) * 0.03);
        const r = (item.type === 'crystal' ? 16 : 13) * p.scale;
        ctx.fillStyle = 'rgba(0,0,0,0.16)';
        ctx.beginPath();
        ctx.ellipse(p.x, project(LANES[item.lane], item.z).y + r * 1.5, r * 1.2, r * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        if (item.type === 'shield') {
            ctx.strokeStyle = COLORS.shield;
            ctx.lineWidth = Math.max(2, r * 0.18);
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(117, 216, 255, 0.35)';
            ctx.fill();
        } else if (item.type === 'crystal') {
            ctx.fillStyle = '#63e6be';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - r * 1.2);
            ctx.lineTo(p.x + r * 0.78, p.y);
            ctx.lineTo(p.x, p.y + r * 1.2);
            ctx.lineTo(p.x - r * 0.78, p.y);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = COLORS.gold;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#a66b12';
            ctx.lineWidth = Math.max(2, r * 0.16);
            ctx.stroke();
        }
    }

    function drawParticles() {
        const ctx = ForestRunner3D.ctx;
        ForestRunner3D.particles.forEach((particle) => {
            ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    function spawnObstacle() {
        const kinds = ['stump', 'stone', 'branch', 'gate'];
        ForestRunner3D.obstacles.push({
            lane: Math.floor(Math.random() * 3),
            z: 0.04,
            kind: kinds[Math.floor(Math.random() * kinds.length)]
        });
    }

    function spawnPickup() {
        const roll = Math.random();
        ForestRunner3D.pickups.push({
            lane: Math.floor(Math.random() * 3),
            z: 0.05,
            type: roll > 0.86 ? 'shield' : roll > 0.58 ? 'crystal' : 'coin',
            phase: Math.random() * Math.PI * 2
        });
    }

    function update(dt) {
        if (!ForestRunner3D.running || ForestRunner3D.paused || ForestRunner3D.gameOver) {
            return;
        }

        ForestRunner3D.worldTime += dt;
        const boostFactor = ForestRunner3D.boostTimer > 0 ? 1.55 : 1;
        ForestRunner3D.distance += ForestRunner3D.speed * boostFactor * dt * 70;
        ForestRunner3D.score += dt * 18 * boostFactor + ForestRunner3D.speed * 0.24;
        ForestRunner3D.speed = Math.min(0.92, ForestRunner3D.speed + dt * 0.0075);
        ForestRunner3D.spawnTimer -= dt;
        ForestRunner3D.pickupTimer -= dt;
        ForestRunner3D.shake = Math.max(0, ForestRunner3D.shake - dt * 5);
        ForestRunner3D.flash = Math.max(0, ForestRunner3D.flash - dt * 2.5);
        ForestRunner3D.shieldTimer = Math.max(0, ForestRunner3D.shieldTimer - dt);
        ForestRunner3D.boostTimer = Math.max(0, ForestRunner3D.boostTimer - dt);
        ForestRunner3D.slideTimer = Math.max(0, ForestRunner3D.slideTimer - dt);

        if (ForestRunner3D.boostTimer > 0) {
            ForestRunner3D.energy = Math.max(0, ForestRunner3D.energy - dt * 18);
            spawnTrail('#a7ffca', 2);
        }

        if (ForestRunner3D.spawnTimer <= 0) {
            spawnObstacle();
            ForestRunner3D.spawnTimer = Math.max(0.52, 1.25 - ForestRunner3D.speed * 0.55 + Math.random() * 0.34);
        }

        if (ForestRunner3D.pickupTimer <= 0) {
            spawnPickup();
            ForestRunner3D.pickupTimer = 0.85 + Math.random() * 0.75;
        }

        updatePlayer(dt);
        updateDepthObjects(dt, boostFactor);
        updateParticles(dt);
        checkCollection();
        checkCollision();
        if (!ForestRunner3D.gameOver) {
            updateHud(ForestRunner3D.boostTimer > 0 ? '冲刺中' : ForestRunner3D.shieldTimer > 0 ? '护盾中' : '进行中');
        }
    }

    function updatePlayer(dt) {
        const laneDelta = ForestRunner3D.targetLaneIndex - ForestRunner3D.laneIndex;
        ForestRunner3D.laneOffset += (laneDelta - ForestRunner3D.laneOffset) * Math.min(1, dt * 13);
        if (Math.abs(ForestRunner3D.laneOffset - laneDelta) < 0.02) {
            ForestRunner3D.laneIndex = ForestRunner3D.targetLaneIndex;
            ForestRunner3D.laneOffset = 0;
        }

        if (ForestRunner3D.jumpHeight > 0 || ForestRunner3D.jumpVelocity > 0) {
            ForestRunner3D.jumpHeight += ForestRunner3D.jumpVelocity * dt;
            ForestRunner3D.jumpVelocity -= 2.85 * dt;
            if (ForestRunner3D.jumpHeight <= 0) {
                ForestRunner3D.jumpHeight = 0;
                ForestRunner3D.jumpVelocity = 0;
            }
        }
    }

    function updateDepthObjects(dt, boostFactor) {
        const dz = ForestRunner3D.speed * boostFactor * dt;
        ForestRunner3D.obstacles.forEach((obstacle) => {
            obstacle.z += dz;
        });
        ForestRunner3D.pickups.forEach((item) => {
            item.z += dz;
        });
        ForestRunner3D.trees.forEach((tree) => {
            tree.z += dz * 0.78;
            if (tree.z > 1.1) {
                tree.z = 0.02;
                tree.side = Math.random() > 0.5 ? -1 : 1;
                tree.offset = 1.45 + Math.random() * 0.9;
            }
        });
        ForestRunner3D.fireflies.forEach((fly) => {
            fly.z += dz * 0.55;
            if (fly.z > 1.05) {
                fly.z = 0.02;
                fly.lane = -2.4 + Math.random() * 4.8;
            }
        });
        ForestRunner3D.obstacles = ForestRunner3D.obstacles.filter((obstacle) => obstacle.z < 1.16);
        ForestRunner3D.pickups = ForestRunner3D.pickups.filter((item) => item.z < 1.16 && !item.collected);
    }

    function updateParticles(dt) {
        ForestRunner3D.particles.forEach((particle) => {
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vy += 20 * dt;
            particle.life -= dt;
        });
        ForestRunner3D.particles = ForestRunner3D.particles.filter((particle) => particle.life > 0);
    }

    function checkCollection() {
        ForestRunner3D.pickups.forEach((item) => {
            const sameLane = item.lane === ForestRunner3D.laneIndex && Math.abs(ForestRunner3D.laneOffset) < 0.34;
            const close = item.z > 0.83 && item.z < 1.02;
            if (!sameLane || !close) {
                return;
            }
            item.collected = true;
            if (item.type === 'shield') {
                ForestRunner3D.shieldTimer = 6;
                ForestRunner3D.energy = Math.min(MAX_ENERGY, ForestRunner3D.energy + 18);
                burst('#75d8ff', 18);
            } else if (item.type === 'crystal') {
                ForestRunner3D.energy = Math.min(MAX_ENERGY, ForestRunner3D.energy + 28);
                ForestRunner3D.score += 80;
                burst('#63e6be', 16);
            } else {
                ForestRunner3D.energy = Math.min(MAX_ENERGY, ForestRunner3D.energy + 7);
                ForestRunner3D.score += 35;
                burst('#ffd666', 12);
            }
        });
    }

    function checkCollision() {
        ForestRunner3D.obstacles.forEach((obstacle) => {
            const sameLane = obstacle.lane === ForestRunner3D.laneIndex && Math.abs(ForestRunner3D.laneOffset) < 0.3;
            const close = obstacle.z > 0.84 && obstacle.z < 1.02;
            if (!sameLane || !close) {
                return;
            }
            const jumping = ForestRunner3D.jumpHeight > 0.36;
            const sliding = ForestRunner3D.slideTimer > 0;
            const canAvoid = obstacle.kind === 'branch' ? sliding : obstacle.kind === 'gate' ? true : jumping;
            if (canAvoid) {
                ForestRunner3D.score += 55;
                return;
            }
            if (ForestRunner3D.shieldTimer > 0 || ForestRunner3D.boostTimer > 0) {
                obstacle.z = 1.2;
                ForestRunner3D.shieldTimer = Math.max(0, ForestRunner3D.shieldTimer - 1.5);
                ForestRunner3D.shake = 0.7;
                burst('#75d8ff', 20);
                return;
            }
            endGame();
        });
    }

    function draw() {
        const ctx = ForestRunner3D.ctx;
        ctx.save();
        const shakeX = (Math.random() - 0.5) * ForestRunner3D.shake * 18 * ForestRunner3D.ratio;
        const shakeY = (Math.random() - 0.5) * ForestRunner3D.shake * 10 * ForestRunner3D.ratio;
        const lean = (ForestRunner3D.targetLaneIndex - 1) * 0.01 + curveAt(0.86) * 0.006;
        ctx.translate(ForestRunner3D.width / 2 + shakeX, ForestRunner3D.height / 2 + shakeY);
        ctx.rotate(lean);
        ctx.translate(-ForestRunner3D.width / 2, -ForestRunner3D.height / 2);

        drawSky();
        drawRoad();
        drawFireflies();
        drawTrees();
        ForestRunner3D.pickups.slice().sort((a, b) => a.z - b.z).forEach(drawPickup);
        ForestRunner3D.obstacles.slice().sort((a, b) => a.z - b.z).forEach(drawObstacle);
        drawPlayer();
        drawParticles();
        drawVignette();
        ctx.restore();

        if (ForestRunner3D.flash > 0) {
            ctx.fillStyle = `rgba(255, 246, 190, ${ForestRunner3D.flash * 0.22})`;
            ctx.fillRect(0, 0, ForestRunner3D.width, ForestRunner3D.height);
        }
    }

    function drawVignette() {
        const ctx = ForestRunner3D.ctx;
        const w = ForestRunner3D.width;
        const h = ForestRunner3D.height;
        const gradient = ctx.createRadialGradient(w / 2, h * 0.55, h * 0.2, w / 2, h * 0.55, h * 0.78);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(5, 27, 17, 0.32)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
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

    function spawnTrail(color, count) {
        for (let i = 0; i < count; i += 1) {
            const lane = LANES[ForestRunner3D.laneIndex] + ForestRunner3D.laneOffset + (Math.random() - 0.5) * 0.35;
            const p = project(lane, PLAYER_Z + 0.02);
            ForestRunner3D.particles.push({
                x: p.x,
                y: p.y + 32 * p.scale,
                vx: (Math.random() - 0.5) * 80 * ForestRunner3D.ratio,
                vy: (60 + Math.random() * 80) * ForestRunner3D.ratio,
                r: (2 + Math.random() * 4) * ForestRunner3D.ratio,
                life: 0.25 + Math.random() * 0.25,
                maxLife: 0.5,
                color
            });
        }
    }

    function burst(color, count) {
        const p = project(LANES[ForestRunner3D.laneIndex] + ForestRunner3D.laneOffset, PLAYER_Z, ForestRunner3D.jumpHeight);
        for (let i = 0; i < count; i += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 190;
            ForestRunner3D.particles.push({
                x: p.x,
                y: p.y - 30 * p.scale,
                vx: Math.cos(angle) * speed * ForestRunner3D.ratio,
                vy: Math.sin(angle) * speed * ForestRunner3D.ratio,
                r: (2 + Math.random() * 5) * ForestRunner3D.ratio,
                life: 0.45 + Math.random() * 0.45,
                maxLife: 0.9,
                color
            });
        }
        ForestRunner3D.flash = 1;
    }

    function moveLane(direction) {
        if (!ForestRunner3D.running || ForestRunner3D.paused || ForestRunner3D.gameOver) {
            return;
        }
        ForestRunner3D.targetLaneIndex = clamp(ForestRunner3D.targetLaneIndex + direction, 0, 2);
    }

    function jump() {
        if (!ForestRunner3D.running || ForestRunner3D.paused || ForestRunner3D.gameOver) {
            return;
        }
        if (ForestRunner3D.jumpHeight === 0 && ForestRunner3D.slideTimer <= 0) {
            ForestRunner3D.jumpVelocity = 1.22;
            spawnTrail('#eaffdf', 8);
        }
    }

    function slide() {
        if (!ForestRunner3D.running || ForestRunner3D.paused || ForestRunner3D.gameOver) {
            return;
        }
        if (ForestRunner3D.jumpHeight === 0) {
            ForestRunner3D.slideTimer = 0.62;
            spawnTrail('#d8aa63', 8);
        }
    }

    function boost() {
        if (!ForestRunner3D.running || ForestRunner3D.paused || ForestRunner3D.gameOver) {
            return;
        }
        if (ForestRunner3D.energy >= 35) {
            ForestRunner3D.energy -= 35;
            ForestRunner3D.boostTimer = 3.4;
            ForestRunner3D.shake = 0.45;
            burst('#a7ffca', 24);
        }
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
        ForestRunner3D.dom.boostBtn.disabled = false;
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
        ForestRunner3D.dom.finalNote.textContent = `距离 ${Math.floor(ForestRunner3D.distance)}m，最高速度 ${(ForestRunner3D.speed / 0.34).toFixed(1)}x`;
        ForestRunner3D.dom.overOverlay.classList.remove('game3d-hidden');
        ForestRunner3D.dom.pauseBtn.disabled = true;
        ForestRunner3D.dom.boostBtn.disabled = true;
        ForestRunner3D.shake = 1;
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

    function updateHud(stateText) {
        ForestRunner3D.dom.score.textContent = Math.floor(ForestRunner3D.score).toString();
        ForestRunner3D.dom.energy.textContent = `${Math.floor(ForestRunner3D.energy)}%`;
        ForestRunner3D.dom.state.textContent = stateText;
        ForestRunner3D.dom.speed.textContent = `${(ForestRunner3D.speed / 0.34).toFixed(1)}x`;
        ForestRunner3D.dom.curve.textContent = curveAt(0.85).toFixed(2);
        ForestRunner3D.dom.depth.textContent = `${Math.floor(ForestRunner3D.distance)}m`;
        ForestRunner3D.dom.shield.textContent = ForestRunner3D.shieldTimer > 0 ? `${ForestRunner3D.shieldTimer.toFixed(1)}s` : 'OFF';
    }

    function bindKeys() {
        window.addEventListener('keydown', (event) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
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
            } else if (event.code === 'ArrowDown') {
                slide();
            } else if (event.code === 'KeyP') {
                togglePause();
            } else if (event.code === 'KeyR') {
                restart();
            } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                boost();
            }
        });
    }

    function loop(time) {
        const dt = ForestRunner3D.lastTime ? Math.min(0.05, (time - ForestRunner3D.lastTime) / 1000) : 0;
        ForestRunner3D.lastTime = time;
        update(dt);
        draw();
        window.requestAnimationFrame(loop);
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
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
