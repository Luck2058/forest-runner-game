"""
app/routes/score.py -- 成绩排行榜蓝图
负责：提交成绩、查询排行榜、个人历史成绩
C 岗（肖盼）完成：登录验证、数据校验、接口对接数据库
"""

from flask import Blueprint, render_template, request, jsonify, session
from app import db
from app.models.score import Score
from app.models.user import User

# 创建成绩蓝图，url 前缀为 /score
score_bp = Blueprint('score', __name__)


@score_bp.route('/rank')
def rank():
    """
    排行榜页面（GET /score/rank）
    从数据库查询全服前 20 名最高分并渲染页面
    """
    scores = Score.get_global_ranking(limit=20)
    return render_template('rank.html', scores=scores)


@score_bp.route('/api/rank')
def api_rank():
    """
    排行榜 JSON 接口（GET /score/api/rank）
    供前端 AJAX 调用，返回 JSON 格式排行榜
    参数：?limit=20（可选，默认20）
    """
    limit  = request.args.get('limit', 20, type=int)
    # limit 最大不超过 100，防止恶意请求
    limit  = min(limit, 100)
    scores = Score.get_global_ranking(limit=limit)
    return jsonify({'success': True, 'scores': scores})


@score_bp.route('/submit', methods=['POST'])
def submit_score():
    """
    提交成绩接口（POST /score/submit）
    游戏结束后由前端 AJAX 调用，把本局成绩保存到数据库
    请求体（JSON）：
        score      int  本局得分（必填）
        coins      int  收集金币数（可选，默认0）
        distance   int  跑动距离/米（可选，默认0）
        difficulty str  难度：easy/normal/hard（可选，默认normal）
        play_time  int  游戏时长/秒（可选，默认0）
    返回：
        success         bool
        message         str
        is_new_record   bool  是否刷新个人最高分
        score_id        int   新成绩的数据库 ID
    """
    # ---- 解析 JSON 请求体 ----
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'success': False, 'message': '请求数据格式错误，需要 JSON'}), 400

    # ---- 登录验证 ----
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '请先登录再提交成绩！'}), 401

    # ---- 获取并校验字段 ----
    score_value = data.get('score', 0)
    coins       = data.get('coins', 0)
    distance    = data.get('distance', 0)
    difficulty  = data.get('difficulty', 'normal')
    play_time   = data.get('play_time', 0)

    # 分数必须是非负整数
    if not isinstance(score_value, (int, float)) or score_value < 0:
        return jsonify({'success': False, 'message': '分数格式错误，必须是非负数'}), 400

    # 难度必须是合法值
    valid_difficulties = ('easy', 'normal', 'hard')
    if difficulty not in valid_difficulties:
        difficulty = 'normal'

    # 转为整数，防止浮点数写入
    score_value = int(score_value)
    coins       = max(0, int(coins))
    distance    = max(0, int(distance))
    play_time   = max(0, int(play_time))

    # ---- 获取提交前的历史最高分，用于判断是否新纪录 ----
    old_best = Score.get_user_best_score(user_id)

    # ---- 创建成绩记录并保存 ----
    new_score = Score(
        user_id    = user_id,
        score      = score_value,
        coins      = coins,
        distance   = distance,
        difficulty = difficulty,
        play_time  = play_time
    )
    db.session.add(new_score)

    # 将本局金币累加到用户余额
    user = User.query.get(user_id)
    if user:
        user.coin_balance = (user.coin_balance or 0) + coins

    db.session.commit()

    # 判断是否刷新个人最高分
    is_new_record = (score_value > old_best)

    return jsonify({
        'success':        True,
        'message':        '成绩已保存！' + ('🎉 新纪录！' if is_new_record else ''),
        'is_new_record':  is_new_record,
        'score_id':       new_score.id
    })


@score_bp.route('/my-scores')
def my_scores():
    """
    个人历史成绩接口（GET /score/my-scores）
    返回当前登录用户的全部历史成绩（按分数降序）
    需要登录才能调用
    返回：
        success     bool
        scores      list  成绩列表
        statistics  dict  统计信息（total_games / best_score / total_coins）
    """
    # ---- 登录验证 ----
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '请先登录！'}), 401

    # ---- 查询历史成绩 ----
    scores_objs  = Score.get_user_scores(user_id)
    scores_data  = [s.to_dict() for s in scores_objs]

    # ---- 附加统计信息 ----
    total_games  = len(scores_data)
    best_score   = scores_data[0]['score'] if scores_data else 0
    total_coins  = sum(s['coins'] for s in scores_data)

    return jsonify({
        'success': True,
        'scores':  scores_data,
        'statistics': {
            'total_games':  total_games,
            'best_score':   best_score,
            'total_coins':  total_coins
        }
    })


@score_bp.route('/statistics')
def statistics():
    """
    全局统计信息接口（GET /score/statistics）
    返回全服总局数、总参与人数、历史最高分
    """
    stats = Score.get_statistics()
    return jsonify({'success': True, 'statistics': stats})
