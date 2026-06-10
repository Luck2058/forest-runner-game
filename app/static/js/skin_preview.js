/**
 * skin_preview.js —— 皮肤商店角色独立绘制
 * 每个皮肤根据角色名称绘制独特的 Canvas 形象
 */

/** 主入口：根据皮肤名称分发到对应的绘制函数 */
function drawSkinPreview(ctx, skin, w, h) {
    const primary = skin.primary_color;
    const secondary = skin.secondary_color;
    const accent = skin.accent_color;
    const name = skin.name;

    ctx.clearRect(0, 0, w, h);

    switch (name) {
        case '棕熊勇士':      drawBrownBear(ctx, w, h, primary, secondary, accent); break;
        case '金毛憨熊':      drawGoldenBear(ctx, w, h, primary, secondary, accent); break;
        case '工匠小子':      drawCraftsman(ctx, w, h, primary, secondary, accent); break;
        case '菠萝猴王':      drawPineappleMonkey(ctx, w, h, primary, secondary, accent); break;
        case '机灵小鼠':      drawLittleMonkey(ctx, w, h, primary, secondary, accent); break;
        case '赤羽智者':      drawOwl(ctx, w, h, primary, secondary, accent); break;
        case '松果精灵':      drawSquirrel(ctx, w, h, primary, secondary, accent); break;
        case '正义警长':      drawPolice(ctx, w, h, primary, secondary, accent); break;
        default:              drawDefaultFox(ctx, w, h, primary, secondary, accent); break;
    }
}

// ==================== 棕熊勇士（熊大）====================
function drawBrownBear(ctx, w, h, primary, secondary, accent) {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.15, h*0.38, w*0.7, h*0.45, 12); ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.6, w*0.22, h*0.18, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(w*0.5, h*0.22, w*0.28, 0, Math.PI*2); ctx.fill();

    // 圆耳朵
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(w*0.28, h*0.08, w*0.12, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.72, h*0.08, w*0.12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.arc(w*0.28, h*0.08, w*0.06, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.72, h*0.08, w*0.06, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.26, w*0.14, h*0.1, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(w*0.5, h*0.24, 4, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(w*0.4, h*0.18, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.6, h*0.18, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(w*0.4, h*0.18, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.6, h*0.18, 2.5, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(w*0.5, h*0.28, 6, 0.2, Math.PI-0.2); ctx.stroke();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.22, h*0.78, w*0.2, h*0.18, 6); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.58, h*0.78, w*0.2, h*0.18, 6); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.05, h*0.45, w*0.12, h*0.25, 5); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.83, h*0.45, w*0.12, h*0.25, 5); ctx.fill();
}

