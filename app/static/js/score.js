/**
 * score.js —— 分数 & 统计模块
 *
 * 职责：
 *   - 分数 / 金币 / 距离 的记录和计算
 *   - HUD 面板更新（实时显示当前数据）
 *   - 游戏结束时结算面板数据填充
 *
 * 依赖：CONFIG（分数常量）、gameState
 */

// ============================================================
// 分数数据（暴露给其他模块使用）
// ============================================================
let score     = 0;        // 当前分数
let coins     = 0;        // 收集的金币数量
let distance  = 0;        // 跑过的距离（米）

// ============================================================
// 初始化 / 重置（供 game.js 的 initGame() 调用）
// ============================================================
function initScore() {
    score    = 0;
    coins    = 0;
    distance = 0;
}

// ============================================================
// 每帧更新分数（在 game.js 的 update() 中调用）
// ============================================================

/** 增加基础分 + 更新距离 */
function updateScore(frame) {
    distance = Math.floor(frame / 10);          // 每10帧 = 1米
    score   += CONFIG.SCORE_PER_FRAME;           // 每帧 +1 基础分
}

/** 收集金币时调用，增加金币数和奖励分（支持双倍金币道具） */
function addCoin() {
    const multiplier = (typeof getCoinMultiplier === 'function') ? getCoinMultiplier() : 1;
    coins += multiplier;
    score += CONFIG.COIN_SCORE * multiplier;
}

// ============================================================
// HUD 显示更新（刷新页面上的分数/金币/距离数字）
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
// 游戏结束结算面板（显示最终成绩）
// ============================================================
function showFinalScore() {
    const finalScoreEl = document.getElementById('finalScore');
    const finalCoinsEl = document.getElementById('finalCoins');
    const finalDistEl  = document.getElementById('finalDist');

    if (finalScoreEl) finalScoreEl.textContent = score;
    if (finalCoinsEl) finalCoinsEl.textContent = coins;
    if (finalDistEl)  finalDistEl.textContent  = distance + 'm';
}
