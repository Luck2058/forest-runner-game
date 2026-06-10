/**
 * game.js —— 森林酷跑游戏核心逻辑
 * 使用 HTML5 Canvas 实现 2D 横版跑酷小游戏
 *
 * 由【成员一：游戏核心逻辑】负责完善和扩展
 * 由【成员二：美术设计】负责替换矩形为图片素材
 *       - 已完成：图片素材加载与渲染
 *       - 已完成：难度选择系统（简单/普通/困难）
 *       - 已完成：音效系统与音效开关
 *       - 已完成：增强视觉效果
 *
 * 游戏结构：
 *   - 玩家（可爱小狐狸角色图片）：可以跳跃（二段跳）
 *   - 障碍物（树桩图片）：从右向左移动，碰撞游戏结束
 *   - 金币（金币图片）：收集加分
 *   - 道具（磁铁图片）：自动吸引金币（扩展功能）
 *   - 地面：绿色草地
 *   - 分数：随时间自动增加
 */

// ============================================================
// 获取 Canvas 和 2D 上下文
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ============================================================
// 图片素材加载系统（由 B 岗美术设计实现）
// ============================================================
const IMAGES = {};
let imagesLoaded = 0;
let totalImages  = 4;

/** 预加载所有游戏图片素材 */
function loadGameImages() {
    const imageList = [
        { key: 'player',    src: '/static/images/player.svg' },
        { key: 'obstacle',  src: '/static/images/obstacle_stump.svg' },
        { key: 'coin',      src: '/static/images/coin.svg' },
        { key: 'powerup',   src: '/static/images/powerup_magnet.svg' },
    ];

    imageList.forEach(item => {
        const img = new Image();
        img.onload = function() {
            imagesLoaded++;
            console.log('[素材] 加载完成:', item.key);
        };
        img.onerror = function() {
            imagesLoaded++;
            console.warn('[素材] 加载失败:', item.key, '→ 使用 Canvas 绘制');
        };
        img.src = item.src;
        IMAGES[item.key] = img;
    });
}

// ============================================================
// 音效系统（由 B 岗美术设计实现）
// ============================================================
const AudioSystem = {
    enabled: true,           // 音效是否开启
    bgMusicEnabled: true,    // 背景音乐是否开启
    audioCtx: null,          // Web Audio API 上下文
    bgOscillator: null,      // 背景音振荡器
    bgGain: null,            // 背景音增益

    /** 初始化音频上下文（需要用户交互后调用） */
    init() {
        if (this.audioCtx) return;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            console.log('[音效] Web Audio API 已初始化');
        } catch (e) {
            console.warn('[音效] Web Audio API 不可用');
        }
    },

    /** 播放跳跃音效 */
    playJump() {
        if (!this.enabled || !this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.15);
    },

    /** 播放金币收集音效 */
    playCoin() {
        if (!this.enabled || !this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, this.audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.12);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.12);
    },

    /** 播放碰撞/游戏结束音效 */
    playHit() {
        if (!this.enabled || !this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.35);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.35);
    },

    /** 播放按钮点击音效 */
    playClick() {
        if (!this.enabled || !this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.06);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.06);
    },

    /** 开始背景音乐（简单旋律循环） */
    startBgMusic() {
        if (!this.bgMusicEnabled || !this.audioCtx || this.bgOscillator) return;
        // 使用低音量的柔和音调作为背景音乐
        this.bgGain = this.audioCtx.createGain();
        this.bgGain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
        this.bgGain.connect(this.audioCtx.destination);

        // 循环播放简单旋律
        this._playBgMelody();
    },

    _playBgMelody() {
        if (!this.bgMusicEnabled || !this.audioCtx) return;
        const notes = [262, 294, 330, 349, 392, 349, 330, 294]; // C D E F G F E D
        const noteLen = 0.25;
        const now = this.audioCtx.currentTime;

        notes.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const noteGain = this.audioCtx.createGain();
            osc.connect(noteGain);
            noteGain.connect(this.bgGain);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * noteLen);
            noteGain.gain.setValueAtTime(0.5, now + i * noteLen);
            noteGain.gain.exponentialRampToValueAtTime(0.01, now + i * noteLen + noteLen * 0.9);
            osc.start(now + i * noteLen);
            osc.stop(now + i * noteLen + noteLen);
        });

        // 循环
        this._bgMelodyTimer = setTimeout(() => this._playBgMelody(), notes.length * noteLen * 1000);
    },

    /** 停止背景音乐 */
    stopBgMusic() {
        if (this._bgMelodyTimer) {
            clearTimeout(this._bgMelodyTimer);
            this._bgMelodyTimer = null;
        }
    },

    /** 切换音效开关 */
    toggleSound() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopBgMusic();
        }
        // 更新按钮文字
        const btn = document.getElementById('soundToggleBtn');
        if (btn) {
            btn.textContent = this.enabled ? '🔊 音效' : '🔇 静音';
        }
        return this.enabled;
    },
};

