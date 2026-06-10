/**
 * audio.js —— 【B岗新增】音效系统模块
 *
 * 职责：
 *   - Web Audio API 音效生成（跳跃/金币/碰撞/背景音乐）
 *   - 音效开关控制
 *   - 所有音效均为程序化生成，无需外部音频文件
 *
 * 依赖：无（独立模块，被 player.js / obstacle.js 调用 playSFX）
 */

// ============================================================
// 音频上下文 & 状态
// ============================================================
let audioCtx = null;
let soundEnabled = true;          // 音效开关（默认开启）
let bgmOscillator = null;         // 背景音乐振荡器
let bgmGain = null;               // 背景音乐音量节点

/** 初始化 AudioContext（需要用户交互后才能创建） */
function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('[音效] Web Audio API 不可用:', e);
        soundEnabled = false;
    }
}

// ============================================================
// 音效播放函数
// ============================================================

/** 播放指定类型的音效 */
function playSFX(type) {
    if (!soundEnabled || !audioCtx) return;

    // 确保 AudioContext 处于运行状态
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    switch (type) {
        case 'jump':  sfxJump();  break;
        case 'coin':  sfxCoin();  break;
        case 'crash': sfxCrash(); break;
    }
}

/** 跳跃音效：短促上升音调 */
function sfxJump() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
}

/** 金币收集音效：清脆叮咚声 */
function sfxCoin() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
}

/** 碰撞音效：低沉嗡嗡声 */
function sfxCrash() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const osc2 = audioCtx.createOscillator();

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(80, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

    osc.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.35);
    osc2.stop(audioCtx.currentTime + 0.35);
}

// ============================================================
// 背景音乐（简单旋律循环）
// ============================================================

/** 开始背景音乐 */
function startBGM() {
    if (!soundEnabled || !audioCtx || bgmOscillator) return;

    bgmGain = audioCtx.createGain();
    bgmGain.gain.value = 0.03;   // 很小的音量
    bgmGain.connect(audioCtx.destination);

    bgmOscillator = audioCtx.createOscillator();
    bgmOscillator.type = 'sine';
    bgmOscillator.frequency.value = 220;
    bgmOscillator.connect(bgmGain);
    bgmOscillator.start();
}

/** 停止背景音乐 */
function stopBGM() {
    if (bgmOscillator) {
        try {
            bgmOscillator.stop();
        } catch (e) { /* 已停止 */ }
        bgmOscillator = null;
    }
}

// ============================================================
// 音效开关控制
// ============================================================

/** 切换音效开关 */
function toggleSound() {
    soundEnabled = !soundEnabled;

    if (!soundEnabled) {
        stopBGM();
    } else if (audioCtx && gameState === 'running') {
        startBGM();
    }

    // 更新按钮文字
    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
        btn.textContent = soundEnabled ? '🔊 音效' : '🔇 静音';
    }
    return soundEnabled;
}
