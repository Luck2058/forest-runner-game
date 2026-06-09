/**
 * game.js —— 游戏主控模块（入口 & 主循环）
 *
 * 职责：
 *   - 游戏状态管理（idle / running / paused / over）
 *   - 游戏初始化与重置
 *   - 主循环 update() + render()
 *   - 难度选择系统
 *   - 键盘/按钮事件绑定
 *   - 页面加载启动
 *
 * 模块依赖关系：
 *   config.js  ← 全局 CONFIG 常量 & 工具函数（必须最先加载）
 *   player.js  ← 玩家角色（跳跃、下滑、绘制）
 *   obstacle.js ← 障碍物+金币+背景（生成、移动、碰撞、绘制）
 *   score.js   ← 分数统计（计分、HUD更新、结算面板）
 *   api.js     ← 后端通信（成绩提交）
 *
 * 加载顺序（在 game.html 中）：
 *   config.js → player.js → obstacle.js → score.js → api.js → game.js（本文件最后加载）
 */

// ============================================================
// 游戏状态变量
// ============================================================;          // 'idle' | 'running' | 'paused' | 'over'
let frameCount = 0;              // 当前帧计数
let gameSpeed  = CONFIG.OBS_SPEED; // 当前游戏速度（会随时间增加）

/** 当前难度标识 */
let currentDifficulty = 'normal';

// ============================================================
// 难度配置预设（影响游戏参数）
const DIFFICULTY_PRESETS = {
    easy: {
        OBS_SPEED:         2.5,
        SPEED_UP_AMOUNT:   0.08,
        OBS_INTERVAL_MIN: 140,
        OBS_INTERVAL_MAX: 240,
        AIR_OBS_CHANCE:    0.10,
        COIN_INTERVAL_MIN:  50,
        COIN_INTERVAL_MAX: 100,
        label: '简单',
    },
    normal: {
        OBS_SPEED:         3.5,
        SPEED_UP_AMOUNT:   0.12,
        OBS_INTERVAL_MIN: 100,
        OBS_INTERVAL_MAX: 180,
        AIR_OBS_CHANCE:    0.25,
        COIN_INTERVAL_MIN:  60,
        COIN_INTERVAL_MAX: 120,
        label: '普通',
    },
    hard: {
        OBS_SPEED:         5,
        SPEED_UP_AMOUNT:   0.20,
        OBS_INTERVAL_MIN:  70,
        OBS_INTERVAL_MAX: 140,
        AIR_OBS_CHANCE:    0.35,
        COIN_INTERVAL_MIN:  70,
        COIN_INTERVAL_MAX: 140,
        label: '困难',
    },
};

// ============================================================
// 游戏初始化 / 重置（调用各子模块的 init 函数）
// ============================================================
function initGame() {
    gameState  = 'idle';
    frameCount = 0;
    gameSpeed  = CONFIG.OBS_SPEED;

    // 调用各子模块的重置函数
    initPlayer();        // ← player.js
    initObstacles();     // ← obstacle.js
    initScore();         // ← score.js

    // 刷新 HUD 显示
    updateHUD();
}

// ============================================================
// 游戏主循环：每帧更新逻辑
// ============================================================
function update() {
    frameCount++;

    // ------ 1. 速度提升（随时间加速，有上限）------
    if (frameCount % CONFIG.SPEED_UP_INTERVAL === 0) {
        gameSpeed += CONFIG.SPEED_UP_AMOUNT;
        if (gameSpeed > CONFIG.MAX_SPEED) {
            gameSpeed = CONFIG.MAX_SPEED;
        }
    }

    // ------ 2. 玩家物理（重力 + 跳跃 + 下滑）------
    updatePlayerPhysics();   // ← player.js
    updateSlide();           // ← player.js

    // ------ 3. 分数计算 ------
    updateScore(frameCount); // ← score.js

    // ------ 4. 生成障碍物 ------
    generateObstacle();      // ← obstacle.js

    // ------ 5. 移动障碍物并检测碰撞 ------
    if (updateObstacles()) { // ← obstacle.js（返回 true = 碰撞）
        triggerGameOver();
        return;
    }

    // ------ 6. 金币生成 + 收集检测 ------
    generateCoin();          // ← obstacle.js
    const collected = updateCoins(); // ← obstacle.js
    for (let i = 0; i < collected; i++) {
        addCoin();           // ← score.js
    }

    // ------ 7. 背景滚动 ------
    updateBackground();      // ← obstacle.js

    // ------ 8. 刷新 HUD ------
    updateHUD();             // ← score.js
}

