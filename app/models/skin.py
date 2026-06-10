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
    """初始化预置皮肤数据（增量添加，不重复）"""
    existing_names = {s.name for s in Skin.query.all()}

    skins_data = [
        # ---------- 原有皮肤 ----------
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
        # ---------- 熊出没主题皮肤 ----------
        {
            'name': '棕熊勇士',
            'description': '力大无穷的棕色勇士，守护森林的王者',
            'skin_type': 'character',
            'primary_color': '#8B4513',
            'secondary_color': '#D2691E',
            'accent_color': '#654321',
            'sprite_path': '',
            'price': 150,
            'sort_order': 10,
            'is_default': 0,
        },
        {
            'name': '金毛憨熊',
            'description': '憨厚可爱的金黄色小伙伴',
            'skin_type': 'character',
            'primary_color': '#FFD700',
            'secondary_color': '#FFA500',
            'accent_color': '#DAA520',
            'sprite_path': '',
            'price': 150,
            'sort_order': 11,
            'is_default': 0,
        },
        {
            'name': '工匠小子',
            'description': '戴着皮帽子的森林工匠，机智又勇敢',
            'skin_type': 'character',
            'primary_color': '#4169E1',
            'secondary_color': '#8B4513',
            'accent_color': '#FF4500',
            'sprite_path': '',
            'price': 200,
            'sort_order': 12,
            'is_default': 0,
        },
        {
            'name': '菠萝猴王',
            'description': '头顶菠萝冠的丛林之王，威风凛凛',
            'skin_type': 'character',
            'primary_color': '#228B22',
            'secondary_color': '#FFD700',
            'accent_color': '#8B4513',
            'sprite_path': '',
            'price': 180,
            'sort_order': 13,
            'is_default': 0,
        },
        {
            'name': '机灵小鼠',
            'description': '活泼机灵的小家伙，森林里的开心果',
            'skin_type': 'character',
            'primary_color': '#D2B48C',
            'secondary_color': '#F5DEB3',
            'accent_color': '#CD853F',
            'sprite_path': '',
            'price': 120,
            'sort_order': 14,
            'is_default': 0,
        },
        {
            'name': '赤羽智者',
            'description': '拥有火红羽毛的夜间智者，目光如炬',
            'skin_type': 'character',
            'primary_color': '#FF6347',
            'secondary_color': '#FFA07A',
            'accent_color': '#8B0000',
            'sprite_path': '',
            'price': 160,
            'sort_order': 15,
            'is_default': 0,
        },
        {
            'name': '松果精灵',
            'description': '最爱松果的灵动小精灵，身手敏捷',
            'skin_type': 'character',
            'primary_color': '#FF8C00',
            'secondary_color': '#FFD700',
            'accent_color': '#D2691E',
            'sprite_path': '',
            'price': 140,
            'sort_order': 16,
            'is_default': 0,
        },
        {
            'name': '红衣萌娃',
            'description': '穿着红色外套的可爱萌娃，人见人爱',
            'skin_type': 'character',
            'primary_color': '#FF69B4',
            'secondary_color': '#FFB6C1',
            'accent_color': '#FF1493',
            'sprite_path': '',
            'price': 220,
            'sort_order': 17,
            'is_default': 0,
        },
        {
            'name': '正义警长',
            'description': '维护森林正义的警长，威严帅气',
            'skin_type': 'character',
            'primary_color': '#191970',
            'secondary_color': '#FFFFFF',
            'accent_color': '#FFD700',
            'sprite_path': '',
            'price': 250,
            'sort_order': 18,
            'is_default': 0,
        },
    ]

    new_skins = [data for data in skins_data if data['name'] not in existing_names]

    for data in new_skins:
        skin = Skin(**data)
        db.session.add(skin)

    if new_skins:
        db.session.commit()
        print(f'[种子] 已新增 {len(new_skins)} 款皮肤')
    else:
        print('[种子] 所有皮肤已存在，跳过')