// ==================== 金毛憨熊（熊二）====================
function drawGoldenBear(ctx, w, h, primary, secondary, accent) {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.58, w*0.38, h*0.32, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(w*0.5, h*0.24, w*0.32, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(w*0.22, h*0.06, w*0.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.78, h*0.06, w*0.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.arc(w*0.22, h*0.06, w*0.05, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.78, h*0.06, w*0.05, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.28, w*0.2, h*0.14, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(w*0.42, h*0.2, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.58, h*0.2, 3, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#8B4513';
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.26, 6, 4, 0, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(w*0.5, h*0.3, 7, 0.1, Math.PI-0.1); ctx.stroke();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.2, h*0.82, w*0.22, h*0.14, 8); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.58, h*0.82, w*0.22, h*0.14, 8); ctx.fill();
}

// ==================== 工匠小子（光头强）====================
function drawCraftsman(ctx, w, h, primary, secondary, accent) {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.22, h*0.42, w*0.56, h*0.4, 6); ctx.fill();

    ctx.fillStyle = '#654321';
    ctx.beginPath(); ctx.roundRect(w*0.22, h*0.75, w*0.56, h*0.2, 4); ctx.fill();

    ctx.fillStyle = '#F5DEB3';
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.22, w*0.2, h*0.18, 0, 0, Math.PI*2); ctx.fill();

    // 帽子
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.roundRect(w*0.25, h*0.02, w*0.5, h*0.14, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.2, h*0.13, w*0.6, h*0.06, 3); ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(w*0.42, h*0.2, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.58, h*0.2, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(w*0.42, h*0.2, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.58, h*0.2, 2, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.roundRect(w*0.42, h*0.28, w*0.16, 2, 1); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.08, h*0.45, w*0.14, h*0.28, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.78, h*0.45, w*0.14, h*0.28, 4); ctx.fill();
}

// ==================== 菠萝猴王（吉吉）====================
function drawPineappleMonkey(ctx, w, h, primary, secondary, accent) {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.2, h*0.4, w*0.6, h*0.38, 10); ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.55, w*0.18, h*0.14, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(w*0.5, h*0.22, w*0.24, 0, Math.PI*2); ctx.fill();

    // 菠萝冠
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(w*0.35, h*0.08); ctx.lineTo(w*0.4, h*0.0); ctx.lineTo(w*0.45, h*0.08);
    ctx.lineTo(w*0.5, h*0.0); ctx.lineTo(w*0.55, h*0.08); ctx.lineTo(w*0.6, h*0.0);
    ctx.lineTo(w*0.65, h*0.08); ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.26, w*0.16, h*0.12, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(w*0.43, h*0.2, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.57, h*0.2, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(w*0.43, h*0.2, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.57, h*0.2, 2, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#8B4513';
    ctx.beginPath(); ctx.arc(w*0.5, h*0.26, 3, 0, Math.PI*2); ctx.fill();

    // 长尾巴
    ctx.strokeStyle = primary; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w*0.85, h*0.5);
    ctx.quadraticCurveTo(w*1.0, h*0.4, w*0.9, h*0.3);
    ctx.stroke();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.25, h*0.74, w*0.18, h*0.18, 5); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.57, h*0.74, w*0.18, h*0.18, 5); ctx.fill();
}

