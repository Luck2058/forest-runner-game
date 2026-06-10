/**
 * config.js —— 游戏全局配置 & 工具函数
 *
 * 必须在所有其他游戏模块之前加载（第一个 <script> 标签）
 * 提供 CONFIG 常量 + randInt / rectsCollide / rectCircleCollide 工具函数
 *
 * 【B岗修改】新增：图片素材路径配置、SpriteLoader 图片加载管理器
 */

// ============================================================
// 获取 Canvas 和 2D 上下文（所有绘图模块共享）
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ============================================================
// 游戏常量配置（方便调整游戏难度，所有模块共用）
// ============================================================
const CONFIG = {
    // 地面 Y 坐标（相对 canvas 底部）
    GROUND_Y: canvas.height - 50,

    // ---- 玩家设置 ----
    PLAYER_X:       60,
    PLAYER_W:       40,
    PLAYER_H:       50,
    JUMP_FORCE:    -14,       // 跳跃初速度（负数=向上）
    GRAVITY:         0.6,     // 重力加速度

    // ---- 障碍物设置 ----
    OBS_W_MIN:      20,
    OBS_W_MAX:      35,
    OBS_H_MIN:      35,
    OBS_H_MAX:      70,
    OBS_SPEED:      3.5,      // 初始移动速度

    // ---- 金币设置 ----
    COIN_R:         12,
    COIN_SPEED:     3.5,

    // ---- 难度随时间加速 ----
    SPEED_UP_INTERVAL: 500,   // 每500帧（~8秒）加速一次
    SPEED_UP_AMOUNT:   0.12,  // 每次加速幅度
    MAX_SPEED:          10,   // 速度上限

    // ---- 障碍物生成间隔（帧）----
    OBS_INTERVAL_MIN:  90,
    OBS_INTERVAL_MAX:  160,

    // ---- 金币生成间隔（帧）----
    COIN_INTERVAL_MIN: 60,
    COIN_INTERVAL_MAX: 120,

    // ---- 分数规则 ----
    SCORE_PER_FRAME: 1,
    COIN_SCORE:      10,

    // ---- 下滑动作设置 ----
    SLIDE_H_RATIO:      0.4,    // 下滑时高度比例（原始高度的40%）
    MAX_SLIDE_FRAMES:   90,     // 最大下滑持续帧数（~1.5秒）
    SLIDE_COOLDOWN:     10,     // 下滑结束后冷却帧数

    // ---- 空中障碍物设置 ----
    AIR_OBS_CHANCE:     0.30,   // 空中障碍物出现概率
    AIR_OBS_H_MIN:      25,
    AIR_OBS_H_MAX:      35,
    AIR_OBS_GROUND_GAP: 55,     // 空中障碍物离地面最小距离

    // ---- 【B岗新增】图片素材路径 ----
    SPRITE_PLAYER:         '/static/images/player.svg',
    SPRITE_OBSTACLE_STUMP: '/static/images/obstacle_stump.svg',
    SPRITE_OBSTACLE_STONE: '/static/images/obstacle_stone.svg',
    SPRITE_OBSTACLE_BIRD:  '/static/images/obstacle_bird.svg',
    SPRITE_COIN:           '/static/images/coin.svg',
    SPRITE_POWERUP_MAGNET: '/static/images/powerup_magnet.svg',
};

// ============================================================
// 【B岗新增】SpriteLoader —— 图片素材加载管理器
// 加载 SVG/PNG 图片，加载失败时返回 null（由各绘制模块降级到 Canvas 绘制）
// ============================================================
const SpriteLoader = {
    _cache: {},   // 已加载的图片缓存

    /** 加载一张图片，返回 Promise<Image> */
    load(key, src) {
        return new Promise((resolve) => {
            if (this._cache[key]) {
                resolve(this._cache[key]);
                return;
            }
            const img = new Image();
            img.onload = () => {
                this._cache[key] = img;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`[素材] 加载失败: ${key} (${src})，将降级为Canvas绘制`);
                this._cache[key] = null;   // null 表示加载失败
                resolve(null);
            };
            img.src = src;
        });
    },

    /** 获取已缓存图片（同步），无则返回 null */
    get(key) {
        return this._cache[key] || null;
    },

    /** 批量加载所有游戏素材，返回 Promise */
    loadAll() {
        const tasks = [
            this.load('player',         CONFIG.SPRITE_PLAYER),
            this.load('obstacle_stump', CONFIG.SPRITE_OBSTACLE_STUMP),
            this.load('obstacle_stone', CONFIG.SPRITE_OBSTACLE_STONE),
            this.load('obstacle_bird',  CONFIG.SPRITE_OBSTACLE_BIRD),
            this.load('coin',           CONFIG.SPRITE_COIN),
            this.load('powerup_magnet', CONFIG.SPRITE_POWERUP_MAGNET),
        ];
        return Promise.all(tasks);
    }
};

// ============================================================
// 工具函数（供所有模块使用）
// ============================================================

/** 返回 [min, max] 之间的随机整数 */
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 矩形碰撞检测（AABB）—— 用于玩家 vs 障碍物 */
function rectsCollide(r1, r2) {
    return (
        r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y
    );
}

/** 矩形与圆形碰撞检测 —— 用于玩家 vs 金币 */
function rectCircleCollide(rect, circle) {
    const nearX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const nearY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - nearX;
    const dy = circle.y - nearY;
    return (dx * dx + dy * dy) < (circle.r * circle.r);
}
