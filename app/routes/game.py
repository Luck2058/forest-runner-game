"""
app/routes/game.py —— 游戏页面蓝图
负责：游戏页面渲染、登录保护、皮肤商店
C 岗（肖盼）完成：登录后才能进入游戏，未登录跳转到登录页
新增：皮肤商店（查看/购买/装备皮肤）
"""

from flask import Blueprint, render_template, session, redirect, url_for, flash, request, jsonify
from functools import wraps
from app import db
from app.models.user import User
from app.models.skin import Skin, SkinTrial, TRIAL_ROUNDS

# 创建游戏蓝图，url 前缀为 /game
game_bp = Blueprint('game', __name__)


def login_required(f):
    """
    登录保护装饰器
    用于需要登录才能访问的路由
    未登录时重定向到登录页，并携带 next 参数，登录后自动跳回
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('user_id'):
            flash('请先登录再进入游戏！', 'warning')
            return redirect(url_for('auth.login', next=f'/game/'))
        return f(*args, **kwargs)
    return decorated


@game_bp.route('/')
@login_required
def game():
    """
    游戏主页面
    需要登录才能访问，将用户信息传给模板
    """
    user_id  = session.get('user_id')
    username = session.get('username', '游客')
    nickname = session.get('nickname') or username
    return render_template('game.html', username=username, nickname=nickname, user_id=user_id)


@game_bp.route('/profile')
@login_required
def profile():
    """
    个人中心页面
    需要登录才能访问，展示个人信息和历史成绩
    """
    from app.models.user import User
    from app.models.score import Score

    user_id = session.get('user_id')
    user = User.query.get(user_id)

    # 获取个人历史成绩（最多展示 20 条）
    scores = Score.query.filter_by(user_id=user_id).order_by(Score.score.desc()).limit(20).all()

    # 统计信息
    total_games = len(scores)
    best_score  = scores[0].score if scores else 0
    total_coins = sum(s.coins for s in scores)

    return render_template(
        'profile.html',
        user=user,
        scores=scores,
        total_games=total_games,
        best_score=best_score,
        total_coins=total_coins
    )


@game_bp.route('/skins')
@login_required
def skin_shop():
    """
    皮肤商店页面
    显示所有皮肤，标注已拥有/已装备状态
    """
    user_id = session.get('user_id')
    user = User.query.get(user_id)

    # 所有皮肤
    all_skins = Skin.query.order_by(Skin.sort_order).all()

    # 用户已拥有的皮肤 ID 集合
    owned_ids = {s.id for s in user.owned_skins}

    # 确保默认皮肤自动拥有
    default_skin = Skin.query.filter_by(is_default=1).first()
    if default_skin and default_skin.id not in owned_ids:
        user.owned_skins.append(default_skin)
        db.session.commit()
        owned_ids.add(default_skin.id)

    # 获取试玩信息：{skin_id: {remaining, is_trialing}}
    trial_records = SkinTrial.query.filter_by(user_id=user_id).all()
    trial_info = {}
    for t in trial_records:
        trial_info[t.skin_id] = {'remaining': t.remaining, 'is_trialing': bool(t.is_trialing)}

    return render_template(
        'skin_shop.html',
        skins=all_skins,
        skins_json=[s.to_dict() for s in all_skins],
        owned_ids=owned_ids,
        current_skin_id=user.skin_id,
        coin_balance=user.coin_balance,
        trial_info=trial_info,
    )


@game_bp.route('/api/skin/equip', methods=['POST'])
@login_required
def equip_skin():
    """装备皮肤 API"""
    user_id = session.get('user_id')
    user = User.query.get(user_id)

    data = request.get_json(silent=True) or {}
    skin_id = data.get('skin_id')

    if not skin_id:
        return jsonify({'success': False, 'message': '参数错误'}), 400

    skin = Skin.query.get(skin_id)
    if not skin:
        return jsonify({'success': False, 'message': '皮肤不存在'}), 404

    # 检查是否已拥有
    owned_ids = {s.id for s in user.owned_skins}
    if skin_id not in owned_ids:
        return jsonify({'success': False, 'message': '你还没有这款皮肤'}), 403

    # 装备
    user.skin_id = skin_id
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'已装备「{skin.name}」',
        'skin_id': skin_id,
    })


@game_bp.route('/api/skin/trial-equip', methods=['POST'])
@login_required
def trial_equip_skin():
    """试玩装备皮肤 API（未购买的皮肤可试玩5局）"""
    user_id = session.get('user_id')
    user = User.query.get(user_id)

    data = request.get_json(silent=True) or {}
    skin_id = data.get('skin_id')

    if not skin_id:
        return jsonify({'success': False, 'message': '参数错误'}), 400

    skin = Skin.query.get(skin_id)
    if not skin:
        return jsonify({'success': False, 'message': '皮肤不存在'}), 404

    # 已拥有的皮肤走正常装备流程
    owned_ids = {s.id for s in user.owned_skins}
    if skin_id in owned_ids:
        user.skin_id = skin_id
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'已装备「{skin.name}」',
            'skin_id': skin_id,
        })

    # 免费皮肤不能试玩，直接领取
    if skin.price == 0:
        user.owned_skins.append(skin)
        user.skin_id = skin_id
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'已免费领取并装备「{skin.name}」',
            'skin_id': skin_id,
        })

    # 查找或创建试玩记录
    trial = SkinTrial.query.filter_by(user_id=user_id, skin_id=skin_id).first()
    if not trial:
        trial = SkinTrial(user_id=user_id, skin_id=skin_id, remaining=TRIAL_ROUNDS, is_trialing=1)
        db.session.add(trial)
    elif trial.remaining <= 0:
        return jsonify({'success': False, 'message': f'「{skin.name}」试玩次数已用完，请购买解锁'}), 403
    else:
        trial.is_trialing = 1

    # 装备试玩皮肤
    user.skin_id = skin_id
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'试玩装备「{skin.name}」，剩余 {trial.remaining} 局',
        'skin_id': skin_id,
        'trial_remaining': trial.remaining,
    })


@game_bp.route('/api/skin/buy', methods=['POST'])
@login_required
def buy_skin():
    """购买皮肤 API"""
    user_id = session.get('user_id')
    user = User.query.get(user_id)

    data = request.get_json(silent=True) or {}
    skin_id = data.get('skin_id')

    if not skin_id:
        return jsonify({'success': False, 'message': '参数错误'}), 400

    skin = Skin.query.get(skin_id)
    if not skin:
        return jsonify({'success': False, 'message': '皮肤不存在'}), 404

    # 检查是否已拥有
    owned_ids = {s.id for s in user.owned_skins}
    if skin_id in owned_ids:
        return jsonify({'success': False, 'message': '你已经拥有这款皮肤了'}), 400

    # 检查金币是否足够
    if user.coin_balance < skin.price:
        return jsonify({
            'success': False,
            'message': f'金币不足！需要 {skin.price}，当前 {user.coin_balance}',
        }), 400

    # 扣除金币 + 添加皮肤
    user.coin_balance -= skin.price
    user.owned_skins.append(skin)

    # 清除该皮肤的试玩记录（已购买不再需要）
    trial = SkinTrial.query.filter_by(user_id=user_id, skin_id=skin_id).first()
    if trial:
        db.session.delete(trial)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'成功购买「{skin.name}」！花费 {skin.price} 金币',
        'coin_balance': user.coin_balance,
    })


@game_bp.route('/api/user/skin')
@login_required
def get_user_skin():
    """获取当前用户装备的皮肤信息（游戏页面用）"""
    user_id = session.get('user_id')
    user = User.query.get(user_id)

    skin = Skin.query.get(user.skin_id)
    if not skin:
        skin = Skin.query.filter_by(is_default=1).first()

    # 检查是否为试玩状态
    is_trial = False
    trial_remaining = 0
    owned_ids = {s.id for s in user.owned_skins}
    if skin and skin.id not in owned_ids and skin.price > 0:
        trial = SkinTrial.query.filter_by(user_id=user_id, skin_id=skin.id).first()
        if trial:
            is_trial = True
            trial_remaining = trial.remaining

    return jsonify({
        'success': True,
        'skin': skin.to_dict() if skin else None,
        'is_trial': is_trial,
        'trial_remaining': trial_remaining,
    })
