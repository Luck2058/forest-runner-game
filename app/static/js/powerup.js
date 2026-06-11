/**
 * powerup.js —— 道具系统模块
 *
 * 职责：
 *   - 道具数组管理（生成、移动、收集）
 *   - 道具效果激活与解除
 *   - 道具绘制（Canvas 降级绘制）
 *
 * 依赖：CONFIG、player、gameState、frameCount、gameSpeed、ctx、canvas
 */

// ============================================================
// 道具数据（暴露给其他模块使用）
// ============================================================
let powerupList = [];
let nextPowerupFrame = 0;

// 当前激活的道具效果
let activePowerups = {
    magnet:     { active: false, timer: 0, maxTimer: 0 },
    shield:     { active: false },          // 瞬时，免疫一次碰撞
    double_coin:{ active: false, timer: 0, maxTimer: 0, multiplier: 2 },
    shrink:     { active: false, timer: 0, maxTimer: 0, ratio: 0.5 },
    slowdown:   { active: false, timer: 0, maxTimer: 0, ratio: 0.5 },
};

// ============================================================
// 道具类型配置（Canvas 绘制用）
// ============================================================
const POWERUP_CONFIGS = {
    magnet:      { color: '#FF6B6B', icon: '🧲', label: '磁铁' },
    shield:      { color: '#FFD93D', icon: '⭐', label: '无敌' },
    double_coin: { color: '#6BCB77', icon: '💰', label: '双倍' },
    shrink:      { color: '#4D96FF', icon: '🔽', label: '缩小' },
    slowdown:    { color: '#9B59B6', icon: '⏱', label: '减速' },
};

// ============================================================
// 初始化 / 重置
// ============================================================
function initPowerups() {
    powerupList = [];
    nextPowerupFrame = 0;
    deactivateAllPowerups();
}

/** 清除所有激活的道具效果 */
function deactivateAllPowerups() {
    // 先恢复缩小药水导致的尺寸变更，再清空状态
    if (activePowerups.shrink.active) {
        if (player._origW) {
            player.w = player._origW;
            player.h = player._origH;
            player.y = CONFIG.GROUND_Y - player.h;
            player._origW = undefined;
            player._origH = undefined;
        }
    }
    for (let key in activePowerups) {
        activePowerups[key].active = false;
        activePowerups[key].timer = 0;
    }
}

// ============================================================
// 生成道具（随机 spawn）
// ============================================================
function generatePowerup() {
    // 道具生成概率：约每 3~5 秒出现一个
    const spawnChance = 0.003;

    if (Math.random() > spawnChance) return;

    // 每次只生成一个，避免过多
    if (powerupList.length >= 2) return;

    // 随机选择道具类型
    const types = ['magnet', 'shield', 'double_coin', 'shrink', 'slowdown'];
    const type = types[randInt(0, types.length - 1)];

    const r = 14;
    const y = CONFIG.GROUND_Y - r - randInt(0, 60);

    powerupList.push({
        x: canvas.width + 20,
        y: y,
        r: r,
        type: type,
        // 轻微浮动动画
        floatOffset: Math.random() * Math.PI * 2,
    });
}

// ============================================================
// 更新道具（移动 + 收集检测）
// ============================================================
function updatePowerups(speed) {
    const spd = speed || gameSpeed;

    for (let i = powerupList.length - 1; i >= 0; i--) {
        const p = powerupList[i];
        p.x -= spd;

        // 浮动效果
        p.floatOffset += 0.05;

        // 玩家收集道具（圆形碰撞简化版）
        const dx = (player.x + player.w / 2) - p.x;
        const dy = (player.y + player.h / 2) - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < p.r + Math.max(player.w, player.h) / 2 + 5) {
            // 收集成功
            activatePowerup(p.type);
            spawnParticles(p.x, p.y, POWERUP_CONFIGS[p.type]?.color || '#FFD93D', 10, 'coin');
            if (typeof playSFX === 'function') playSFX('coin');
            powerupList.splice(i, 1);
            continue;
        }

        // 移出屏幕
        if (p.x + p.r < -20) {
            powerupList.splice(i, 1);
        }
    }

    // 更新激活道具的计时器
    updateActivePowerups(speed);
}

// ============================================================
// 激活道具效果
// ============================================================
function activatePowerup(type) {
    switch (type) {
        case 'magnet':
            activePowerups.magnet.active = true;
            activePowerups.magnet.timer = 300;    // 5秒
            activePowerups.magnet.maxTimer = 300;
            console.log('[道具] 磁铁已激活！');
            break;

        case 'shield':
            activePowerups.shield.active = true;
            player.invincible = true;
            console.log('[道具] 无敌星已激活！免疫一次碰撞');
            break;

        case 'double_coin':
            activePowerups.double_coin.active = true;
            activePowerups.double_coin.timer = 300;
            activePowerups.double_coin.maxTimer = 300;
            console.log('[道具] 二倍金币已激活！');
            break;

        case 'shrink':
            activePowerups.shrink.active = true;
            activePowerups.shrink.timer = 420;
            activePowerups.shrink.maxTimer = 420;
            // 保存原始尺寸并缩小
            if (!player._origW) player._origW = player.w;
            if (!player._origH) player._origH = player.h;
            player.w = Math.floor(player._origW * 0.5);
            player.h = Math.floor(player._origH * 0.5);
            player.y = CONFIG.GROUND_Y - player.h;
            console.log('[道具] 缩小药水已激活！');
            break;

        case 'slowdown':
            activePowerups.slowdown.active = true;
            activePowerups.slowdown.timer = 180;
            activePowerups.slowdown.maxTimer = 180;
            console.log('[道具] 慢速时钟已激活！');
            break;
    }

    // 更新道具 HUD
    updatePowerupHUD();
}

