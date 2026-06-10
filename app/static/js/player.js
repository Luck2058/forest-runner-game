/**
 * player.js —— 玩家角色模块
 *
 * 职责：
 *   - 玩家对象（位置、状态、属性）
 *   - 跳跃逻辑（支持二段跳）
 *   - 下滑逻辑（按住 ↓ 趴下躲避空中障碍物）
 *   - 玩家绘制（站立/跳跃/下滑三种姿态）
 *   - 皮肤系统：根据后端返回的皮肤配色渲染角色
 *
 * 依赖：CONFIG（全局常量）、gameState（游戏状态）
 *
 * 【B岗修改】优先使用 SVG 素材绘制，素材加载失败时降级为 Canvas 绘制
 * 【皮肤系统】Canvas 降级绘制使用皮肤配色（primary/secondary/accent）
 */

// ============================================================
// 皮肤配色（默认值，页面加载时从后端获取覆盖）
// ============================================================
let playerSkin = {
    primary_color:   '#D85A30',   // 主体色
    secondary_color: '#FAECE7',   // 肚皮/面部色
    accent_color:    '#2d6a4f',   // 背心色
    sprite_path:     '/static/images/player.svg',
};

/** 从后端加载用户当前装备的皮肤 */
function loadPlayerSkin() {
    fetch('/game/api/user/skin')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.skin) {
                playerSkin = data.skin;
                // 如果皮肤有自定义 SVG，重新加载
                if (playerSkin.sprite_path) {
                    SpriteLoader.load('player', playerSkin.sprite_path).then(() => {
                        console.log('[皮肤] 自定义素材加载完成');
                    });
                }
                console.log('[皮肤] 已装备:', playerSkin.name);
            }
        })
        .catch(() => {
            console.warn('[皮肤] 加载失败，使用默认配色');
        });
}

// ============================================================
// 玩家对象（暴露给其他模块使用）
// ============================================================
const player = {
    x: CONFIG.PLAYER_X,
    y: CONFIG.GROUND_Y - CONFIG.PLAYER_H,
    w:       CONFIG.PLAYER_W,
    h:       CONFIG.PLAYER_H,
    vy:      0,              // 垂直速度
    onGround: true,           // 是否在地面上
    jumpCount: 0,             // 已跳跃次数（支持二段跳）
    MAX_JUMPS: 2,             // 最多跳几段

    // ---- 下滑动作属性 ----
    isSliding:    false,      // 是否正在下滑
    slideTimer:   0,          // 下滑已持续帧数
    slideCooldown: 0,         // 下滑冷却帧数
};

// ============================================================
// 初始化 / 重置玩家状态（供 game.js 的 initGame() 调用）
// ============================================================
function initPlayer() {
    player.y            = CONFIG.GROUND_Y - CONFIG.PLAYER_H;
    player.vy           = 0;
    player.onGround     = true;
    player.jumpCount    = 0;
    player.isSliding    = false;
    player.slideTimer   = 0;
    player.slideCooldown = 0;
}

// ============================================================
// 跳跃处理
// ============================================================
function jump() {
    if (gameState !== 'running') return;

    // 下滑状态下不允许跳跃
    if (player.isSliding) return;

    // 支持二段跳
    if (player.jumpCount < player.MAX_JUMPS) {
        player.vy = CONFIG.JUMP_FORCE;
        player.onGround = false;
        player.jumpCount++;
        // 跳跃时自动取消下滑
        if (player.isSliding) endSlide();

        // 【B岗】播放跳跃音效
        if (typeof playSFX === 'function') playSFX('jump');
    }
}

// ============================================================
// 下滑动作（按住 ↓ 键趴下躲避空中障碍物）
// ============================================================

/** 开始下滑：角色高度缩小，底部保持贴地 */
function startSlide() {
    if (gameState !== 'running') return;
    // 已经在下滑中，或冷却中，忽略
    if (player.isSliding || player.slideCooldown > 0) return;
    // 在空中时不能下滑（必须落地才能滑）
    if (!player.onGround) return;

    player.isSliding  = true;
    player.slideTimer = 0;

    // 缩小碰撞高度：高度变为原来的 SLIDE_H_RATIO
    const newH = Math.floor(player.h * CONFIG.SLIDE_H_RATIO);
    player.y = CONFIG.GROUND_Y - newH;
}

