"""
app/routes/admin.py -- 后台管理蓝图
负责：用户管理、公告管理、数据查看
由【成员三：Flask 后端接口】负责完善
由【成员四：MySQL 数据库与排行榜】配合实现管理员权限验证
"""

from flask import Blueprint, render_template, session, redirect, url_for, flash, request, jsonify
from functools import wraps
from app import db
from app.models.user import User
from app.models.score import Score
from app.models.notice import Notice

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
    """后台管理首页 -- 显示真实统计数据 + 用户列表 + 最近成绩 + 公告列表"""
    stats = Score.get_statistics()
    stats['user_count'] = User.query.count()

    # 获取用户列表（按注册时间降序）
    users = User.query.order_by(User.create_time.desc()).all()

    # 获取最近 20 条成绩记录（按时间降序）
    recent_scores = Score.query.order_by(Score.create_time.desc()).limit(20).all()

    # 获取公告列表（按时间降序）
    notices = Notice.query.order_by(Notice.create_time.desc()).all()

    return render_template(
        'admin.html',
        stats=stats,
        users=users,
        recent_scores=recent_scores,
        notices=notices,
    )


@admin_bp.route('/notice/add', methods=['POST'])
@admin_required
def add_notice():
    """新增公告"""
    title = request.form.get('title', '').strip()
    content = request.form.get('content', '').strip()

    if not title:
        flash('公告标题不能为空！', 'danger')
        return redirect(url_for('admin.admin_index'))

    user_id = session.get('user_id')
    notice = Notice(title=title, content=content, author_id=user_id)
    db.session.add(notice)
    db.session.commit()

    flash(f'公告「{title}」发布成功！', 'success')
    return redirect(url_for('admin.admin_index'))


@admin_bp.route('/notice/delete/<int:notice_id>', methods=['POST'])
@admin_required
def delete_notice(notice_id):
    """删除公告"""
    notice = Notice.query.get_or_404(notice_id)
    title = notice.title
    db.session.delete(notice)
    db.session.commit()

    flash(f'公告「{title}」已删除！', 'success')
    return redirect(url_for('admin.admin_index'))