// ============================================================
// 难度配置系统（由 B 岗美术设计实现）
// ============================================================
const DIFFICULTY_PRESETS = {
    easy: {
        label: '🌿 简单',
        desc: '速度慢，障碍少，适合新手',
        OBS_SPEED: 3.5,
        JUMP_FORCE: -15,
        GRAVITY: 0.55,
        OBS_INTERVAL_MIN: 130,
        OBS_INTERVAL_MAX: 220,
        COIN_INTERVAL_MIN: 50,
        COIN_INTERVAL_MAX: 90,
        SPEED_UP_INTERVAL: 400,
        SPEED_UP_AMOUNT: 0.2,
    },
    normal: {
        label: '🍄 普通',
        desc: '标准速度，平衡体验',
        OBS_SPEED: 5,
        JUMP_FORCE: -14,
        GRAVITY: 0.6,
        OBS_INTERVAL_MIN: 90,
        OBS_INTERVAL_MAX: 160,
        COIN_INTERVAL_MIN: 60,
        COIN_INTERVAL_MAX: 120,
        SPEED_UP_INTERVAL: 300,
        SPEED_UP_AMOUNT: 0.3,
    },
    hard: {
        label: '🔥 困难',
        desc: '高速狂奔，障碍密集，挑战极限',
        OBS_SPEED: 7,
        JUMP_FORCE: -13,
        GRAVITY: 0.65,
        OBS_INTERVAL_MIN: 55,
        OBS_INTERVAL_MAX: 100,
        COIN_INTERVAL_MIN: 70,
        COIN_INTERVAL_MAX: 140,
        SPEED_UP_INTERVAL: 200,
        SPEED_UP_AMOUNT: 0.4,
    },
};

// 当前选择的难度
let currentDifficulty = 'normal';

// ============================================================
// 游戏常量配置（方便调整游戏难度）
// ============================================================
const CONFIG = {
    // 地面 Y 坐标（相对 canvas 底部）
    GROUND_Y: canvas.height - 50,

    // 玩家设置
    PLAYER_X:       60,
    PLAYER_W:       40,
    PLAYER_H:       50,
    JUMP_FORCE:    -14,    // 跳跃初速度（负数=向上），会被难度覆盖
    GRAVITY:         0.6,  // 重力加速度，会被难度覆盖

    // 障碍物设置
    OBS_W_MIN:  20,
    OBS_W_MAX:  35,
    OBS_H_MIN:  35,
    OBS_H_MAX:  70,
    OBS_SPEED:   5,       // 初始移动速度，会被难度覆盖

    // 金币设置
    COIN_R:      12,      // 金币半径
    COIN_SPEED:   5,

    // 难度随时间加速（每 N 帧增加速度），会被难度覆盖
    SPEED_UP_INTERVAL: 300,
    SPEED_UP_AMOUNT:   0.3,

    // 障碍物生成间隔（帧数），会被难度覆盖
    OBS_INTERVAL_MIN: 90,
    OBS_INTERVAL_MAX: 160,

    // 金币生成间隔（帧数），会被难度覆盖
    COIN_INTERVAL_MIN: 60,
    COIN_INTERVAL_MAX: 120,

    // 分数：每帧 + 基础分，收金币 + 10
    SCORE_PER_FRAME: 1,
    COIN_SCORE:      10,
};