/** 每帧更新激活道具的计时器 */
function updateActivePowerups(speed) {
    // 磁铁倒计时
    if (activePowerups.magnet.active) {
        activePowerups.magnet.timer--;
        if (activePowerups.magnet.timer <= 0) {
            activePowerups.magnet.active = false;
            console.log('[道具] 磁铁效果结束');
        }
    }

    // 双倍金币倒计时
    if (activePowerups.double_coin.active) {
        activePowerups.double_coin.timer--;
        if (activePowerups.double_coin.timer <= 0) {
            activePowerups.double_coin.active = false;
            console.log('[道具] 二倍金币效果结束');
        }
    }

    // 缩小药水倒计时
    if (activePowerups.shrink.active) {
        activePowerups.shrink.timer--;
        if (activePowerups.shrink.timer <= 0) {
            activePowerups.shrink.active = false;
            // 恢复原始尺寸
            if (player._origW) {
                player.w = player._origW;
                player.h = player._origH;
                player.y = CONFIG.GROUND_Y - player.h;
                player._origW = null;
                player._origH = null;
            }
            console.log('[道具] 缩小药水效果结束');
        }
    }

    // 慢速时钟倒计时
    if (activePowerups.slowdown.active) {
        activePowerups.slowdown.timer--;
        if (activePowerups.slowdown.timer <= 0) {
            activePowerups.slowdown.active = false;
            console.log('[道具] 慢速时钟效果结束');
        }
    }

    updatePowerupHUD();
}

// ============================================================
// 道具效果对游戏的影响（由 game.js/obstacle.js 调用）
// ============================================================

/** 获取当前磁铁效果下的金币吸附范围（0 = 无效果） */
function getMagnetRange() {
    return activePowerups.magnet.active ? 80 : 0;
}

/** 获取当前是否无敌 */
function isInvincible() {
    if (activePowerups.shield.active) {
        // 使用过一次后解除
        activePowerups.shield.active = false;
        player.invincible = false;
        console.log('[道具] 无敌星已消耗！');
        updatePowerupHUD();
        return true;
    }
    return false;
}

/** 获取金币倍率 */
function getCoinMultiplier() {
    return activePowerups.double_coin.active ? activePowerups.double_coin.multiplier : 1;
}

/** 获取慢速时钟减速因子 */
function getSlowdownFactor() {
    return activePowerups.slowdown.active ? activePowerups.slowdown.ratio : 1.0;
}

// ============================================================
// 道具 HUD 显示
// ============================================================
function updatePowerupHUD() {
    const hud = document.getElementById('powerupHud');
    if (!hud) return;

    let html = '';
    for (let key in activePowerups) {
        const pw = activePowerups[key];
        if (!pw.active) continue;
        const cfg = POWERUP_CONFIGS[key] || {};
        const seconds = pw.timer ? Math.ceil(pw.timer / 60) : '∞';
        html += '<span class="pw-badge" style="background:' + (cfg.color || '#ccc') + '">' +
                (cfg.icon || key) + ' ' + seconds + 's</span>';
    }

    if (html) {
        hud.innerHTML = html;
        hud.style.display = '';
    } else {
        hud.style.display = 'none';
    }
}

// ============================================================
// 绘制道具
// ============================================================
function drawPowerups() {
    powerupList.forEach(p => drawPowerup(p));
}

function drawPowerup(p) {
    const cfg = POWERUP_CONFIGS[p.type] || POWERUP_CONFIGS.magnet;

    // 先尝试 SVG 素材（磁铁）
    if (p.type === 'magnet') {
        const sprite = SpriteLoader.get('powerup_magnet');
        if (sprite) {
            // 浮动效果
            const floatY = Math.sin(p.floatOffset) * 5;
            ctx.drawImage(sprite, p.x - p.r, p.y - p.r + floatY, p.r * 2, p.r * 2);
            return;
        }
    }

    // 降级：Canvas 绘制
    const floatY = Math.sin(p.floatOffset) * 5;
    const cx = p.x;
    const cy = p.y + floatY;

    // 外圈光晕
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.arc(cx, cy, p.r + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 主体圆形
    const grad = ctx.createRadialGradient(cx - 2, cy - 2, 2, cx, cy, p.r);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.5, cfg.color);
    grad.addColorStop(1, cfg.color + '99');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, p.r, 0, Math.PI * 2);
    ctx.fill();

    // 图标文字
    ctx.fillStyle = '#333';
    ctx.font = 'bold ' + Math.floor(p.r * 0.9) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.icon || '?', cx, cy + 1);
}