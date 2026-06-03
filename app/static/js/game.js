/**
 * game.js —— 森林酷跑游戏核心逻辑
 * 使用 HTML5 Canvas 实现 2D 横版跑酷小游戏
 *
 * 由【成员一：游戏核心逻辑】负责完善和扩展
 * 由【成员二：美术设计】负责替换矩形为图片素材
 *
 * 游戏结构：
 *   - 玩家（绿色矩形）：可以跳跃
 *   - 障碍物（棕色矩形）：从右向左移动，碰撞游戏结束
 *   - 金币（黄色圆形）：收集加分
 *   - 地面：绿色横条
 *   - 分数：随时间自动增加
 */

// ============================================================
// 获取 Canvas 和 2D 上下文
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

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
    JUMP_FORCE:    -14,    // 跳跃初速度（负数=向上）
    GRAVITY:         0.6,  // 重力加速度

    // 障碍物设置
    OBS_W_MIN:  20,
    OBS_W_MAX:  35,
    OBS_H_MIN:  35,
    OBS_H_MAX:  70,
    OBS_SPEED:   5,       // 初始移动速度

    // 金币设置
    COIN_R:      12,      // 金币半径
    COIN_SPEED:   5,

    // 难度随时间加速（每 N 帧增加速度）
    SPEED_UP_INTERVAL: 300,
    SPEED_UP_AMOUNT:   0.3,

    // 障碍物生成间隔（帧数）
    OBS_INTERVAL_MIN: 90,
    OBS_INTERVAL_MAX: 160,

    // 金币生成间隔（帧数）
    COIN_INTERVAL_MIN: 60,
    COIN_INTERVAL_MAX: 120,

    // 分数：每帧 + 基础分，收金币 + 10
    SCORE_PER_FRAME: 1,
    COIN_SCORE:      10,
};

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

// 背景滚动偏移
let bgOffset = 0;

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
// 游戏初始化 / 重置
// ============================================================
function initGame() {
    // 重置玩家
    player.y       = CONFIG.GROUND_Y - CONFIG.PLAYER_H;
    player.vy      = 0;
    player.onGround = true;
    player.jumpCount = 0;

    // 清空数组，重置变量
    obstacles     = [];
    coinList      = [];
    score         = 0;
    coins         = 0;
    distance      = 0;
    frameCount    = 0;
    gameSpeed     = CONFIG.OBS_SPEED;
    bgOffset      = 0;
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
        });
        nextCoinFrame = frameCount + randInt(CONFIG.COIN_INTERVAL_MIN, CONFIG.COIN_INTERVAL_MAX);
    }

    // ------ 7. 移动并检测金币 ------
    for (let i = coinList.length - 1; i >= 0; i--) {
        coinList[i].x -= gameSpeed;

        // 玩家收集金币
        if (rectCircleCollide(player, coinList[i])) {
            coins++;
            score += CONFIG.COIN_SCORE;
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

    // ------ 9. 更新 HUD ------
    updateHUD();
}

// ============================================================
// 游戏渲染
// ============================================================
function render() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ---- 绘制天空背景（渐变） ----
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0,   '#87CEEB');
    skyGrad.addColorStop(0.7, '#c8e6ff');
    skyGrad.addColorStop(1,   '#e8f5e9');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ---- 绘制远景树木（背景装饰） ----
    drawBgTrees();

    // ---- 绘制地面 ----
    drawGround();

    // ---- 绘制金币 ----
    coinList.forEach(c => drawCoin(c));

    // ---- 绘制障碍物 ----
    obstacles.forEach(o => drawObstacle(o));

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

// ---- 绘制玩家（绿色小人矩形，后续替换为图片） ----
function drawPlayer() {
    const p = player;

    // 身体：深绿色
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, 6);
    ctx.fill();

    // 眼睛（白色）
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(p.x + p.w * 0.65, p.y + p.h * 0.25, 7, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 瞳孔
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(p.x + p.w * 0.67, p.y + p.h * 0.25, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 笑脸
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x + p.w * 0.5, p.y + p.h * 0.55, 8, 0, Math.PI);
    ctx.stroke();

    // 帽子
    ctx.fillStyle = '#40916c';
    ctx.fillRect(p.x + 4, p.y - 8, p.w - 8, 8);
    ctx.fillStyle = '#52b788';
    ctx.fillRect(p.x - 4, p.y - 4, p.w + 8, 4);
}