/** 应用难度预设到 CONFIG */
function applyDifficulty(difficulty) {
    const preset = DIFFICULTY_PRESETS[difficulty];
    if (!preset) return;
    currentDifficulty = difficulty;
    CONFIG.OBS_SPEED = preset.OBS_SPEED;
    CONFIG.JUMP_FORCE = preset.JUMP_FORCE;
    CONFIG.GRAVITY = preset.GRAVITY;
    CONFIG.OBS_INTERVAL_MIN = preset.OBS_INTERVAL_MIN;
    CONFIG.OBS_INTERVAL_MAX = preset.OBS_INTERVAL_MAX;
    CONFIG.COIN_INTERVAL_MIN = preset.COIN_INTERVAL_MIN;
    CONFIG.COIN_INTERVAL_MAX = preset.COIN_INTERVAL_MAX;
    CONFIG.SPEED_UP_INTERVAL = preset.SPEED_UP_INTERVAL;
    CONFIG.SPEED_UP_AMOUNT = preset.SPEED_UP_AMOUNT;
    console.log('[难度] 已切换为:', preset.label);
}

// ============================================================
// 游戏状态变量
// ============================================================
let gameState = 'idle';  // 'idle' | 'running' | 'paused' | 'over'

// 玩家对象
const player = {
    x:       CONFIG.PLAYER_X,
    y:       CONFIG.GROUND_Y - CONFIG.PLAYER_H,
    w:       CONFIG.PLAYER_W,
    h:       CONFIG.PLAYER_H,
    vy:      0,          // 垂直速度
    onGround: true,      // 是否在地面上
    jumpCount: 0,        // 已跳跃次数（支持二段跳）
    MAX_JUMPS: 2,        // 最多跳几段
    frame: 0,            // 动画帧计数（用于角色动画）
};

// 分数 & 金币 & 距离
let score    = 0;
let coins    = 0;
let distance = 0;
let frameCount = 0;      // 当前帧计数

// 游戏速度（会随时间增加）
let gameSpeed = CONFIG.OBS_SPEED;

// 障碍物数组
let obstacles = [];
let nextObsFrame = 0;  // 下次生成障碍物的帧数

// 金币数组
let coinList = [];
let nextCoinFrame = 0;

// 粒子效果数组（金币收集特效等）
let particles = [];

// 背景滚动偏移
let bgOffset = 0;
let cloudOffset = 0;

// 云朵数据
const clouds = [
    { x: 100, y: 30, w: 60, speed: 0.3 },
    { x: 300, y: 50, w: 45, speed: 0.2 },
    { x: 500, y: 25, w: 70, speed: 0.35 },
    { x: 700, y: 45, w: 55, speed: 0.25 },
];

// ============================================================
// 工具函数
// ============================================================

/** 返回 [min, max] 之间的随机整数 */
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 矩形碰撞检测（AABB） */
function rectsCollide(r1, r2) {
    return (
        r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y
    );
}

/** 矩形与圆形碰撞检测 */
function rectCircleCollide(rect, circle) {
    const nearX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const nearY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - nearX;
    const dy = circle.y - nearY;
    return (dx * dx + dy * dy) < (circle.r * circle.r);
}

// ============================================================
// 粒子效果系统（由 B 岗美术设计实现）
// ============================================================

/** 创建金币收集粒子 */
function spawnCoinParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            life: 20,
            maxLife: 20,
            color: Math.random() > 0.5 ? '#FFE066' : '#F4A261',
            size: Math.random() * 3 + 2,
        });
    }
}

/** 创建碰撞粒子 */
function spawnHitParticles(x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 25,
            maxLife: 25,
            color: Math.random() > 0.5 ? '#e76f51' : '#ff6b6b',
            size: Math.random() * 4 + 2,
        });
    }
}

