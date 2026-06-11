"""
app/routes/__init__.py —— 主页蓝图
处理首页等不归属具体模块的路由
"""

from flask import Blueprint, redirect, render_template, url_for

# 创建主页蓝图
main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def index():
    """首页：显示游戏主界面"""
    return render_template('index.html')


@main_bp.route('/game3d')
def game3d():
    """3D / 2.5D 跑酷实验原型页面，独立于现有 2D 游戏。"""
    return render_template('game3d.html')


@main_bp.route('/rank')
def rank_alias():
    """排行榜短路径：兼容 /rank 访问，实际页面仍使用成绩蓝图。"""
    return redirect(url_for('score.rank'))


@main_bp.route('/profile')
def profile_alias():
    """个人中心短路径：兼容 /profile 访问，登录保护仍由原路由处理。"""
    return redirect(url_for('game.profile'))
