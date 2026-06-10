/**
 * game_character.js —— 游戏内角色独立绘制
 * 覆盖 player.js 中的 drawPlayerStanding，按皮肤名称绘制不同角色形象
 */

function drawPlayerStanding(p) {
    // 只有当前皮肤配置了 sprite_path 时才用 SVG 素材，否则走 Canvas 独立绘制
    if (playerSkin.sprite_path) {
        const sprite = SpriteLoader.get('player');
        if (sprite) {
            ctx.drawImage(sprite, p.x, p.y, p.w, p.h);
            return;
        }
    }

    const skinName = playerSkin.name || '森林小狐狸';
    const prim = playerSkin.primary_color;
    const sec  = playerSkin.secondary_color;
    const acc  = playerSkin.accent_color;

    switch (skinName) {
        case '棕熊勇士': drawGameBear(p, prim, sec, acc, false); break;
        case '金毛憨熊': drawGameBear(p, prim, sec, acc, true); break;
        case '工匠小子': drawGameHuman(p, prim, sec, acc, 'craftsman'); break;
        case '菠萝猴王': drawGameMonkey(p, prim, sec, acc, true); break;
        case '机灵小鼠': drawGameMonkey(p, prim, sec, acc, false); break;
        case '赤羽智者': drawGameOwl(p, prim, sec, acc); break;
        case '松果精灵': drawGameSquirrel(p, prim, sec, acc); break;
        case '正义警长': drawGameHuman(p, prim, sec, acc, 'police'); break;
        default: drawGameFox(p, prim, sec, acc); break;
    }
}

// ==================== 默认小狐狸 ====================
function drawGameFox(p, prim, sec, acc) {
    const legOffset = Math.sin(player.slideTimer * 0.3 || 0) * 4;
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, 6); ctx.fill();
    ctx.fillStyle = sec;
    ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.15, p.y + p.h * 0.3, p.w * 0.7, p.h * 0.5, 5); ctx.fill();
    ctx.fillStyle = acc; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.roundRect(p.x + 2, p.y + p.h * 0.2, p.w - 4, p.h * 0.3, 3); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.roundRect(p.x + 5, p.y + p.h - 5 + legOffset, p.w * 0.3, 12, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.6, p.y + p.h - 5 - legOffset, p.w * 0.3, 12, 3); ctx.fill();
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.5, p.y - 8, p.w * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = prim;
    ctx.beginPath();
    ctx.moveTo(p.x + p.w * 0.2, p.y - 20); ctx.lineTo(p.x + p.w * 0.1, p.y - 5); ctx.lineTo(p.x + p.w * 0.35, p.y - 8); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x + p.w * 0.8, p.y - 20); ctx.lineTo(p.x + p.w * 0.9, p.y - 5); ctx.lineTo(p.x + p.w * 0.65, p.y - 8); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.6, p.y - 10, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.62, p.y - 10, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.5, p.y + 2, 6, 0, Math.PI); ctx.stroke();
}

// ==================== 熊（熊大/熊二）====================
function drawGameBear(p, prim, sec, acc, isGolden) {
    const legOffset = Math.sin(player.slideTimer * 0.3 || 0) * 4;
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.roundRect(p.x, p.y + 5, p.w, p.h - 5, 10); ctx.fill();
    ctx.fillStyle = sec;
    ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.5, p.y + p.h * 0.55, p.w * 0.3, p.h * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.roundRect(p.x + 5, p.y + p.h - 8 + legOffset, p.w * 0.35, 14, 5); ctx.fill();
    ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.55, p.y + p.h - 8 - legOffset, p.w * 0.35, 14, 5); ctx.fill();
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.5, p.y - 5, p.w * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.2, p.y - 22, p.w * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.8, p.y - 22, p.w * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = sec;
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.2, p.y - 22, p.w * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.8, p.y - 22, p.w * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = sec;
    ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.5, p.y + 5, p.w * 0.22, p.h * 0.15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.4, p.y - 5, isGolden ? 2.5 : 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.6, p.y - 5, isGolden ? 2.5 : 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8B4513';
    ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.5, p.y + 2, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.5, p.y + 6, 5, 0.1, Math.PI - 0.1); ctx.stroke();
}

// ==================== 猴子（吉吉/毛毛）====================
function drawGameMonkey(p, prim, sec, acc, hasCrown) {
    const legOffset = Math.sin(player.slideTimer * 0.3 || 0) * 4;
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.roundRect(p.x + 3, p.y + 8, p.w - 6, p.h - 8, 8); ctx.fill();
    ctx.fillStyle = sec;
    ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.5, p.y + p.h * 0.55, p.w * 0.25, p.h * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.roundRect(p.x + 6, p.y + p.h - 6 + legOffset, p.w * 0.3, 12, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.6, p.y + p.h - 6 - legOffset, p.w * 0.3, 12, 4); ctx.fill();
    ctx.strokeStyle = prim; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x + p.w, p.y + p.h * 0.4);
    ctx.quadraticCurveTo(p.x + p.w + 15, p.y + p.h * 0.2, p.x + p.w + 5, p.y);
    ctx.stroke();
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.5, p.y - 2, p.w * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.05, p.y - 12, p.w * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.95, p.y - 12, p.w * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = sec;
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.05, p.y - 12, p.w * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.95, p.y - 12, p.w * 0.09, 0, Math.PI * 2); ctx.fill();
    if (hasCrown) {
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.moveTo(p.x + p.w * 0.3, p.y - 20); ctx.lineTo(p.x + p.w * 0.4, p.y - 32);
        ctx.lineTo(p.x + p.w * 0.5, p.y - 20); ctx.lineTo(p.x + p.w * 0.6, p.y - 32);
        ctx.lineTo(p.x + p.w * 0.7, p.y - 20); ctx.fill();
    }
    ctx.fillStyle = sec;
    ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.5, p.y + 6, p.w * 0.18, p.h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.42, p.y - 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.58, p.y - 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.42, p.y - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.58, p.y - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8B4513';
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.5, p.y + 5, 2.5, 0, Math.PI * 2); ctx.fill();
}

