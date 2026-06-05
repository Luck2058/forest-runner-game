"""
app/routes/admin.py -- 后台管理蓝图
负责：用户管理、公告管理、数据查看
由【成员三：Flask 后端接口】负责完善
由【成员四：MySQL 数据库与排行榜】配合实现管理员权限验证
"""

from flask import Blueprint, render_template, session, redirect, url_for, flash
from functools import wraps
from app import db
from app.models.user import User
from app.models.score import Score

# 创建管理蓝图，url 前缀为 /admin
admin_bp = Blueprint('admin', __name__)


def admin_required(f):
    """管理员权限验证装饰器 -- 通过数据库 is_admin 字段判断"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            flash('请先登录！', 'warning')
            return redirect(url_for('auth.login'))

        user = User.query.get(user_id)
        if not user or not user.is_admin:
            flash('权限不足，需要管理员身份！', 'danger')
            return redirect(url_for('main.index'))

        return f(*args, **kwargs)
    return decorated


@admin_bp.route('/')
@admin_required
def admin_index():
    """后台管理首页 -- 显示真实统计数据"""
    stats = Score.get_statistics()
    stats['user_count'] = User.query.count()
    return render_template('admin.html', stats=stats)


@admin_bp.route('/users')
@admin_required
def admin_users():
    """用户管理列表"""
    users = User.query.all()
    return render_template('admin_users.html', users=users)


@admin_bp.route('/scores')
@admin_required
def admin_scores():
    """成绩管理列表"""
    scores = Score.query.order_by(Score.create_time.desc()).all()
    return render_template('admin_scores.html', scores=scores)
