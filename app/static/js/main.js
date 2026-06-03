/**
 * main.js —— 全局通用 JS
 * 处理 Flash 消息自动消失、导航高亮等公共功能
 * 由【成员二：美术设计与趣味交互】负责添加更多交互效果
 */

// Flash 消息 3 秒后自动消失
window.addEventListener('DOMContentLoaded', function () {

    // ---- Flash 消息自动关闭 ----
    setTimeout(function () {
        document.querySelectorAll('.alert').forEach(function (el) {
            el.style.transition = 'opacity 0.5s';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 500);
        });
    }, 3000);

    // ---- 当前页面导航高亮 ----
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(function (link) {
        if (link.getAttribute('href') === currentPath) {
            link.style.background = 'rgba(255,255,255,0.25)';
        }
    });

    // ---- 防止双击按钮提交两次 ----
    document.querySelectorAll('form').forEach(function (form) {
        form.addEventListener('submit', function () {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '提交中...';
            }
        });
    });

});
