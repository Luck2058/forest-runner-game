/**
 * rank.js —— 排行榜前端逻辑
 * 职责：难度筛选、分页切换、AJAX 动态加载
 */
(function () {
    'use strict';

    let currentDifficulty = '%DIFFICULTY%';
    let currentPage = 1;
    let totalPages = 1;
    const PAGE_SIZE = 10;

    /** 初始化：从 URL/模板获取当前难度 */
    function init() {
        // 尝试从 URL 读取难度
        const urlParams = new URLSearchParams(window.location.search);
        currentDifficulty = urlParams.get('difficulty') || 'all';

        // 高亮初始按钮
        highlightFilterBtn(currentDifficulty);

        // 绑定事件
        document.querySelectorAll('.filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var diff = this.dataset.diff;
                if (diff !== currentDifficulty) {
                    currentDifficulty = diff;
                    currentPage = 1;
                    highlightFilterBtn(diff);
                    loadRanking();
                }
            });
        });

        var prevBtn = document.getElementById('pagePrev');
        var nextBtn = document.getElementById('pageNext');
        if (prevBtn) prevBtn.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--;
                loadRanking();
            }
        });
        if (nextBtn) nextBtn.addEventListener('click', function () {
            if (currentPage < totalPages) {
                currentPage++;
                loadRanking();
            }
        });

        var refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) refreshBtn.addEventListener('click', function () {
            loadRanking();
        });

        // 首次加载（使用模板数据，后续改为 AJAX）
        updatePagination();
    }

    /** 高亮当前难度按钮 */
    function highlightFilterBtn(diff) {
        document.querySelectorAll('.filter-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.diff === diff);
        });
    }

    /** AJAX 加载排行榜 */
    function loadRanking() {
        var params = '?page=' + currentPage + '&limit=' + PAGE_SIZE;
        if (currentDifficulty && currentDifficulty !== 'all') {
            params += '&difficulty=' + currentDifficulty;
        }

        fetch('/score/api/rank' + params)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.success) {
                    totalPages = data.total_pages || 1;
                    renderTable(data.scores);
                    updatePagination();
                }
            })
            .catch(function (err) {
                console.error('[排行榜] 加载失败:', err);
            });
    }

    /** 渲染排行表格 */
    function renderTable(scores) {
        var tbody = document.getElementById('rankTableBody');
        if (!tbody) return;

        if (!scores || scores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-tip">🌿 还没有人上榜，快去创造记录吧！</td></tr>';
            // 隐藏 podium
            var podium = document.querySelector('.top3-podium');
            if (podium) podium.style.display = 'none';
            return;
        }

        // 显示 podium（如果有 >=3 条数据）
        var podium = document.querySelector('.top3-podium');
        if (podium) {
            podium.style.display = scores.length >= 3 && currentPage === 1 ? '' : 'none';
            // 更新三甲数据
            if (scores.length >= 3 && currentPage === 1) {
                updatePodium(scores);
            }
        }

        var html = '';
        scores.forEach(function (item, idx) {
            var rank = item.rank;
            var rankIcon = '';
            if (rank === 1) rankIcon = '🥇';
            else if (rank === 2) rankIcon = '🥈';
            else if (rank === 3) rankIcon = '🥉';

            var rowClass = rank <= 3 ? 'top-row' : '';
            html += '<tr class="' + rowClass + '">';
            html += '<td class="rank-num">' + (rankIcon || rank) + '</td>';
            html += '<td class="rank-name"><span class="player-icon">🌲</span>' + escapeHtml(item.nickname) + '</td>';
            html += '<td class="rank-score">' + item.best_score + '</td>';
            html += '<td>💰 ' + item.best_coins + '</td>';
            html += '<td>' + item.distance + 'm</td>';
            html += '</tr>';
        });
        tbody.innerHTML = html;
    }

    /** 更新 podium 三甲数据 */
    function updatePodium(scores) {
        if (!scores || !scores[0]) return;
        // 数据格式: scores[0] = 第1名, scores[1] = 第2名, scores[2] = 第3名
        var podium1 = document.querySelector('.podium-1 .podium-name');
        var podium1Score = document.querySelector('.podium-1 .podium-score');
        var podium2 = document.querySelector('.podium-2 .podium-name');
        var podium2Score = document.querySelector('.podium-2 .podium-score');
        var podium3 = document.querySelector('.podium-3 .podium-name');
        var podium3Score = document.querySelector('.podium-3 .podium-score');

        if (podium1) podium1.textContent = scores[0].nickname;
        if (podium1Score) podium1Score.textContent = scores[0].best_score;
        if (podium2 && scores[1]) { podium2.textContent = scores[1].nickname; podium2Score.textContent = scores[1].best_score; }
        if (podium3 && scores[2]) { podium3.textContent = scores[2].nickname; podium3Score.textContent = scores[2].best_score; }
    }

    /** 更新分页按钮状态 */
    function updatePagination() {
        var prevBtn = document.getElementById('pagePrev');
        var nextBtn = document.getElementById('pageNext');
        var pageInfo = document.getElementById('pageInfo');

        if (prevBtn) prevBtn.disabled = (currentPage <= 1);
        if (nextBtn) nextBtn.disabled = (currentPage >= totalPages);
        if (pageInfo) pageInfo.textContent = '第 ' + currentPage + ' / ' + totalPages + ' 页';
    }

    /** 简单 HTML 转义 */
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // 页面加载后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();