/** 更新和绘制粒子 */
function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // 粒子重力
        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ============================================================
// 游戏初始化 / 重置
// ============================================================
function initGame() {
    // 重置玩家
    player.y       = CONFIG.GROUND_Y - CONFIG.PLAYER_H;
    player.vy      = 0;
    player.onGround = true;
    player.jumpCount = 0;
    player.frame   = 0;

    // 清空数组，重置变量
    obstacles     = [];
    coinList      = [];
    particles     = [];
    score         = 0;
    coins         = 0;
    distance      = 0;
    frameCount    = 0;
    gameSpeed     = CONFIG.OBS_SPEED;
    bgOffset      = 0;
    cloudOffset   = 0;
    nextObsFrame  = randInt(CONFIG.OBS_INTERVAL_MIN, CONFIG.OBS_INTERVAL_MAX);
    nextCoinFrame = randInt(CONFIG.COIN_INTERVAL_MIN, CONFIG.COIN_INTERVAL_MAX);

    // 更新 HUD 显示
    updateHUD();
}

// ============================================================
// 跳跃处理
// ============================================================
function jump() {
    if (gameState !== 'running') return;

    // 支持二段跳
    if (player.jumpCount < player.MAX_JUMPS) {
        player.vy = CONFIG.JUMP_FORCE;
        player.onGround = false;
        player.jumpCount++;
        AudioSystem.playJump(); // 播放跳跃音效
    }
}

// ============================================================
// 更新 HUD 显示（分数板）
// ============================================================
function updateHUD() {
    const scoreEl = document.getElementById('scoreDisplay');
    const coinEl  = document.getElementById('coinDisplay');
    const distEl  = document.getElementById('distDisplay');
    if (scoreEl) scoreEl.textContent = score;
    if (coinEl)  coinEl.textContent  = coins;
    if (distEl)  distEl.textContent  = distance;
}

// ============================================================
// 游戏主循环：更新逻辑
// ============================================================
function update() {
    frameCount++;
    player.frame++;
    distance = Math.floor(frameCount / 10);  // 每10帧 = 1米

    // ------ 1. 速度提升（随时间加速） ------
    if (frameCount % CONFIG.SPEED_UP_INTERVAL === 0) {
        gameSpeed += CONFIG.SPEED_UP_AMOUNT;
    }

    // ------ 2. 玩家物理（重力 + 跳跃） ------
    player.vy += CONFIG.GRAVITY;          // 重力加速
    player.y  += player.vy;              // 更新位置

    // 落地检测
    if (player.y >= CONFIG.GROUND_Y - player.h) {
        player.y       = CONFIG.GROUND_Y - player.h;
        player.vy      = 0;
        player.onGround = true;
        player.jumpCount = 0;
    }

    // ------ 3. 分数增加 ------
    score += CONFIG.SCORE_PER_FRAME;

    // ------ 4. 生成障碍物 ------
    if (frameCount >= nextObsFrame) {
        const h = randInt(CONFIG.OBS_H_MIN, CONFIG.OBS_H_MAX);
        const w = randInt(CONFIG.OBS_W_MIN, CONFIG.OBS_W_MAX);
        obstacles.push({
            x: canvas.width + 10,
            y: CONFIG.GROUND_Y - h,
            w: w,
            h: h,
        });
        nextObsFrame = frameCount + randInt(CONFIG.OBS_INTERVAL_MIN, CONFIG.OBS_INTERVAL_MAX);
    }

    // ------ 5. 移动并检测障碍物 ------
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;

        // 碰撞检测：玩家 vs 障碍物
        if (rectsCollide(player, obstacles[i])) {
            triggerGameOver();
            return;
        }

        // 移出屏幕左侧，删除
        if (obstacles[i].x + obstacles[i].w < 0) {
            obstacles.splice(i, 1);
        }
    }

    // ------ 6. 生成金币 ------
    if (frameCount >= nextCoinFrame) {
        // 金币出现在地面上方随机高度
        const coinY = CONFIG.GROUND_Y - CONFIG.COIN_R - randInt(0, 80);
        coinList.push({
            x: canvas.width + 10,
            y: coinY,
            r: CONFIG.COIN_R,
            angle: 0, // 金币旋转角度
        });
        nextCoinFrame = frameCount + randInt(CONFIG.COIN_INTERVAL_MIN, CONFIG.COIN_INTERVAL_MAX);
    }

    // ------ 7. 移动并检测金币 ------
    for (let i = coinList.length - 1; i >= 0; i--) {
        coinList[i].x -= gameSpeed;
        coinList[i].angle += 0.05; // 金币旋转动画

        // 玩家收集金币
        if (rectCircleCollide(player, coinList[i])) {
            coins++;
            score += CONFIG.COIN_SCORE;
            spawnCoinParticles(coinList[i].x, coinList[i].y); // 金币收集粒子特效
            AudioSystem.playCoin(); // 播放金币音效
            coinList.splice(i, 1);
            continue;
        }

        // 移出屏幕
        if (coinList[i].x + coinList[i].r < 0) {
            coinList.splice(i, 1);
        }
    }

    // ------ 8. 背景偏移 ------
    bgOffset = (bgOffset + gameSpeed * 0.3) % canvas.width;
    cloudOffset = (cloudOffset + 0.3) % (canvas.width + 200);

    // ------ 9. 更新 HUD ------
    updateHUD();
}

