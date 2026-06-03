"""
app/routes/auth.py —— 用户认证蓝图
负责：注册、登录、登出功能
由【成员三：Flask 后端接口】负责完善
"""

from flask import Blueprint, render_template, request, redirect, url_for, flash, session

# 创建认证蓝图，url 前缀为 /auth
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """
    登录路由
    GET：显示登录页面
    POST：处理登录表单
    """
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        # TODO：成员三 —— 对接数据库验证用户名密码
        # 当前为演示：任何账号密码都能登录
        if username and password:
            session['username'] = username
            session['user_id'] = 1  # 演示用，后续改为真实 user_id
            flash(f'欢迎回来，{username}！', 'success')
            return redirect(url_for('main.index'))
        else:
            flash('用户名或密码不能为空！', 'danger')

    return render_template('login.html')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """
    注册路由
    GET：显示注册页面
    POST：处理注册表单
    """
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        nickname = request.form.get('nickname', '').strip()

        # TODO：成员三 —— 检查用户名是否已存在，存入数据库
        if username and password:
            flash('注册成功！请登录。', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('请填写完整信息！', 'danger')

    return render_template('register.html')


@auth_bp.route('/logout')
def logout():
    """登出，清除 session"""
    session.clear()
    flash('已成功退出登录。', 'info')
    return redirect(url_for('auth.login'))
