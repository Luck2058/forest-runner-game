"""
app/routes/auth.py —— 用户认证蓝图
负责：注册、登录、登出功能
C 岗（肖盼）完成：真实数据库验证、密码加密、表单校验
"""

from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app import db
from app.models.user import User

# 创建认证蓝图，url 前缀为 /auth
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """
    登录路由
    GET：显示登录页面
    POST：处理登录表单，验证数据库中的用户名和密码
    """
    # 如果已经登录，直接跳转首页
    if session.get('user_id'):
        return redirect(url_for('main.index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        # ---- 表单验证 ----
        if not username:
            flash('用户名不能为空！', 'danger')
            return render_template('login.html')
        if not password:
            flash('密码不能为空！', 'danger')
            return render_template('login.html')

        # ---- 查询数据库 ----
        user = User.query.filter_by(username=username).first()

        # 用户不存在，或密码错误
        if user is None or not user.check_password(password):
            flash('用户名或密码错误，请重新输入。', 'danger')
            return render_template('login.html')

        # ---- 登录成功，写入 session ----
        session['user_id'] = user.id
        session['username'] = user.username
        session['nickname'] = user.nickname or user.username

        flash(f'欢迎回来，{user.nickname or user.username}！', 'success')

        # 如果有 next 参数（未登录时被跳转过来），登录后跳回原页面
        next_page = request.args.get('next')
        if next_page:
            return redirect(next_page)
        return redirect(url_for('main.index'))

    return render_template('login.html')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """
    注册路由
    GET：显示注册页面
    POST：处理注册表单，写入数据库
    """
    # 如果已经登录，直接跳转首页
    if session.get('user_id'):
        return redirect(url_for('main.index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        confirm  = request.form.get('confirm',  '').strip()
        nickname = request.form.get('nickname',  '').strip()

        # ---- 表单验证 ----
        if not username:
            flash('用户名不能为空！', 'danger')
            return render_template('register.html')

        if len(username) < 3 or len(username) > 20:
            flash('用户名长度必须在 3~20 个字符之间。', 'danger')
            return render_template('register.html')

        if not password:
            flash('密码不能为空！', 'danger')
            return render_template('register.html')

        if len(password) < 6:
            flash('密码长度至少 6 位。', 'danger')
            return render_template('register.html')

        if password != confirm:
            flash('两次密码输入不一致，请重新输入。', 'danger')
            return render_template('register.html')

        # ---- 检查用户名是否已存在 ----
        existing = User.query.filter_by(username=username).first()
        if existing:
            flash('该用户名已被注册，请换一个。', 'warning')
            return render_template('register.html')

        # ---- 创建用户，密码自动加密 ----
        new_user = User(
            username=username,
            nickname=nickname if nickname else username  # 未填昵称则用用户名
        )
        new_user.set_password(password)   # werkzeug 哈希加密

        db.session.add(new_user)
        db.session.commit()

        flash('注册成功！请登录。', 'success')
        return redirect(url_for('auth.login'))

    return render_template('register.html')


@auth_bp.route('/logout')
def logout():
    """登出，清除 session"""
    username = session.get('nickname') or session.get('username', '')
    session.clear()
    if username:
        flash(f'再见，{username}！', 'info')
    else:
        flash('已成功退出登录。', 'info')
    return redirect(url_for('auth.login'))
