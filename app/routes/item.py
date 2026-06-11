"""
app/routes/item.py -- 道具系统蓝图
负责：道具商店、购买、装备/使用、库存查询
"""
from flask import Blueprint, render_template, request, jsonify, session
from app import db
from app.models.item import Item, UserItem
from app.models.user import User

item_bp = Blueprint('item', __name__)


@item_bp.route('/shop')
def shop():
    """道具商店页面（GET /item/shop）"""
    items = Item.query.filter_by(is_active=1).order_by(Item.sort_order).all()

    # 获取用户已购买的道具数量
    user_id = session.get('user_id')
    user_items = {}
    if user_id:
        records = UserItem.query.filter_by(user_id=user_id).all()
        user_items = {r.item_id: r.quantity for r in records}

    user = User.query.get(user_id) if user_id else None

    return render_template('item_shop.html',
                          items=items,
                          user_items=user_items,
                          user=user)


@item_bp.route('/api/list')
def api_list():
    """道具列表 JSON（GET /item/api/list）"""
    items = Item.query.filter_by(is_active=1).order_by(Item.sort_order).all()

    user_id = session.get('user_id')
    user_items = {}
    if user_id:
        records = UserItem.query.filter_by(user_id=user_id).all()
        user_items = {r.item_id: r.quantity for r in records}

    return jsonify({
        'success': True,
        'items': [i.to_dict() for i in items],
        'user_items': {str(k): v for k, v in user_items.items()},
    })


@item_bp.route('/api/buy', methods=['POST'])
def api_buy():
    """购买道具（POST /item/api/buy）"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '请先登录！'}), 401

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'success': False, 'message': '请求数据格式错误'}), 400

    item_id = data.get('item_id')
    if not item_id:
        return jsonify({'success': False, 'message': '请指定道具ID'}), 400

    item = Item.query.get(item_id)
    if not item or not item.is_active:
        return jsonify({'success': False, 'message': '道具不存在或已下架'}), 404

    user = User.query.get(user_id)
    if (user.coin_balance or 0) < item.price:
        return jsonify({'success': False, 'message': f'金币不足！需要 {item.price} 💰'}), 400

    # 扣金币 + 增加道具备货
    user.coin_balance -= item.price
    user_item = UserItem.query.filter_by(user_id=user_id, item_id=item_id).first()
    if user_item:
        user_item.quantity += 1
    else:
        db.session.add(UserItem(user_id=user_id, item_id=item_id, quantity=1))

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'成功购买 {item.name}！',
        'coin_balance': user.coin_balance,
        'quantity': (user_item or UserItem.query.filter_by(user_id=user_id, item_id=item_id).first()).quantity,
    })


@item_bp.route('/api/use', methods=['POST'])
def api_use():
    """使用道具（POST /item/api/use），返回效果数据供前端激活"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '请先登录！'}), 401

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'success': False, 'message': '请求数据格式错误'}), 400

    item_id = data.get('item_id')
    if not item_id:
        return jsonify({'success': False, 'message': '请指定道具ID'}), 400

    user_item = UserItem.query.filter_by(user_id=user_id, item_id=item_id).first()
    if not user_item or user_item.quantity <= 0:
        return jsonify({'success': False, 'message': '没有该道具！'}), 400

    item = Item.query.get(item_id)

    # 扣减道具数量
    user_item.quantity -= 1
    db.session.commit()

    return jsonify({
        'success':      True,
        'message':      f'使用了 {item.name}！',
        'effect_type':  item.effect_type,
        'effect_value': item.effect_value,
        'duration':     item.duration,
        'remaining':    user_item.quantity,
    })


@item_bp.route('/api/my-items')
def api_my_items():
    """我的道具库存（GET /item/api/my-items）"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '请先登录！'}), 401

    records = UserItem.query.filter_by(user_id=user_id).all()
    result = []
    for r in records:
        if r.quantity > 0:
            item = Item.query.get(r.item_id)
            result.append({
                'item_id':     r.item_id,
                'name':        item.name if item else '未知道具',
                'effect_type': item.effect_type if item else '',
                'duration':    item.duration if item else 0,
                'quantity':    r.quantity,
            })

    return jsonify({'success': True, 'items': result})