/** 结束下滑：恢复原始高度 */
function endSlide() {
    if (!player.isSliding) return;

    player.isSliding      = false;
    player.slideCooldown  = CONFIG.SLIDE_COOLDOWN;

    // 恢复原始碰撞高度
    player.y = CONFIG.GROUND_Y - player.h;
}

/** 每帧更新下滑状态（计时 + 自动恢复） */
function updateSlide() {
    // 冷却倒计时
    if (player.slideCooldown > 0) {
        player.slideCooldown--;
    }

    // 下滑计时：超过最大持续时间自动恢复
    if (player.isSliding) {
        player.slideTimer++;
        if (player.slideTimer >= CONFIG.MAX_SLIDE_FRAMES) {
            endSlide();
        }
    }
}

/** 更新玩家物理（重力 + 落地检测），每帧调用 */
function updatePlayerPhysics() {
    // 重力加速
    player.vy += CONFIG.GRAVITY;
    player.y  += player.vy;

    // 落地检测（根据当前实际高度判断——下滑时高度变小）
    const currentH = player.isSliding ? Math.floor(CONFIG.PLAYER_H * CONFIG.SLIDE_H_RATIO) : player.h;
    if (player.y >= CONFIG.GROUND_Y - currentH) {
        player.y        = CONFIG.GROUND_Y - currentH;
        player.vy       = 0;
        player.onGround = true;
        player.jumpCount = 0;
    }
}

// ============================================================
// 【B岗修改】绘制玩家 —— 优先用 SVG 素材，降级为 Canvas
// ============================================================
function drawPlayer() {
    const p = player;

    if (player.isSliding) {
        drawPlayerSliding(p);
    } else {
        drawPlayerStanding(p);
    }
}

/** 绘制趴下姿态 */
function drawPlayerSliding(p) {
    const slideW = p.w + 15;   // 趴下后变宽
    const slideH = Math.floor(CONFIG.PLAYER_H * CONFIG.SLIDE_H_RATIO);

    // 尝试用 SVG 素材
    const sprite = SpriteLoader.get('player');
    if (sprite) {
        ctx.save();
        // 水平翻转 + 压扁效果模拟趴下
        ctx.translate(p.x + slideW / 2, CONFIG.GROUND_Y - slideH + slideH / 2);
        ctx.scale(1.4, 0.5);   // 变宽变扁
        ctx.drawImage(sprite, -p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        return;
    }

    // 降级：Canvas 绘制（使用皮肤配色）
    // 身体：扁平椭圆
    ctx.fillStyle = playerSkin.primary_color;
    ctx.beginPath();
    ctx.roundRect(p.x - 5, CONFIG.GROUND_Y - slideH, slideW, slideH, 5);
    ctx.fill();

    // 趴下的眼睛（半闭状）
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(p.x + slideW * 0.7, CONFIG.GROUND_Y - slideH * 0.5, 6, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 背心
    ctx.fillStyle = playerSkin.accent_color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(p.x + slideW * 0.3, CONFIG.GROUND_Y - slideH - 4, slideW * 0.5, 5);
    ctx.globalAlpha = 1;
}

/** 绘制站立/跳跃姿态 */
function drawPlayerStanding(p) {
    // 尝试用 SVG 素材
    const sprite = SpriteLoader.get('player');
    if (sprite) {
        ctx.drawImage(sprite, p.x, p.y, p.w, p.h);
        return;
    }

    // 降级：Canvas 绘制（使用皮肤配色）
    const prim = playerSkin.primary_color;
    const sec  = playerSkin.secondary_color;
    const acc  = playerSkin.accent_color;

    // 身体
    ctx.fillStyle = prim;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, 6);
    ctx.fill();

    // 肚子
    ctx.fillStyle = sec;
    ctx.beginPath();
    ctx.roundRect(p.x + p.w * 0.15, p.y + p.h * 0.3, p.w * 0.7, p.h * 0.5, 5);
    ctx.fill();

    // 小背心
    ctx.fillStyle = acc;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.roundRect(p.x + 2, p.y + p.h * 0.2, p.w - 4, p.h * 0.3, 3);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 眼睛（白色）
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(p.x + p.w * 0.65, p.y + p.h * 0.2, 7, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 瞳孔
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(p.x + p.w * 0.67, p.y + p.h * 0.2, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 笑脸弧线
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x + p.w * 0.5, p.y + p.h * 0.45, 8, 0, Math.PI);
    ctx.stroke();
}
