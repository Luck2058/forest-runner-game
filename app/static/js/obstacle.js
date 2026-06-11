/**
 * obstacle.js —— 障碍物 & 金币 & 背景模块
 *
 * 职责：
 *   - 障碍物数组管理（地面树桩 + 空中飞鸟两种类型）
 *   - 金币数组管理（生成、收集、绘制）
 *   - 碰撞检测调用
 *   - 障碍物/金币/背景的绘制
 *   - 【B岗新增】粒子特效系统（金币收集 / 碰撞爆炸）
 *   - 【B岗新增】背景增强（云朵、山丘视差）
 *
 * 依赖：CONFIG、player、gameState、frameCount、gameSpeed、ctx、canvas
 */

// ============================================================
// 障碍物 & 金币数据（暴露给其他模块使用）
// ============================================================
let obstacles    = [];       // 障碍物数组
let nextObsFrame = 0;        // 下次生成障碍物的帧数

let coinList      = [];      // 金币数组
let nextCoinFrame = 0;       // 下次生成金币的帧数

let bgOffset = 0;            // 背景滚动偏移量

// ============================================================
// 【B岗新增】粒子特效系统
// ============================================================
let particles = [];

/** 生成粒子爆发（金币收集 / 碰撞爆炸） */
function spawnParticles(x, y, color, count, type) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * (type === 'coin' ? 4 : 6),
            vy: (Math.random() - 0.5) * (type === 'coin' ? 4 : 8) - 2,
            r: Math.max(1, Math.random() * (type === 'coin' ? 4 : 5)),
            color: color,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.03,
            type: type || 'coin',
        });
    }
}

/** 更新并绘制所有粒子 */
function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;   // 微重力
        p.life -= p.decay;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.globalAlpha = p.life;
        if (p.type === 'coin') {
            // 金币粒子：小星星形状
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            // 闪光
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 碰撞粒子：不规则碎块
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        }
        ctx.globalAlpha = 1.0;
    }
}

/** 初始化粒子系统 */
function initParticles() {
    particles = [];
}

// ============================================================
// 【B岗新增】云朵 & 山丘背景
// ============================================================
let clouds = [];
let hills  = [];

/** 初始化云朵和山丘 */
function initBackground() {
    clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: 20 + Math.random() * 60,
            w: 50 + Math.random() * 60,
            speed: 0.15 + Math.random() * 0.25,
            opacity: 0.3 + Math.random() * 0.4,
        });
    }
    hills = [];
    for (let i = 0; i < 3; i++) {
        hills.push({
            x: i * 300,
            w: 200 + Math.random() * 150,
            h: 40 + Math.random() * 40,
            color: i === 1 ? 'rgba(45, 106, 79, 0.25)' : 'rgba(82, 183, 136, 0.2)',
        });
    }
}

/** 绘制云朵 */
function drawClouds() {
    clouds.forEach(c => {
        ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
        // 云朵由3个重叠椭圆组成
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.w * 0.4, c.w * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c.x - c.w * 0.25, c.y + c.w * 0.05, c.w * 0.3, c.w * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c.x + c.w * 0.25, c.y + c.w * 0.05, c.w * 0.28, c.w * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        // 移动
        c.x -= c.speed;
        if (c.x + c.w < 0) {
            c.x = canvas.width + c.w;
            c.y = 20 + Math.random() * 60;
        }
    });
}

/** 绘制山丘（视差滚动） */
function drawHills() {
    hills.forEach(h => {
        const x = ((h.x - bgOffset * 0.15) % (canvas.width + h.w)) - h.w * 0.5;
        ctx.fillStyle = h.color;
        ctx.beginPath();
        ctx.moveTo(x, CONFIG.GROUND_Y);
        ctx.quadraticCurveTo(x + h.w / 2, CONFIG.GROUND_Y - h.h, x + h.w, CONFIG.GROUND_Y);
        ctx.closePath();
        ctx.fill();
    });
}

// ============================================================
// 初始化 / 重置（供 game.js 的 initGame() 调用）
// ============================================================
function initObstacles() {
    obstacles     = [];
    coinList      = [];
    bgOffset      = 0;
    nextObsFrame  = randInt(CONFIG.OBS_INTERVAL_MIN, CONFIG.OBS_INTERVAL_MAX);
    nextCoinFrame = randInt(CONFIG.COIN_INTERVAL_MIN, CONFIG.COIN_INTERVAL_MAX);
    initParticles();
    initBackground();
}

