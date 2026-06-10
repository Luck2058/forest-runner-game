"""
run.py —— 项目启动入口
直接运行本文件即可启动 Flask 开发服务器
"""

from app import create_app

# 创建 Flask 应用实例（使用默认配置=开发配置）
app = create_app('default')

if __name__ == '__main__':
    print("=" * 50)
    print("  Forest Runner Game - Starting...")
    print("  URL: http://127.0.0.1:5000")
    print("=" * 50)
    # debug=True 开发阶段自动重载，生产环境记得关掉
    app.run(debug=True, host='0.0.0.0', port=5000)