// ============================================================
// 游戏渲染（使用图片素材，由 B 岗美术设计实现）
// ============================================================
function render() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ---- 绘制天空背景（渐变） ----
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0,   '#87CEEB');
    skyGrad.addColorStop(0.5, '#b8e4f0');
    skyGrad.addColorStop(0.8, '#c8e6ff');
    skyGrad.addColorStop(1,   '#e8f5e9');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ---- 绘制云朵（B 岗新增） ----
    drawClouds();

    // ---- 绘制远景山丘（B 岗新增） ----
    drawHills();

    // ---- 绘制远景树木（背景装饰） ----
    drawBgTrees();

    // ---- 绘制地面 ----
    drawGround();

    // ---- 绘制金币 ----
    coinList.forEach(c => drawCoin(c));

    // ---- 绘制障碍物 ----
    obstacles.forEach(o => drawObstacle(o));

    // ---- 绘制粒子特效 ----
    updateAndDrawParticles();

    // ---- 绘制玩家 ----
    drawPlayer();

    // ---- 游戏暂停时显示文字 ----
    if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px ZCOOL KuaiLe, Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText('⏸ 已暂停', canvas.width / 2, canvas.height / 2);
        ctx.font = '18px ZCOOL KuaiLe, Microsoft YaHei';
        ctx.fillText('按 P 键继续游戏', canvas.width / 2, canvas.height / 2 + 40);
    }
}

// ---- 绘制玩家（使用图片素材，B 岗实现） ----
function drawPlayer() {
    const p = player;

    // 尝试使用图片渲染
    if (IMAGES.player && IMAGES.player.complete && IMAGES.player.naturalWidth > 0) {
        // 跑步时轻微上下晃动
        const bounce = player.onGround ? Math.sin(player.frame * 0.15) * 2 : 0;
        // 跳跃时缩小宽度模拟旋转
        const scaleX = player.onGround ? 1 : (0.85 + Math.sin(player.frame * 0.2) * 0.15);

        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h + bounce);
        ctx.scale(scaleX, 1);
        ctx.drawImage(IMAGES.player, -p.w / 2 - 4, -p.h - 10, p.w + 8, p.h + 10);
        ctx.restore();
    } else {
        // 降级：Canvas 绘制（与原来兼容）
        const bounce = player.onGround ? Math.sin(player.frame * 0.15) * 2 : 0;

        ctx.fillStyle = '#2d6a4f';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y + bounce, p.w, p.h, 6);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(p.x + p.w * 0.65, p.y + p.h * 0.25 + bounce, 7, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.ellipse(p.x + p.w * 0.67, p.y + p.h * 0.25 + bounce, 4, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 笑脸
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x + p.w * 0.5, p.y + p.h * 0.55 + bounce, 8, 0, Math.PI);
        ctx.stroke();

        // 帽子
        ctx.fillStyle = '#40916c';
        ctx.fillRect(p.x + 4, p.y - 8 + bounce, p.w - 8, 8);
        ctx.fillStyle = '#52b788';
        ctx.fillRect(p.x - 4, p.y - 4 + bounce, p.w + 8, 4);
    }
}

