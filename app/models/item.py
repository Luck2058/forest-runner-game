"""
app/models/item.py -- 道具系统数据模型
包含 Item（道具模板）和 UserItem（用户持有道具）
"""
from datetime import datetime
from app import db


class Item(db.Model):
    """道具模板表"""
    __tablename__ = 'items'

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='道具ID')
    name        = db.Column(db.String(50), nullable=False, comment='道具名称')
    description = db.Column(db.String(200), default='', comment='道具描述')
    effect_type = db.Column(db.String(30), nullable=False, comment='效果类型: magnet/shield/double_coin/shrink/slowdown')
    effect_value = db.Column(db.Integer, default=1, comment='效果数值（倍数等）')
    duration    = db.Column(db.Integer, default=300, comment='持续时间（帧），0表示瞬时')
    price       = db.Column(db.Integer, default=100, comment='购买价格（金币）')
    sprite_path = db.Column(db.String(200), default='', comment='SVG素材路径')
    sort_order  = db.Column(db.Integer, default=0, comment='商店排序')
    is_active   = db.Column(db.SmallInteger, default=1, comment='是否上架')
    create_time = db.Column(db.DateTime, default=datetime.utcnow, comment='创建时间')

    def to_dict(self):
        return {
            'id':          self.id,
            'name':        self.name,
            'description': self.description,
            'effect_type': self.effect_type,
            'effect_value': self.effect_value,
            'duration':    self.duration,
            'price':       self.price,
            'sprite_path': self.sprite_path,
        }


class UserItem(db.Model):
    """用户持有道具记录表"""
    __tablename__ = 'user_items'

    id       = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id  = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, comment='用户ID')
    item_id  = db.Column(db.Integer, db.ForeignKey('items.id'), nullable=False, comment='道具ID')
    quantity = db.Column(db.Integer, default=0, comment='持有数量')

    __table_args__ = (db.UniqueConstraint('user_id', 'item_id', name='uq_user_item'),)

    # 关联
    item = db.relationship('Item', backref='user_items', lazy=True)


# ----------------------------------------------------------------
# 种子数据：预置5种道具
# ----------------------------------------------------------------
SEED_ITEMS = [
    {
        'name': '🧲 磁铁',
        'description': '自动吸附周围金币，持续5秒',
        'effect_type': 'magnet',
        'effect_value': 1,
        'duration': 300,
        'price': 80,
        'sprite_path': '/static/images/powerup_magnet.svg',
        'sort_order': 1,
    },
    {
        'name': '⭐ 无敌星',
        'description': '免疫一次障碍物碰撞',
        'effect_type': 'shield',
        'effect_value': 1,
        'duration': 0,          # 瞬时，免疫一次
        'price': 120,
        'sprite_path': '',
        'sort_order': 2,
    },
    {
        'name': '💰 二倍金币',
        'description': '收集金币得双倍分数，持续5秒',
        'effect_type': 'double_coin',
        'effect_value': 2,
        'duration': 300,
        'price': 100,
        'sprite_path': '',
        'sort_order': 3,
    },
    {
        'name': '🔽 缩小药水',
        'description': '角色缩小50%，更易躲避，持续7秒',
        'effect_type': 'shrink',
        'effect_value': 50,     # 缩小50%
        'duration': 420,
        'price': 150,
        'sprite_path': '',
        'sort_order': 4,
    },
    {
        'name': '⏱ 慢速时钟',
        'description': '所有障碍物减速50%，持续3秒',
        'effect_type': 'slowdown',
        'effect_value': 50,     # 减速50%
        'duration': 180,
        'price': 200,
        'sprite_path': '',
        'sort_order': 5,
    },
]


def seed_items():
    """初始化预置道具数据（增量模式，按名称检查）"""
    for data in SEED_ITEMS:
        existing = Item.query.filter_by(name=data['name']).first()
        if not existing:
            item = Item(**data)
            db.session.add(item)
    db.session.commit()
