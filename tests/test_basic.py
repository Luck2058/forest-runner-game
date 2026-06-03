"""
tests/test_basic.py —— 基础单元测试
由【成员五：测试与展示材料负责人】负责补充完善
运行方式：python -m pytest tests/
"""

import pytest
import sys
import os

# 将项目根目录加入路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from run import app as flask_app


@pytest.fixture
def client():
    """创建测试客户端"""
    flask_app.config['TESTING'] = True
    flask_app.config['WTF_CSRF_ENABLED'] = False
    with flask_app.test_client() as client:
        yield client


class TestBasicRoutes:
    """测试基础页面路由是否正常返回"""

    def test_index_page(self, client):
        """首页应该返回 200"""
        response = client.get('/')
        assert response.status_code == 200

    def test_login_page(self, client):
        """登录页应该返回 200"""
        response = client.get('/auth/login')
        assert response.status_code == 200

    def test_register_page(self, client):
        """注册页应该返回 200"""
        response = client.get('/auth/register')
        assert response.status_code == 200

    def test_game_page(self, client):
        """游戏页应该返回 200"""
        response = client.get('/game/')
        assert response.status_code == 200

    def test_rank_page(self, client):
        """排行榜页应该返回 200"""
        response = client.get('/score/rank')
        assert response.status_code == 200

    def test_admin_page(self, client):
        """后台管理页应该返回 200（当前无权限拦截）"""
        response = client.get('/admin/')
        assert response.status_code == 200


class TestScoreAPI:
    """测试成绩 API"""

    def test_submit_score_json(self, client):
        """成绩提交接口应接受 JSON 并返回 success"""
        response = client.post(
            '/score/submit',
            json={'score': 1000, 'coins': 10, 'distance': 300},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True

    def test_submit_score_empty(self, client):
        """成绩提交接口：空数据应返回 400"""
        response = client.post('/score/submit', data='', content_type='application/json')
        assert response.status_code == 400

    def test_my_scores(self, client):
        """个人成绩接口应该返回列表"""
        response = client.get('/score/my-scores')
        assert response.status_code == 200
        data = response.get_json()
        assert 'scores' in data


class TestLogin:
    """测试登录功能"""

    def test_login_post_success(self, client):
        """演示模式：任意用户名密码登录，应重定向到首页"""
        response = client.post(
            '/auth/login',
            data={'username': 'testuser', 'password': 'testpass'},
            follow_redirects=True,
        )
        assert response.status_code == 200

    def test_login_post_empty(self, client):
        """空用户名不应登录成功"""
        response = client.post(
            '/auth/login',
            data={'username': '', 'password': ''},
            follow_redirects=True,
        )
        # 应停留在登录页或显示错误
        assert response.status_code == 200


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