// ============================================================
// 生成障碍物（两种类型：地面 + 空中）
// 参数支持动态难度阶段调整
// ============================================================
function generateObstacle(obsMin, obsMax, airChance, speed) {
    // 使用传入的动态参数，未传则使用 CONFIG 默认值
    const intervalMin = obsMin || CONFIG.OBS_INTERVAL_MIN;
    const intervalMax = obsMax || CONFIG.OBS_INTERVAL_MAX;
    const airProb     = airChance !== undefined ? airChance : CONFIG.AIR_OBS_CHANCE;

    if (frameCount < nextObsFrame) return;

    // 根据难度动态调整最小间隔（速度越快，间隔越大给玩家反应时间）
    const speedFactor = Math.min(1, (speed || gameSpeed) / 5);
    const adjustedMin = Math.max(70, intervalMin + Math.floor(speedFactor * 15));

    // 随机决定障碍物类型：空中障碍物按概率出现
    const isAir = Math.random() < airProb;
    let obsH, obsW, obsY, groundType;

    if (isAir) {
        // 空中障碍物（飞鸟/树枝）：出现在半空，玩家需下滑躲避
        obsW = randInt(CONFIG.OBS_W_MIN, CONFIG.OBS_W_MAX);
        obsH = randInt(CONFIG.AIR_OBS_H_MIN, CONFIG.AIR_OBS_H_MAX);
        // Y坐标：离地 AIR_OBS_GROUND_GAP 到 AIR_OBS_GROUND_GAP+80 的范围
        obsY = CONFIG.GROUND_Y - CONFIG.AIR_OBS_GROUND_GAP - randInt(0, 80);
    } else {
        // 地面障碍物：随机选择形态（树桩/石头/灌木/蘑菇）
        const groundTypes = ['stump', 'rock', 'bush', 'mushroom'];
        groundType = groundTypes[randInt(0, groundTypes.length - 1)];

        switch (groundType) {
            case 'stump':
                // 树桩：窄而高
                obsW = randInt(18, 30);
                obsH = randInt(40, 70);
                break;
            case 'rock':
                // 石头：宽而矮
                obsW = randInt(28, 42);
                obsH = randInt(25, 45);
                break;
            case 'bush':
                // 灌木：宽而中高
                obsW = randInt(30, 45);
                obsH = randInt(30, 50);
                break;
            case 'mushroom':
                // 蘑菇：窄而矮
                obsW = randInt(20, 30);
                obsH = randInt(25, 40);
                break;
            default:
                obsH = randInt(CONFIG.OBS_H_MIN, CONFIG.OBS_H_MAX);
                obsW = randInt(CONFIG.OBS_W_MIN, CONFIG.OBS_W_MAX);
        }
        // +14 让底部陷入棕色土层，视觉上扎根在地面，彻底消除"悬空"
        obsY = CONFIG.GROUND_Y - obsH + 14;
    }

    obstacles.push({
        x: canvas.width + 10,
        y: obsY,
        w: obsW,
        h: obsH,
        type: isAir ? 'air' : 'ground',
        groundType: groundType || null,
    });
    nextObsFrame = frameCount + randInt(adjustedMin, intervalMax);
}

// ============================================================
// 更新障碍物（移动 + 碰撞检测 + 清理越界）
// ============================================================

/** 移动所有障碍物并检测碰撞，返回 true 表示发生了碰撞 */
function updateObstacles(speed) {
    const spd = speed || gameSpeed;
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= spd;

        // 碰撞检测：玩家 vs 障碍物（AABB矩形碰撞）
        if (rectsCollide(player, obstacles[i])) {
            // 检查无敌状态（来自道具：无敌星）
            if (typeof isInvincible === 'function' && isInvincible()) {
                // 无敌！消耗障碍物
                spawnParticles(obstacles[i].x + obstacles[i].w / 2, obstacles[i].y + obstacles[i].h / 2, '#FFD93D', 15, 'coin');
                if (typeof playSFX === 'function') playSFX('coin');
                obstacles.splice(i, 1);
                continue;
            }
            // 【B岗】碰撞时生成爆炸粒子
            spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ff4444', 12, 'crash');
            // 【B岗】播放碰撞音效
            if (typeof playSFX === 'function') playSFX('crash');
            return true;   // 碰撞！游戏结束
        }

        // 移出屏幕左侧，删除
        if (obstacles[i].x + obstacles[i].w < 0) {
            obstacles.splice(i, 1);
        }
    }
    return false;  // 无碰撞
}

// ============================================================
// 金币逻辑（生成 + 收集 + 绘制）
// ============================================================

