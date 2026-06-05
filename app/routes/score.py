"""
app/routes/score.py -- 成绩排行榜蓝图
负责：提交成绩、查询排行榜、个人历史成绩
由【成员四：MySQL 数据库与排行榜】负责完善
"""

from flask import Blueprint, render_template, request, jsonify, session
from app import db
from app.models.score import Score
from app.models.user import User

# 创建成绩蓝图，url 前缀为 /score
score_bp = Blueprint('score', __name__)


@score_bp.route('/rank')
def rank():
    """排行榜页面 -- 从数据库查询前 N 名成绩"""
    scores = Score.get_global_ranking(limit=20)
    return render_template('rank.html', scores=scores)


@score_bp.route('/api/rank')
def api_rank():
    """排行榜 API -- 返回 JSON 格式排行榜数据（供前端 AJAX 调用）"""
    limit = request.args.get('limit', 20, type=int)
    scores = Score.get_global_ranking(limit=limit)
    return jsonify({'success': True, 'scores': scores})


@score_bp.route('/submit', methods=['POST'])
def submit_score():
    """
    提交成绩接口（AJAX 调用）
    请求体：{ score, coins, distance, difficulty, play_time }
    """
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': '数据格式错误'}), 400

    # 检查用户是否登录
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '请先登录！'}), 401

    # 获取并校验数据
    score_value = data.get('score', 0)
    coins = data.get('coins', 0)
    distance = data.get('distance', 0)
    difficulty = data.get('difficulty', 'normal')
    play_time = data.get('play_time', 0)

    # 数据校验
    if not isinstance(score_value, int) or score_value < 0:
        return jsonify({'success': False, 'message': '分数格式错误'}), 400

    # 创建成绩记录并保存到数据库
    new_score = Score(
        user_id=user_id,
        score=score_value,
        coins=coins,
        distance=distance,
        difficulty=difficulty,
        play_time=play_time
    )
    db.session.add(new_score)
    db.session.commit()

    # 获取用户最高分用于判断新纪录
    best_score = Score.get_user_best_score(user_id)
    is_new_record = score_value >= best_score

    return jsonify({
        'success': True,
        'message': '成绩已保存！',
        'is_new_record': is_new_record,
        'score_id': new_score.id
    })


@score_bp.route('/my-scores')
def my_scores():
    """个人历史成绩接口（AJAX 调用）-- 返回当前登录用户的所有成绩"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '请先登录！'}), 401

    scores = Score.get_user_scores(user_id)
    scores_data = [s.to_dict() for s in scores]

    # 附加统计信息
    total_games = len(scores_data)
    best_score = scores_data[0]['score'] if scores_data else 0
    total_coins = sum(s['coins'] for s in scores_data)

    return jsonify({
        'success': True,
        'scores': scores_data,
        'statistics': {
            'total_games': total_games,
            'best_score': best_score,
            'total_coins': total_coins
        }
    })


@score_bp.route('/statistics')
def statistics():
    """全局统计信息接口"""
    stats = Score.get_statistics()
    return jsonify({'success': True, 'statistics': stats})
