/**
 * rank.js —— 排行榜相关 JS
 * 由【成员四：MySQL 数据库与排行榜】负责对接真实接口
 */

// 动态刷新排行榜（可供排行榜页调用）
function refreshRank() {
    console.log('[排行榜] 正在刷新...');
    location.reload();
}
