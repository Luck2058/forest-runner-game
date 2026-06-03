"""
app/routes/score.py —— 成绩排行榜蓝图
负责：提交成绩、查询排行榜、个人历史成绩
由【成员四：MySQL 数据库与排行榜】负责完善
"""

from flask import Blueprint, render_template, request, jsonify, session

# 创建成绩蓝图，url 前缀为 /score
score_bp = Blueprint('score', __name__)

# 演示用内存数据，后续成员四改为真实数据库查询
DEMO_SCORES = [
    {'rank': 1, 'username': '森林小熊', 'score': 9980, 'coins': 88, 'distance': 2500},
    {'rank': 2, 'username': '飞奔兔子', 'score': 8760, 'coins': 72, 'distance': 2100},
    {'rank': 3, 'username': '跑酷松鼠', 'score': 7650, 'coins': 65, 'distance': 1900},
    {'rank': 4, 'username': '冒险狐狸', 'score': 6540, 'coins': 55, 'distance': 1600},
    {'rank': 5, 'username': '快乐鹿鹿', 'score': 5430, 'coins': 48, 'distance': 1400},
]


@score_bp.route('/rank')
def rank():
    """排行榜页面"""
    # TODO：成员四 —— 从数据库查询前 N 名成绩
    return render_template('rank.html', scores=DEMO_SCORES)


@score_bp.route('/submit', methods=['POST'])
def submit_score():
    """
    提交成绩接口（AJAX 调用）
    请求体：{ score, coins, distance, difficulty, play_time }
    """
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': '数据格式错误'}), 400

    score = data.get('score', 0)
    coins = data.get('coins', 0)
    distance = data.get('distance', 0)

    # TODO：成员四 —— 将成绩存入 scores 数据库表
    print(f"[成绩提交] 用户: {session.get('username', '游客')}, 分数: {score}, 金币: {coins}")

    return jsonify({'success': True, 'message': '成绩已保存！'})


@score_bp.route('/my-scores')
def my_scores():
    """个人历史成绩接口（AJAX 调用）"""
    # TODO：成员四 —— 根据 session 中的 user_id 查询个人历史成绩
    demo_my = [
        {'score': 3200, 'coins': 30, 'distance': 800, 'create_time': '2024-06-01 14:30'},
        {'score': 2100, 'coins': 20, 'distance': 550, 'create_time': '2024-06-01 10:15'},
    ]
    return jsonify({'success': True, 'scores': demo_my})