// ==================== 人形（光头强/警察）====================
function drawGameHuman(p, prim, sec, acc, style) {
    const legOffset = Math.sin(player.slideTimer * 0.3 || 0) * 4;
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.roundRect(p.x + 5, p.y + 5, p.w - 10, p.h - 10, 5); ctx.fill();
    ctx.fillStyle = '#654321';
    ctx.beginPath(); ctx.roundRect(p.x + 5, p.y + p.h - 15, p.w - 10, 15, 3); ctx.fill();
    ctx.fillStyle = style === 'police' ? prim : '#654321';
    ctx.beginPath(); ctx.roundRect(p.x + 8, p.y + p.h - 5 + legOffset, p.w * 0.3, 12, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.58, p.y + p.h - 5 - legOffset, p.w * 0.3, 12, 3); ctx.fill();
    ctx.fillStyle = '#F5DEB3';
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.5, p.y - 5, p.w * 0.3, 0, Math.PI * 2); ctx.fill();
    if (style === 'craftsman') {
        ctx.fillStyle = acc;
        ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.15, p.y - 28, p.w * 0.7, p.w * 0.2, 3); ctx.fill();
        ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.1, p.y - 20, p.w * 0.8, p.w * 0.1, 2); ctx.fill();
    } else if (style === 'police') {
        ctx.fillStyle = prim;
        ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.2, p.y - 28, p.w * 0.6, p.w * 0.15, 2); ctx.fill();
        ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.15, p.y - 20, p.w * 0.7, p.w * 0.08, 2); ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(p.x + p.w * 0.5, p.y - 22, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.32, p.y - 12, p.w * 0.15, 5, 1); ctx.fill();
        ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.53, p.y - 12, p.w * 0.15, 5, 1); ctx.fill();
    }

    if (style !== 'police') {
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(p.x + p.w * 0.4, p.y - 8, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.x + p.w * 0.6, p.y - 8, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.arc(p.x + p.w * 0.4, p.y - 8, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.x + p.w * 0.6, p.y - 8, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.5, p.y + 2, 3, 0.2, Math.PI - 0.2); ctx.stroke();
}

// ==================== 猫头鹰（涂涂）====================
function drawGameOwl(p, prim, sec, acc) {
    const legOffset = Math.sin(player.slideTimer * 0.3 || 0) * 4;
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.5, p.y + p.h * 0.5, p.w * 0.4, p.h * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = sec;
    ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.5, p.y + p.h * 0.55, p.w * 0.25, p.h * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.25, p.y + p.h - 5 + legOffset, p.w * 0.2, 10, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.55, p.y + p.h - 5 - legOffset, p.w * 0.2, 10, 2); ctx.fill();
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.5, p.y - 2, p.w * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = acc;
    ctx.beginPath();
    ctx.moveTo(p.x + p.w * 0.1, p.y - 20); ctx.lineTo(p.x + p.w * 0.22, p.y - 5); ctx.lineTo(p.x + p.w * 0.15, p.y); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x + p.w * 0.9, p.y - 20); ctx.lineTo(p.x + p.w * 0.78, p.y - 5); ctx.lineTo(p.x + p.w * 0.85, p.y); ctx.fill();
    ctx.fillStyle = sec;
    ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.5, p.y + 5, p.w * 0.28, p.h * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.38, p.y - 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.62, p.y - 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.38, p.y - 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.62, p.y - 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(p.x + p.w * 0.5, p.y + 5); ctx.lineTo(p.x + p.w * 0.42, p.y + 12); ctx.lineTo(p.x + p.w * 0.58, p.y + 12); ctx.fill();
}

// ==================== 松鼠（蹦蹦）====================
function drawGameSquirrel(p, prim, sec, acc) {
    const legOffset = Math.sin(player.slideTimer * 0.3 || 0) * 4;
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.roundRect(p.x + 3, p.y + 5, p.w - 6, p.h - 10, 6); ctx.fill();
    ctx.fillStyle = sec;
    ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.5, p.y + p.h * 0.5, p.w * 0.22, p.h * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.roundRect(p.x + 6, p.y + p.h - 10 + legOffset, p.w * 0.28, 12, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(p.x + p.w * 0.6, p.y + p.h - 10 - legOffset, p.w * 0.28, 12, 3); ctx.fill();
    ctx.fillStyle = acc;
    ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.85, p.y + p.h * 0.25, p.w * 0.18, p.h * 0.45, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = prim;
    ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.5, p.y - 5, p.w * 0.28, p.h * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = prim;
    ctx.beginPath();
    ctx.moveTo(p.x + p.w * 0.3, p.y - 15); ctx.lineTo(p.x + p.w * 0.25, p.y - 28); ctx.lineTo(p.x + p.w * 0.4, p.y - 18); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x + p.w * 0.7, p.y - 15); ctx.lineTo(p.x + p.w * 0.75, p.y - 28); ctx.lineTo(p.x + p.w * 0.6, p.y - 18); ctx.fill();
    ctx.fillStyle = sec;
    ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.5, p.y + 3, p.w * 0.18, p.h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.42, p.y - 5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.58, p.y - 5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.42, p.y - 5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.58, p.y - 5, 2, 0, Math.PI * 2); ctx.fill();
}