// ============================================================
// 游戏渲染：每帧绘制画面
// ============================================================
function render() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ---- 天空背景渐变 ----
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0,   '#87CEEB');
    skyGrad.addColorStop(0.7, '#c8e6ff');
    skyGrad.addColorStop(1,   '#e8f5e9');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ---- 远景树木 ----
    drawBgTrees();            // ← obstacle.js

    // ---- 地面 ----
    drawGround();             // ← obstacle.js

    // ---- 金币 ----
    coinList.forEach(c => drawCoin(c));  // ← obstacle.js

    // ---- 障碍物 ----
    drawAllObstacles();       // ← obstacle.js

    // ---- 玩家角色 ----
    drawPlayer();             // ← player.js

    // ---- 暂停遮罩层文字 ----
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

// ============================================================
// 游戏结束处理
// ============================================================
function triggerGameOver() {
    gameState = 'over';

    // 填充结算面板数据
    showFinalScore();         // ← score.js

    // 显示游戏结束遮罩
    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) overlay.classList.remove('hidden');

    // 禁用暂停按钮
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.disabled = true;

    // 提交成绩到服务器
    submitScore();            // ← api.js
}

// ============================================================
// 主游戏循环（requestAnimationFrame 驱动）
// ============================================================
function gameLoop() {
    if (gameState === 'running') {
        update();
        render();
    } else if (gameState === 'paused') {
        render();  // 暂停时仍渲染，显示暂停画面
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
        const btn = document.getElementById('pauseBtn');
        if (btn) btn.textContent = '▶ 继续';
    } else if (gameState === 'paused') {
        gameState = 'running';
        const btn = document.getElementById('pauseBtn');
        if (btn) btn.textContent = '⏸ 暂停';
    }
}

/** 重新开始 */
function restartGame() {
    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) overlay.classList.add('hidden');
    startGame();
}

/** 切换难度等级 */
function setDifficulty(level) {
    if (!DIFFICULTY_PRESETS[level]) return;
    const preset = DIFFICULTY_PRESETS[level];
    currentDifficulty = level;

    // 将预设值覆盖到全局 CONFIG
    Object.assign(CONFIG, preset);

    // 更新按钮高亮状态
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.level === level);
    });

    console.log(`[难度] 已切换到 ${preset.label} 模式`);
}

// ============================================================
// 键盘事件监听
// ============================================================

document.addEventListener('keydown', function(e) {
    // 空格或 ↑ ：跳跃
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'idle' || gameState === 'over') {
            if (gameState === 'idle') startGame();
            else restartGame();
        } else {
            jump();              // ← player.js
        }
    }

    // ↓ ：下滑
    if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (gameState === 'idle') {
            startGame();
        } else {
            startSlide();         // ← player.js
        }
    }

    // P ：暂停/继续
    if (e.code === 'KeyP') {
        togglePause();
    }

    // R ：重新开始
    if (e.code === 'KeyR') {
        restartGame();
    }
});

// ↑ 松开时结束下滑
document.addEventListener('keyup', function(e) {
    if (e.code === 'ArrowDown') {
        endSlide();               // ← player.js
    }
});

// ============================================================
// 页面加载完毕后启动游戏循环
// ============================================================
window.addEventListener('DOMContentLoaded', function() {
    render();                        // 先画初始画面
    requestAnimationFrame(gameLoop); // 启动主循环
});
