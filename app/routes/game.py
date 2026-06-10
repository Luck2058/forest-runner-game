"""
app/routes/game.py —— 游戏页面蓝图
负责：游戏页面渲染、登录保护
C 岗（肖盼）完成：登录后才能进入游戏，未登录跳转到登录页
"""

from flask import Blueprint, render_template, session, redirect, url_for, flash
from functools import wraps

# 创建游戏蓝图，url 前缀为 /game
game_bp = Blueprint('game', __name__)


def login_required(f):
    """
    登录保护装饰器
    用于需要登录才能访问的路由
    未登录时重定向到登录页，并携带 next 参数，登录后自动跳回
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('user_id'):
            flash('请先登录再进入游戏！', 'warning')
            return redirect(url_for('auth.login', next=f'/game/'))
        return f(*args, **kwargs)
    return decorated


@game_bp.route('/')
@login_required
def game():
    """
    游戏主页面
    需要登录才能访问，将用户信息传给模板
    """
    user_id  = session.get('user_id')
    username = session.get('username', '游客')
    nickname = session.get('nickname') or username
    return render_template('game.html', username=username, nickname=nickname, user_id=user_id)


@game_bp.route('/profile')
@login_required
def profile():
    """
    个人中心页面
    需要登录才能访问，展示个人信息和历史成绩
    """
    from app.models.user import User
    from app.models.score import Score

    user_id = session.get('user_id')
    user = User.query.get(user_id)

    # 获取个人历史成绩（最多展示 20 条）
    scores = Score.query.filter_by(user_id=user_id).order_by(Score.score.desc()).limit(20).all()

    # 统计信息
    total_games = len(scores)
    best_score  = scores[0].score if scores else 0
    total_coins = sum(s.coins for s in scores)

    return render_template(
        'profile.html',
        user=user,
        scores=scores,
        total_games=total_games,
        best_score=best_score,
        total_coins=total_coins
    )
