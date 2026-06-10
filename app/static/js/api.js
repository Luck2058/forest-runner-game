/**
 * api.js —— 后端接口通信模块
 *
 * 职责：
 *   - 游戏结束时提交成绩到服务器
 *   - （后续可扩展）获取排行榜数据、保存用户设置等
 *
 * 依赖：score / coins / distance（来自 score.js 模块）
 */

// ============================================================
// 提交游戏成绩到后端
// ============================================================

/**
 * 将当前局的成绩通过 AJAX 提交到 Flask 后端
 * 接口：POST /score/submit
 * 数据格式：JSON { score, coins, distance, difficulty, play_time }
 */
function submitScore() {
    fetch('/score/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            score:      score,
            coins:      coins,
            distance:   distance,
            difficulty: currentDifficulty || 'normal',
            play_time:  Math.floor(frameCount / 60),   // 帧数转秒数
        }),
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('[成绩] 提交成功:', data.message);

            // 更新试玩状态
            if (typeof data.trial_remaining !== 'undefined') {
                const trialHud = document.getElementById('trialHud');
                const trialDisplay = document.getElementById('trialDisplay');
                if (trialHud && trialDisplay) {
                    if (data.trial_remaining > 0) {
                        trialDisplay.textContent = '剩余' + data.trial_remaining + '局';
                    } else {
                        trialHud.style.display = 'none';
                    }
                }
            }
        } else {
            console.warn('[成绩] 服务器返回异常:', data);
        }
    })
    .catch(err => {
        // 未登录或网络问题，静默处理不影响游戏体验
        console.warn('[成绩] 提交失败（可能未登录）:', err);
    });
}

// ============================================================
// （预留）获取排行榜数据
// ============================================================
// function fetchLeaderboard() {
//     return fetch('/score/api/rank')
//         .then(res => res.json())
//         .then(data => data.ranking || []);
// }
