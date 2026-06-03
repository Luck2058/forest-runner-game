"""
app/__init__.py —— Flask 应用工厂函数
使用工厂模式创建应用，便于测试和多环境切换
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from config import config

# 初始化扩展（先不绑定 app，由工厂函数绑定）
db = SQLAlchemy()              # 数据库 ORM
login_manager = LoginManager() # 登录管理器


def create_app(config_name='default'):
    """
    应用工厂函数
    :param config_name: 配置名称，可选 'development' / 'production' / 'default'
    :return: Flask app 实例
    """
    app = Flask(__name__)

    # 加载配置
    app.config.from_object(config[config_name])

    # 初始化扩展，绑定到 app
    db.init_app(app)
    login_manager.init_app(app)

    # 配置登录管理器
    login_manager.login_view = 'auth.login'        # 未登录时跳转到登录页
    login_manager.login_message = '请先登录！'
    login_manager.login_message_category = 'warning'

    # -------------------------------------------------------
    # 注册蓝图（Blueprint）
    # 每个模块对应一个蓝图，便于分工开发
    # -------------------------------------------------------
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    from app.routes.game import game_bp
    app.register_blueprint(game_bp, url_prefix='/game')

    from app.routes.score import score_bp
    app.register_blueprint(score_bp, url_prefix='/score')

    from app.routes.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/admin')

    # 注册主页路由（不带前缀）
    from app.routes import main_bp
    app.register_blueprint(main_bp)

    # 在应用上下文中创建数据库表（开发阶段使用）
    with app.app_context():
        db.create_all()

    return app
