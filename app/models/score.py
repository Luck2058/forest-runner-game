"""
app/models/score.py —— 成绩数据模型
对应数据库 scores 表
由【成员四：MySQL 数据库与排行榜】负责完善查询和统计方法
"""

from datetime import datetime
from app import db


class Score(db.Model):
    """游戏成绩模型"""

    __tablename__ = 'scores'  # 指定数据库表名

    # 主键
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='成绩 ID')

    # 外键：关联 users 表
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, comment='用户 ID')

    # 本局得分
    score = db.Column(db.Integer, default=0, comment='游戏分数')

    # 收集金币数
    coins = db.Column(db.Integer, default=0, comment='收集金币数')

    # 跑动距离（单位：米）
    distance = db.Column(db.Integer, default=0, comment='跑动距离(米)')

    # 难度等级：easy / normal / hard
    difficulty = db.Column(db.String(20), default='normal', comment='游戏难度')

    # 游戏时长（单位：秒）
    play_time = db.Column(db.Integer, default=0, comment='游戏时长(秒)')

    # 记录时间
    create_time = db.Column(db.DateTime, default=datetime.utcnow, comment='游戏时间')

    def __repr__(self):
        return f'<Score user_id={self.user_id} score={self.score}>'