/** 生成金币 */
function generateCoin() {
    if (frameCount < nextCoinFrame) return;

    const coinY = CONFIG.GROUND_Y - CONFIG.COIN_R - randInt(0, 80);
    coinList.push({
        x: canvas.width + 10,
        y: coinY,
        r: CONFIG.COIN_R,
    });
    nextCoinFrame = frameCount + randInt(CONFIG.COIN_INTERVAL_MIN, CONFIG.COIN_INTERVAL_MAX);
}

/** 移动金币并检测收集，返回收集到的金币数量 */
function updateCoins(speed) {
    const spd = speed || gameSpeed;
    let collected = 0;

    const magnetRange = (typeof getMagnetRange === 'function') ? getMagnetRange() : 0;

    for (let i = coinList.length - 1; i >= 0; i--) {
        const coin = coinList[i];

        // 磁铁效果：吸附范围内的金币
        if (magnetRange > 0) {
            const dx = (player.x + player.w / 2) - coin.x;
            const dy = (player.y + player.h / 2) - coin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < magnetRange && dist > 5) {
                const force = 3;
                coin.x += (dx / dist) * force;
                coin.y += (dy / dist) * force;
            }
        }

        coin.x -= spd;

        // 玩家收集金币（矩形 vs 圆形碰撞）
        if (rectCircleCollide(player, coinList[i])) {
            // 【B岗】金币收集粒子
            spawnParticles(coinList[i].x, coinList[i].y, '#FFE066', 8, 'coin');
            // 【B岗】播放金币音效
            if (typeof playSFX === 'function') playSFX('coin');
            collected++;
            coinList.splice(i, 1);
            continue;
        }

        // 移出屏幕
        if (coinList[i].x + coinList[i].r < 0) {
            coinList.splice(i, 1);
        }
    }
    return collected;
}

