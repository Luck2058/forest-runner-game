"""
app/routes/__init__.py —— 主页蓝图
处理首页等不归属具体模块的路由
"""

from flask import Blueprint, render_template

# 创建主页蓝图
main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def index():
    """首页：显示游戏主界面"""
    return render_template('index.html')
