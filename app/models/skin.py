"""
app/models/skin.py -- 皮肤数据模型
对应数据库 skins 表（预置皮肤）+ user_skins 关联表（用户持有皮肤）
"""

from datetime import datetime
from app import db


# 皮肤与用户的多对多关联表
user_skins = db.Table(
    'user_skins',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True, comment='用户 ID'),
    db.Column('skin_id', db.Integer, db.ForeignKey('skins.id'), primary_key=True, comment='皮肤 ID'),
    db.Column('acquired_at', db.DateTime, default=datetime.utcnow, comment='获得时间'),
)


class Skin(db.Model):
    """皮肤模型"""

    __tablename__ = 'skins'

    # 主键
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='皮肤 ID')

    # 皮肤名称
    name = db.Column(db.String(50), nullable=False, comment='皮肤名称')

    # 皮肤描述
    description = db.Column(db.String(200), default='', comment='皮肤描述')

    # 皮肤类型：character / trail / effect
    skin_type = db.Column(db.String(20), default='character', comment='皮肤类型')

    # 皮肤颜色主题（用于 Canvas 降级绘制）
    primary_color = db.Column(db.String(20), default='#D85A30', comment='主色调')
    secondary_color = db.Column(db.String(20), default='#FAECE7', comment='次色调')
    accent_color = db.Column(db.String(20), default='#2d6a4f', comment='点缀色')

    # SVG 素材路径（为空则用 Canvas 绘制）
    sprite_path = db.Column(db.String(200), default='', comment='SVG素材路径')

    # 价格（金币），0=免费
    price = db.Column(db.Integer, default=0, comment='价格(金币)')

    # 排序权重
    sort_order = db.Column(db.Integer, default=0, comment='排序权重')

    # 是否为默认皮肤
    is_default = db.Column(db.SmallInteger, default=0, comment='是否默认皮肤')

    # 创建时间
    create_time = db.Column(db.DateTime, default=datetime.utcnow, comment='创建时间')

    # 持有该皮肤的用户（多对多）
    owners = db.relationship('User', secondary=user_skins, backref='owned_skins')

    def to_dict(self):
        """序列化为字典"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'skin_type': self.skin_type,
            'primary_color': self.primary_color,
            'secondary_color': self.secondary_color,
            'accent_color': self.accent_color,
            'sprite_path': self.sprite_path,
            'price': self.price,
            'is_default': bool(self.is_default),
        }

    def __repr__(self):
        return f'<Skin {self.name}>'


def seed_skins():
    """初始化预置皮肤数据（仅执行一次）"""
    if Skin.query.count() > 0:
        return

    skins_data = [
        {
            'name': '森林小狐狸',
            'description': '默认角色，经典的橙色小狐狸',
            'skin_type': 'character',
            'primary_color': '#D85A30',
            'secondary_color': '#FAECE7',
            'accent_color': '#2d6a4f',
            'sprite_path': '/static/images/player.svg',
            'price': 0,
            'sort_order': 0,
            'is_default': 1,
        },
        {
            'name': '冰雪小狐',
            'description': '来自北方雪原的白色小狐狸',
            'skin_type': 'character',
            'primary_color': '#B0D4F1',
            'secondary_color': '#E8F4FD',
            'accent_color': '#5B9BD5',
            'sprite_path': '',
            'price': 100,
            'sort_order': 1,
            'is_default': 0,
        },
        {
            'name': '暗夜蝙蝠',
            'description': '黑夜中的神秘飞行者',
            'skin_type': 'character',
            'primary_color': '#4A1A6B',
            'secondary_color': '#8B5CF6',
            'accent_color': '#C4B5FD',
            'sprite_path': '',
            'price': 200,
            'sort_order': 2,
            'is_default': 0,
        },
        {
            'name': '火焰精灵',
            'description': '燃烧吧！热血火焰精灵',
            'skin_type': 'character',
            'primary_color': '#EF4444',
            'secondary_color': '#FCD34D',
            'accent_color': '#F97316',
            'sprite_path': '',
            'price': 300,
            'sort_order': 3,
            'is_default': 0,
        },
        {
            'name': '森林守护者',
            'description': '守护森林的绿色勇士',
            'skin_type': 'character',
            'primary_color': '#059669',
            'secondary_color': '#A7F3D0',
            'accent_color': '#065F46',
            'sprite_path': '',
            'price': 500,
            'sort_order': 4,
            'is_default': 0,
        },
        {
            'name': '黄金猎手',
            'description': '闪亮登场的金色传说！',
            'skin_type': 'character',
            'primary_color': '#F59E0B',
            'secondary_color': '#FEF3C7',
            'accent_color': '#D97706',
            'sprite_path': '',
            'price': 1000,
            'sort_order': 5,
            'is_default': 0,
        },
    ]

    for data in skins_data:
        skin = Skin(**data)
        db.session.add(skin)

    db.session.commit()
    print(f'[种子] 已初始化 {len(skins_data)} 款皮肤')