// ---- 绘制障碍物（使用图片素材，B 岗实现） ----
function drawObstacle(obs) {
    // 尝试使用图片渲染
    if (IMAGES.obstacle && IMAGES.obstacle.complete && IMAGES.obstacle.naturalWidth > 0) {
        // 根据障碍物高度缩放图片
        const imgW = obs.w + 8;
        const imgH = obs.h + 16;
        ctx.drawImage(IMAGES.obstacle, obs.x - 4, obs.y - 16, imgW, imgH);
    } else {
        // 降级：Canvas 绘制
        const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.w, obs.y);
        grad.addColorStop(0, '#8B5E3C');
        grad.addColorStop(0.5, '#A0714F');
        grad.addColorStop(1, '#8B5E3C');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 4);
        ctx.fill();

        ctx.strokeStyle = '#6B4423';
        ctx.lineWidth = 1.5;
        for (let i = obs.h * 0.2; i < obs.h * 0.9; i += obs.h * 0.2) {
            ctx.beginPath();
            ctx.moveTo(obs.x + 4, obs.y + i);
            ctx.lineTo(obs.x + obs.w - 4, obs.y + i);
            ctx.stroke();
        }

        ctx.fillStyle = '#52b788';
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.w / 2, obs.y + 2, obs.w / 2 + 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ---- 绘制金币（使用图片素材，B 岗实现） ----
function drawCoin(c) {
    // 旋转动画 - 金币缩放效果
    const scaleX = Math.abs(Math.cos(c.angle || 0));

    // 尝试使用图片渲染
    if (IMAGES.coin && IMAGES.coin.complete && IMAGES.coin.naturalWidth > 0) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(scaleX, 1);

        // 光晕效果
        ctx.beginPath();
        ctx.arc(0, 0, c.r + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fill();

        ctx.drawImage(IMAGES.coin, -c.r - 2, -c.r - 2, c.r * 2 + 4, c.r * 2 + 4);
        ctx.restore();
    } else {
        // 降级：Canvas 绘制
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(scaleX, 1);

        // 外圈光晕
        ctx.beginPath();
        ctx.arc(0, 0, c.r + 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.fill();

        // 金币本体
        const coinGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, c.r);
        coinGrad.addColorStop(0, '#FFE066');
        coinGrad.addColorStop(1, '#F4A261');
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, Math.PI * 2);
        ctx.fillStyle = coinGrad;
        ctx.fill();

        // 金币符号
        ctx.fillStyle = '#9B5523';
        ctx.font = `bold ${c.r}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('¥', 0, 0);
        ctx.restore();
    }
}

// ---- 绘制地面（B 岗增强） ----
function drawGround() {
    const y = CONFIG.GROUND_Y;

    // 地面主体（深绿）
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(0, y, canvas.width, 8);

    // 地面草皮纹理（增强版 - 更多草的种类）
    for (let x = -bgOffset % 20; x < canvas.width; x += 20) {
        // 高草
        ctx.fillStyle = '#52b788';
        ctx.beginPath();
        ctx.ellipse(x, y, 5, 6, 0, 0, Math.PI, true);
        ctx.fill();

        // 矮草
        ctx.fillStyle = '#74c69d';
        ctx.beginPath();
        ctx.ellipse(x + 10, y, 4, 4, 0, 0, Math.PI, true);
        ctx.fill();
    }

    // 小花装饰
    for (let x = -bgOffset % 80; x < canvas.width; x += 80) {
        ctx.fillStyle = '#f4a261';
        ctx.beginPath();
        ctx.arc(x + 40, y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e9c46a';
        ctx.beginPath();
        ctx.arc(x + 45, y - 1, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // 地面土层
    const soilGrad = ctx.createLinearGradient(0, y + 8, 0, canvas.height);
    soilGrad.addColorStop(0, '#8B6914');
    soilGrad.addColorStop(1, '#5c4a1e');
    ctx.fillStyle = soilGrad;
    ctx.fillRect(0, y + 8, canvas.width, canvas.height - y - 8);
}

// ---- 绘制背景树木（B 岗增强） ----
function drawBgTrees() {
    const trees = [
        { baseX: 100, size: 1.0 }, { baseX: 260, size: 0.8 },
        { baseX: 420, size: 1.1 }, { baseX: 580, size: 0.9 },
        { baseX: 720, size: 1.0 }, { baseX: 50, size: 0.7 },
    ];
    trees.forEach(t => {
        const x = ((t.baseX - bgOffset * 0.2) % (canvas.width + 100)) - 50;
        const y = CONFIG.GROUND_Y - 90;
        const s = t.size;

        // 树干
        ctx.fillStyle = '#8B5E3C';
        ctx.fillRect(x + 18 * s, y + 50, 10 * s, 40);

        // 树冠（多层）
        ctx.fillStyle = 'rgba(45, 106, 79, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 23 * s, y + 25, 30 * s, 38 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(82, 183, 136, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x + 23 * s, y + 30, 25 * s, 32 * s, 0, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ---- 绘制云朵（B 岗新增） ----
function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    clouds.forEach(c => {
        const x = ((c.x - cloudOffset * c.speed) % (canvas.width + 200)) - 100;
        // 云朵由多个圆组成
        ctx.beginPath();
        ctx.arc(x, c.y, c.w * 0.3, 0, Math.PI * 2);
        ctx.arc(x + c.w * 0.25, c.y - c.w * 0.1, c.w * 0.35, 0, Math.PI * 2);
        ctx.arc(x + c.w * 0.55, c.y, c.w * 0.3, 0, Math.PI * 2);
        ctx.arc(x + c.w * 0.3, c.y + c.w * 0.05, c.w * 0.25, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ---- 绘制远景山丘（B 岗新增） ----
function drawHills() {
    const y = CONFIG.GROUND_Y;

    // 远山层（更淡的颜色）
    ctx.fillStyle = 'rgba(116, 198, 157, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= canvas.width; x += 5) {
        const hillY = y - 60 - Math.sin((x + bgOffset * 0.1) * 0.008) * 25
                              - Math.sin((x + bgOffset * 0.1) * 0.015) * 15;
        ctx.lineTo(x, hillY);
    }
    ctx.lineTo(canvas.width, y);
    ctx.closePath();
    ctx.fill();

    // 近山层
    ctx.fillStyle = 'rgba(64, 145, 108, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= canvas.width; x += 5) {
        const hillY = y - 35 - Math.sin((x + bgOffset * 0.15) * 0.012) * 18
                              - Math.sin((x + bgOffset * 0.15) * 0.02) * 10;
        ctx.lineTo(x, hillY);
    }
    ctx.lineTo(canvas.width, y);
    ctx.closePath();
    ctx.fill();
}

// ============================================================
// 游戏结束处理
// ============================================================
function triggerGameOver() {
    gameState = 'over';

    // 碰撞粒子效果
    spawnHitParticles(player.x + player.w / 2, player.y + player.h / 2);
    AudioSystem.playHit(); // 播放碰撞音效
    AudioSystem.stopBgMusic(); // 停止背景音乐

    // 更新结算面板数据
    const finalScoreEl = document.getElementById('finalScore');
    const finalCoinsEl = document.getElementById('finalCoins');
    const finalDistEl  = document.getElementById('finalDist');
    if (finalScoreEl) finalScoreEl.textContent = score;
    if (finalCoinsEl) finalCoinsEl.textContent = coins;
    if (finalDistEl)  finalDistEl.textContent  = distance + 'm';

    // 显示游戏结束遮罩
    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) overlay.classList.remove('hidden');

    // 禁用暂停按钮
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.disabled = true;

    // 自动向服务器提交成绩
    submitScore();
}

// ============================================================
// 提交成绩到服务器
// ============================================================
function submitScore() {
    fetch('/score/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            score:    score,
            coins:    coins,
            distance: distance,
            difficulty: currentDifficulty,
            play_time: Math.floor(frameCount / 60),
        }),
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('[成绩] 提交成功:', data.message);
        }
    })
    .catch(err => {
        console.warn('[成绩] 提交失败（可能未登录）:', err);
    });
}

// ============================================================
// 主游戏循环（requestAnimationFrame）
// ============================================================
function gameLoop() {
    if (gameState === 'running') {
        update();
        render();
    } else if (gameState === 'paused') {
        render();   // 暂停时还渲染，显示暂停画面
    } else if (gameState === 'over') {
        render();   // 游戏结束也渲染，显示粒子效果
    }
    requestAnimationFrame(gameLoop);
}

// ============================================================
// 对外暴露的控制函数（供 HTML 按钮调用）
// ============================================================

/** 开始游戏 */
function startGame() {
    AudioSystem.init(); // 用户交互后初始化音频
    initGame();
    gameState = 'running';

    // 隐藏开始遮罩和难度选择
    const startOverlay = document.getElementById('startOverlay');
    if (startOverlay) startOverlay.classList.add('hidden');

    const difficultyPanel = document.getElementById('difficultyPanel');
    if (difficultyPanel) difficultyPanel.classList.add('hidden');

    // 启用暂停按钮
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.disabled = false;

    // 播放背景音乐
    AudioSystem.startBgMusic();
}

/** 暂停 / 继续切换 */
function togglePause() {
    if (gameState === 'running') {
        gameState = 'paused';
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.textContent = '▶ 继续';
        AudioSystem.stopBgMusic();
    } else if (gameState === 'paused') {
        gameState = 'running';
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.textContent = '⏸ 暂停';
        AudioSystem.startBgMusic();
    }
}

/** 重新开始 */
function restartGame() {
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
    startGame();
}

/** 选择难度（B 岗新增） */
function selectDifficulty(difficulty) {
    applyDifficulty(difficulty);
    AudioSystem.init();
    AudioSystem.playClick();

    // 更新难度按钮选中状态
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.remove('diff-btn-active');
    });
    const activeBtn = document.getElementById('diff-btn-' + difficulty);
    if (activeBtn) activeBtn.classList.add('diff-btn-active');

    // 更新难度显示
    const diffDisplay = document.getElementById('diffDisplay');
    if (diffDisplay) diffDisplay.textContent = DIFFICULTY_PRESETS[difficulty].label;
}

/** 切换音效开关（B 岗新增） */
function toggleSoundBtn() {
    AudioSystem.init();
    AudioSystem.toggleSound();
}

// ============================================================
// 键盘事件监听
// ============================================================
document.addEventListener('keydown', function(e) {
    // 空格或 ↑ 键：跳跃
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();   // 防止页面滚动
        if (gameState === 'idle' || gameState === 'over') {
            // 在开始/结束页面时，直接开始/重启游戏
            if (gameState === 'idle') startGame();
            else restartGame();
        } else {
            jump();
        }
    }

    // P 键：暂停/继续
    if (e.code === 'KeyP') {
        togglePause();
    }

    // R 键：重新开始
    if (e.code === 'KeyR') {
        restartGame();
    }
});

// ============================================================
// 页面加载完毕后启动游戏循环
// ============================================================
window.addEventListener('DOMContentLoaded', function() {
    // 加载图片素材
    loadGameImages();

    // 画初始画面
    render();

    // 启动游戏主循环
    requestAnimationFrame(gameLoop);
});
