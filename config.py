"""
config.py —— 项目配置文件
包含开发环境、生产环境配置，以及数据库连接设置
"""

import os

# 获取项目根目录路径
BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    """基础配置类，所有环境共用的配置"""

    # Flask 密钥，用于 Session 加密（上线前请改成复杂的随机字符串）
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'forest-runner-secret-key-2024'

    # -------------------------------------------------------
    # MySQL 数据库配置
    # 格式：mysql+pymysql://用户名:密码@主机:端口/数据库名
    # -------------------------------------------------------
    DB_HOST = os.environ.get('DB_HOST') or '127.0.0.1'
    DB_PORT = os.environ.get('DB_PORT') or '3306'
    DB_USER = os.environ.get('DB_USER') or 'root'
    DB_PASSWORD = os.environ.get('DB_PASSWORD') or ''
    DB_NAME = os.environ.get('DB_NAME') or 'forest_runner'

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

    # 关闭 SQLAlchemy 的事件追踪（节省内存）
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 每页显示的排行榜条数
    RANK_PER_PAGE = 10


class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True


class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False


# 配置映射字典，通过字符串选择配置
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig   # 默认使用开发配置
}
