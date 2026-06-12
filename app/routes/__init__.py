"""
app/routes/__init__.py —— 主页蓝图
处理首页等不归属具体模块的路由
"""

from flask import Blueprint, Response, redirect, render_template, url_for

# 创建主页蓝图
main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def index():
    """首页：显示游戏主界面"""
    return render_template('index.html')


@main_bp.route('/favicon.ico')
def favicon():
    """提供轻量内联图标，避免浏览器自动请求 favicon 时产生 404。"""
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        '<rect width="64" height="64" rx="12" fill="#1f7a4b"/>'
        '<path d="M32 8 14 38h10L16 52h32l-8-14h10L32 8z" fill="#eaffdf"/>'
        '</svg>'
    )
    return Response(svg, mimetype='image/svg+xml')


@main_bp.route('/game3d')
def game3d():
    """3D / 2.5D 跑酷实验原型页面，独立于现有 2D 游戏。"""
    return render_template('game3d.html')


@main_bp.route('/game3d-three')
def game3d_three():
    """Three.js 真 3D 跑酷实验页，独立于 2D 正式版和 2.5D 实验版。"""
    return render_template('game3d_three.html')


@main_bp.route('/rank')
def rank_alias():
    """排行榜短路径：兼容 /rank 访问，实际页面仍使用成绩蓝图。"""
    return redirect(url_for('score.rank'))


@main_bp.route('/profile')
def profile_alias():
    """个人中心短路径：兼容 /profile 访问，登录保护仍由原路由处理。"""
    return redirect(url_for('game.profile'))
