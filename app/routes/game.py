"""
app/routes/game.py —— 游戏页面蓝图
负责：游戏页面渲染、游戏相关接口
由【成员一：游戏核心逻辑】和【成员三：Flask 后端接口】共同负责
"""

from flask import Blueprint, render_template, session, redirect, url_for

# 创建游戏蓝图，url 前缀为 /game
game_bp = Blueprint('game', __name__)


@game_bp.route('/')
def game():
    """游戏主页面"""
    # TODO：成员三 —— 可以加登录验证
    username = session.get('username', '游客')
    return render_template('game.html', username=username)


@game_bp.route('/profile')
def profile():
    """个人中心页面"""
    username = session.get('username', '游客')
    return render_template('profile.html', username=username)