// ==================== 机灵小鼠（毛毛）====================
function drawLittleMonkey(ctx, w, h, primary, secondary, accent) {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.25, h*0.45, w*0.5, h*0.32, 8); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(w*0.5, h*0.22, w*0.2, 0, Math.PI*2); ctx.fill();

    // 大圆耳朵
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(w*0.22, h*0.12, w*0.14, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.78, h*0.12, w*0.14, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.arc(w*0.22, h*0.12, w*0.08, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.78, h*0.12, w*0.08, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.26, w*0.14, h*0.1, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(w*0.43, h*0.2, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.57, h*0.2, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(w*0.43, h*0.2, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.57, h*0.2, 2.5, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(w*0.5, h*0.27, 2, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.ellipse(w*0.12, h*0.55, 8, 5, 0.5, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.28, h*0.74, w*0.16, h*0.16, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.56, h*0.74, w*0.16, h*0.16, 4); ctx.fill();
}

// ==================== 赤羽智者（涂涂）====================
function drawOwl(ctx, w, h, primary, secondary, accent) {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.58, w*0.28, h*0.28, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.62, w*0.18, h*0.18, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(w*0.5, h*0.2, w*0.3, 0, Math.PI*2); ctx.fill();

    // 耳羽
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(w*0.2, h*0.08); ctx.lineTo(w*0.28, h*0.18); ctx.lineTo(w*0.22, h*0.22); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w*0.8, h*0.08); ctx.lineTo(w*0.72, h*0.18); ctx.lineTo(w*0.78, h*0.22); ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.24, w*0.22, h*0.16, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(w*0.4, h*0.2, 7, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.6, h*0.2, 7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(w*0.4, h*0.2, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.6, h*0.2, 3, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(w*0.5, h*0.24); ctx.lineTo(w*0.44, h*0.3); ctx.lineTo(w*0.56, h*0.3); ctx.fill();

    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.ellipse(w*0.15, h*0.55, w*0.1, h*0.2, 0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w*0.85, h*0.55, w*0.1, h*0.2, -0.3, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#FF8C00';
    ctx.beginPath(); ctx.roundRect(w*0.32, h*0.82, w*0.12, h*0.08, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.56, h*0.82, w*0.12, h*0.08, 2); ctx.fill();
}

// ==================== 松果精灵（蹦蹦）====================
function drawSquirrel(ctx, w, h, primary, secondary, accent) {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.25, h*0.4, w*0.5, h*0.32, 8); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.2, w*0.18, h*0.16, 0, 0, Math.PI*2); ctx.fill();

    // 尖耳朵
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(w*0.32, h*0.1); ctx.lineTo(w*0.28, h*0.0); ctx.lineTo(w*0.38, h*0.06); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w*0.68, h*0.1); ctx.lineTo(w*0.72, h*0.0); ctx.lineTo(w*0.62, h*0.06); ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.24, w*0.12, h*0.1, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(w*0.44, h*0.18, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.56, h*0.18, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(w*0.44, h*0.18, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.56, h*0.18, 2, 0, Math.PI*2); ctx.fill();

    // 大尾巴
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.ellipse(w*0.15, h*0.45, w*0.12, h*0.28, -0.4, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = primary; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(w*0.08, h*(0.32+i*0.08));
        ctx.lineTo(w*0.18, h*(0.32+i*0.08));
        ctx.stroke();
    }

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.28, h*0.7, w*0.16, h*0.18, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.56, h*0.7, w*0.16, h*0.18, 4); ctx.fill();
}

// ==================== 正义警长 ====================
function drawPolice(ctx, w, h, primary, secondary, accent) {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.2, h*0.4, w*0.6, h*0.38, 8); ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(w*0.42, h*0.4); ctx.lineTo(w*0.5, h*0.48); ctx.lineTo(w*0.58, h*0.4); ctx.fill();

    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(w*0.5, h*0.42); ctx.lineTo(w*0.46, h*0.55); ctx.lineTo(w*0.54, h*0.55); ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(w*0.65, h*0.5, 5, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#F5DEB3';
    ctx.beginPath(); ctx.arc(w*0.5, h*0.18, w*0.2, 0, Math.PI*2); ctx.fill();

    // 警帽
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.25, h*0.0, w*0.5, h*0.1, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.2, h*0.09, w*0.6, h*0.06, 2); ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(w*0.5, h*0.05, 4, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.roundRect(w*0.35, h*0.16, w*0.12, h*0.06, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.53, h*0.16, w*0.12, h*0.06, 2); ctx.fill();

    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(w*0.46, h*0.28); ctx.lineTo(w*0.54, h*0.28); ctx.stroke();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.25, h*0.76, w*0.2, h*0.2, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.55, h*0.76, w*0.2, h*0.2, 4); ctx.fill();
}

// ==================== 默认小狐狸 ====================
function drawDefaultFox(ctx, w, h, primary, secondary, accent) {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.2, h*0.35, w*0.5, h*0.4, 8); ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.roundRect(w*0.28, h*0.42, w*0.35, h*0.28, 5); ctx.fill();

    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.roundRect(w*0.22, h*0.38, w*0.47, h*0.2, 3); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.22, w*0.28, h*0.2, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.ellipse(w*0.5, h*0.25, w*0.2, h*0.14, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(w*0.25, h*0.1); ctx.lineTo(w*0.18, h*0.25); ctx.lineTo(w*0.33, h*0.2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w*0.75, h*0.1); ctx.lineTo(w*0.82, h*0.25); ctx.lineTo(w*0.67, h*0.2); ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.ellipse(w*0.4, h*0.2, 5, 6, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w*0.6, h*0.2, 5, 6, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(w*0.42, h*0.2, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.62, h*0.2, 3, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(w*0.43, h*0.18, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.63, h*0.18, 1.5, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = 'rgba(255,150,150,0.4)';
    ctx.beginPath(); ctx.ellipse(w*0.3, h*0.27, 5, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w*0.7, h*0.27, 5, 3, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(w*0.25, h*0.72, w*0.15, h*0.16, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w*0.52, h*0.72, w*0.15, h*0.16, 4); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.ellipse(w*0.1, h*0.55, 10, 14, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.ellipse(w*0.08, h*0.55, 5, 8, -0.3, 0, Math.PI*2); ctx.fill();
}