/** 【B岗修改】绘制单个金币 —— 优先用 SVG 素材 */
function drawCoin(c) {
    const sprite = SpriteLoader.get('coin');
    if (sprite) {
        ctx.drawImage(sprite, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
        return;
    }

    // 降级：Canvas 绘制
    // 外圈光晕
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.fill();

    // 金币本体（径向渐变）
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

// ============================================================
// 障碍物绘制（根据类型分发）
// ============================================================

/** 绘制所有障碍物（遍历调用） */
function drawAllObstacles() {
    obstacles.forEach(o => drawObstacle(o));
}

/** 根据类型选择绘制函数 */
function drawObstacle(obs) {
    if (obs.type === 'air') {
        drawAirObstacle(obs);
    } else {
        drawGroundObstacle(obs);
    }
}

// ---- 地面障碍物（树桩/石头）—— 需要跳跃越过 ----

/** 【B岗修改】地面障碍物 —— 根据 groundType 绘制不同形态 */
function drawGroundObstacle(obs) {
    const sprite = SpriteLoader.get('obstacle_stump');
    if (sprite) {
        ctx.drawImage(sprite, obs.x, obs.y, obs.w, obs.h);
        return;
    }

    // 降级：Canvas 绘制（根据 groundType 分发）
    const gType = obs.groundType || 'stump';
    switch (gType) {
        case 'stump':  drawStump(obs);  break;
        case 'rock':   drawRock(obs);   break;
        case 'bush':   drawBush(obs);   break;
        case 'mushroom': drawMushroom(obs); break;
        default:       drawStump(obs);  break;
    }
}

// ---- 树桩（窄而高，带年轮和绿叶） ----
function drawStump(obs) {
    // 树桩身体（渐变棕色）
    const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.w, obs.y);
    grad.addColorStop(0,   '#8B5E3C');
    grad.addColorStop(0.5, '#A0714F');
    grad.addColorStop(1,   '#8B5E3C');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 4);
    ctx.fill();

    // 年轮纹路
    ctx.strokeStyle = '#6B4423';
    ctx.lineWidth = 1.2;
    for (let i = obs.h * 0.25; i < obs.h * 0.85; i += obs.h * 0.2) {
        ctx.beginPath();
        ctx.moveTo(obs.x + 3, obs.y + i);
        ctx.lineTo(obs.x + obs.w - 3, obs.y + i);
        ctx.stroke();
    }

    // 顶部绿叶（圆形树冠）
    ctx.fillStyle = '#40916c';
    ctx.beginPath();
    ctx.ellipse(obs.x + obs.w / 2, obs.y - 2, obs.w / 2 + 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#52b788';
    ctx.beginPath();
    ctx.ellipse(obs.x + obs.w / 2 - 3, obs.y - 4, obs.w / 2 + 2, 7, 0, 0, Math.PI * 2);
    ctx.fill();
}

// ---- 石头（宽而矮，不规则灰色） ----
function drawRock(obs) {
    // 石头主体（灰色渐变）
    const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.h);
    grad.addColorStop(0,   '#9e9e9e');
    grad.addColorStop(0.4, '#8a8a8a');
    grad.addColorStop(1,   '#6d6d6d');
    ctx.fillStyle = grad;

    // 不规则外形（圆角矩形 + 顶部微凸）
    ctx.beginPath();
    ctx.moveTo(obs.x + 4, obs.y + obs.h);
    ctx.lineTo(obs.x + obs.w - 4, obs.y + obs.h);
    ctx.quadraticCurveTo(obs.x + obs.w + 2, obs.y + obs.h * 0.4, obs.x + obs.w - 2, obs.y + 4);
    ctx.quadraticCurveTo(obs.x + obs.w * 0.6, obs.y - 3, obs.x + obs.w * 0.4, obs.y + 2);
    ctx.quadraticCurveTo(obs.x - 2, obs.y + obs.h * 0.3, obs.x + 3, obs.y + obs.h);
    ctx.closePath();
    ctx.fill();

    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.ellipse(obs.x + obs.w * 0.35, obs.y + obs.h * 0.25, obs.w * 0.2, obs.h * 0.15, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // 裂纹
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(obs.x + obs.w * 0.4, obs.y + obs.h * 0.3);
    ctx.lineTo(obs.x + obs.w * 0.55, obs.y + obs.h * 0.6);
    ctx.lineTo(obs.x + obs.w * 0.5, obs.y + obs.h * 0.8);
    ctx.stroke();
}

// ---- 灌木（宽而中高，多叶绿球） ----
function drawBush(obs) {
    // 主干（短棕色）
    ctx.fillStyle = '#6B4423';
    ctx.fillRect(obs.x + obs.w * 0.4, obs.y + obs.h * 0.6, obs.w * 0.2, obs.h * 0.4);

    // 多个重叠绿色椭圆组成灌木
    const cx = obs.x + obs.w / 2;
    const cy = obs.y + obs.h * 0.4;

    // 深色底层
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.ellipse(cx - obs.w * 0.15, cy + 4, obs.w * 0.4, obs.h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + obs.w * 0.15, cy + 2, obs.w * 0.35, obs.h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 亮色上层
    ctx.fillStyle = '#40916c';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 3, obs.w * 0.38, obs.h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 最亮顶部
    ctx.fillStyle = '#52b788';
    ctx.beginPath();
    ctx.ellipse(cx - obs.w * 0.08, cy - 6, obs.w * 0.25, obs.h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 小浆果装饰
    ctx.fillStyle = '#e63946';
    const berryPositions = [
        [cx - obs.w * 0.2, cy + 2],
        [cx + obs.w * 0.15, cy - 1],
        [cx + obs.w * 0.05, cy + 5],
    ];
    berryPositions.forEach(([bx, by]) => {
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ---- 蘑菇（窄而矮，红色伞盖白点） ----
function drawMushroom(obs) {
    const cx = obs.x + obs.w / 2;
    const stemBottom = obs.y + obs.h;
    const stemTop = obs.y + obs.h * 0.45;
    const capTop = obs.y + obs.h * 0.05;

    // 菌柄（白色渐变）
    const stemGrad = ctx.createLinearGradient(obs.x, stemTop, obs.x + obs.w, stemTop);
    stemGrad.addColorStop(0,   '#f0e6d3');
    stemGrad.addColorStop(0.5, '#fff8f0');
    stemGrad.addColorStop(1,   '#f0e6d3');
    ctx.fillStyle = stemGrad;
    ctx.beginPath();
    ctx.moveTo(obs.x + obs.w * 0.3, stemBottom);
    ctx.quadraticCurveTo(obs.x + obs.w * 0.25, stemTop + obs.h * 0.1, obs.x + obs.w * 0.35, stemTop);
    ctx.lineTo(obs.x + obs.w * 0.65, stemTop);
    ctx.quadraticCurveTo(obs.x + obs.w * 0.75, stemTop + obs.h * 0.1, obs.x + obs.w * 0.7, stemBottom);
    ctx.closePath();
    ctx.fill();

    // 伞盖（红色渐变）
    const capGrad = ctx.createRadialGradient(cx, capTop + obs.h * 0.15, 2, cx, capTop + obs.h * 0.15, obs.w * 0.6);
    capGrad.addColorStop(0, '#ff6b6b');
    capGrad.addColorStop(0.7, '#e63946');
    capGrad.addColorStop(1, '#c1121f');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.ellipse(cx, capTop + obs.h * 0.2, obs.w * 0.55, obs.h * 0.25, 0, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    // 伞盖底边
    ctx.fillStyle = '#f0e6d3';
    ctx.beginPath();
    ctx.ellipse(cx, capTop + obs.h * 0.2, obs.w * 0.5, obs.h * 0.06, 0, 0, Math.PI);
    ctx.fill();

    // 白色斑点
    ctx.fillStyle = '#fff';
    const spots = [
        [cx - obs.w * 0.2, capTop + obs.h * 0.1, 3],
        [cx + obs.w * 0.15, capTop + obs.h * 0.08, 2.5],
        [cx + obs.w * 0.02, capTop + obs.h * 0.05, 2],
        [cx - obs.w * 0.05, capTop + obs.h * 0.15, 2],
    ];
    spots.forEach(([sx, sy, sr]) => {
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ---- 空中障碍物（飞鸟/树枝）—— 需要下滑躲避 ----

/** 【B岗修改】空中障碍物 —— 优先用 SVG 素材（飞鸟） */
function drawAirObstacle(obs) {
    const sprite = SpriteLoader.get('obstacle_bird');
    if (sprite) {
        // 翅膀扇动效果：上下微调
        const wingFlap = Math.sin(frameCount * 0.3) * 3;
        ctx.drawImage(sprite, obs.x, obs.y + wingFlap, obs.w, obs.h);
        return;
    }

    // 降级：Canvas 绘制
    const cx = obs.x + obs.w / 2;   // 中心 X
    const cy = obs.y + obs.h / 2;   // 中心 Y

    // 身体椭圆
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.ellipse(cx, cy, obs.w / 2, obs.h / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 翅膀扇动动画（根据帧数正弦偏移）
    const wingY = Math.sin(frameCount * 0.3) * 4;
    ctx.fillStyle = '#718096';
    // 上翅膀
    ctx.beginPath();
    ctx.ellipse(cx - 2, cy - obs.h * 0.3 + wingY, obs.w * 0.45, obs.h * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // 下翅膀
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy + obs.h * 0.2 - wingY, obs.w * 0.4, obs.h * 0.2, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(cx + obs.w * 0.15, cy - obs.h * 0.05, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // 瞳孔（红色）
    ctx.fillStyle = '#e53e3e';
    ctx.beginPath();
    ctx.arc(cx + obs.w * 0.18, cy - obs.h * 0.05, 2, 0, Math.PI * 2);
    ctx.fill();

    // 嘴巴（尖尖的橙色）
    ctx.fillStyle = '#f6ad55';
    ctx.beginPath();
    ctx.moveTo(cx + obs.w * 0.3, cy);
    ctx.lineTo(cx + obs.w * 0.55, cy + 2);
    ctx.lineTo(cx + obs.w * 0.3, cy + 4);
    ctx.closePath();
    ctx.fill();

    // 危险提示：红色虚线框闪烁
    if (frameCount % 40 < 20) {
        ctx.strokeStyle = 'rgba(229, 62, 62, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(obs.x - 3, obs.y - 3, obs.w + 6, obs.h + 6);
        ctx.setLineDash([]);
    }
}

// ============================================================
// 背景环境绘制（地面 + 远景树木）
// ============================================================

/** 绘制地面（草皮 + 土层） */
function drawGround() {
    const y = CONFIG.GROUND_Y;

    // 地面主体（深绿）
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(0, y, canvas.width, 8);

    // 地面草皮纹理（滚动的小半圆）
    ctx.fillStyle = '#52b788';
    for (let x = -bgOffset % 30; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.ellipse(x, y, 8, 5, 0, 0, Math.PI, true);
        ctx.fill();
    }

    // 地面土层（渐变棕色）
    const soilGrad = ctx.createLinearGradient(0, y + 8, 0, canvas.height);
    soilGrad.addColorStop(0, '#8B6914');
    soilGrad.addColorStop(1, '#5c4a1e');
    ctx.fillStyle = soilGrad;
    ctx.fillRect(0, y + 8, canvas.width, canvas.height - y - 8);
}

/** 绘制远景树木（视差滚动效果） */
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
        // 树冠（半透明绿）
        ctx.fillStyle = 'rgba(82, 183, 136, 0.5)';
        ctx.beginPath();
        ctx.ellipse(x + 23, y + 30, 28, 35, 0, 0, Math.PI * 2);
        ctx.fill();
    });
}

/** 更新背景滚动偏移 */
function updateBackground(speed) {
    const spd = speed || gameSpeed;
    bgOffset = (bgOffset + spd * 0.3) % canvas.width;
}
