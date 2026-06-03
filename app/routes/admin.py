"""
app/routes/admin.py —— 后台管理蓝图
负责：用户管理、公告管理、数据查看
由【成员三：Flask 后端接口】负责完善
"""

from flask import Blueprint, render_template, session, redirect, url_for, flash

# 创建管理蓝图，url 前缀为 /admin
admin_bp = Blueprint('admin', __name__)


def admin_required(f):
    """简单管理员验证装饰器（后续可替换为更完善的权限系统）"""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        # TODO：成员三 —— 改为真实的管理员权限验证
        if not session.get('username'):
            flash('请先登录！', 'warning')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated


@admin_bp.route('/')
@admin_required
def admin_index():
    """后台管理首页"""
    # 演示统计数据，后续对接真实数据库
    stats = {
        'user_count': 128,
        'today_games': 56,
        'top_score': 9980,
        'total_games': 1024,
    }
    return render_template('admin.html', stats=stats)