// ---- 绘制障碍物（棕色树桩，后续替换为图片） ----
function drawObstacle(obs) {
    // 树桩身体
    const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.w, obs.y);
    grad.addColorStop(0, '#8B5E3C');
    grad.addColorStop(0.5, '#A0714F');
    grad.addColorStop(1, '#8B5E3C');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 4);
    ctx.fill();

    // 树桩纹路
    ctx.strokeStyle = '#6B4423';
    ctx.lineWidth = 1.5;
    for (let i = obs.h * 0.2; i < obs.h * 0.9; i += obs.h * 0.2) {
        ctx.beginPath();
        ctx.moveTo(obs.x + 4, obs.y + i);
        ctx.lineTo(obs.x + obs.w - 4, obs.y + i);
        ctx.stroke();
    }

    // 顶部绿叶
    ctx.fillStyle = '#52b788';
    ctx.beginPath();
    ctx.ellipse(obs.x + obs.w / 2, obs.y + 2, obs.w / 2 + 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
}

// ---- 绘制金币（黄色圆形，后续替换为图片） ----
function drawCoin(c) {
    // 外圈光晕
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.fill();

    // 金币本体
    const coinGrad = ctx.createRadialGradient(c.x - 3, c.y - 3, 2, c.x, c.y, c.r);
    coinGrad.addColorStop(0, '#FFE066');
    coinGrad.addColorStop(1, '#F4A261');
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fillStyle = coinGrad;
    ctx.fill();

    // 金币符号
    ctx.fillStyle = '#9B5523';
    ctx.font = `bold ${c.r}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¥', c.x, c.y);
}

// ---- 绘制地面 ----
function drawGround() {
    const y = CONFIG.GROUND_Y;

    // 地面主体（深绿）
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(0, y, canvas.width, 8);

    // 地面草皮纹理
    ctx.fillStyle = '#52b788';
    for (let x = -bgOffset % 30; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.ellipse(x, y, 8, 5, 0, 0, Math.PI, true);
        ctx.fill();
    }

    // 地面土层
    const soilGrad = ctx.createLinearGradient(0, y + 8, 0, canvas.height);
    soilGrad.addColorStop(0, '#8B6914');
    soilGrad.addColorStop(1, '#5c4a1e');
    ctx.fillStyle = soilGrad;
    ctx.fillRect(0, y + 8, canvas.width, canvas.height - y - 8);
}

// ---- 绘制背景树木（简单远景） ----
function drawBgTrees() {
    const trees = [
        { baseX: 100 }, { baseX: 260 }, { baseX: 420 },
        { baseX: 580 }, { baseX: 720 }, { baseX: 50 },
    ];
    trees.forEach(t => {
        const x = ((t.baseX - bgOffset * 0.2) % (canvas.width + 100)) - 50;
        const y = CONFIG.GROUND_Y - 90;
        // 树干
        ctx.fillStyle = '#8B5E3C';
        ctx.fillRect(x + 18, y + 50, 10, 40);
        // 树冠
        ctx.fillStyle = 'rgba(82, 183, 136, 0.5)';
        ctx.beginPath();
        ctx.ellipse(x + 23, y + 30, 28, 35, 0, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ============================================================
// 游戏结束处理
// ============================================================
function triggerGameOver() {
    gameState = 'over';

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
            difficulty: 'normal',
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
    }
    requestAnimationFrame(gameLoop);
}

// ============================================================
// 对外暴露的控制函数（供 HTML 按钮调用）
// ============================================================

/** 开始游戏 */
function startGame() {
    initGame();
    gameState = 'running';

    // 隐藏开始遮罩
    const startOverlay = document.getElementById('startOverlay');
    if (startOverlay) startOverlay.classList.add('hidden');

    // 启用暂停按钮
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.disabled = false;
}

/** 暂停 / 继续切换 */
function togglePause() {
    if (gameState === 'running') {
        gameState = 'paused';
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.textContent = '▶ 继续';
    } else if (gameState === 'paused') {
        gameState = 'running';
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.textContent = '⏸ 暂停';
    }
}

/** 重新开始 */
function restartGame() {
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
    startGame();
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
    // 画初始画面
    render();
    // 启动游戏主循环
    requestAnimationFrame(gameLoop);
});
