"""
app/models/user.py -- 用户数据模型
对应数据库 users 表
由【成员四：MySQL 数据库与排行榜】负责完善字段验证和查询方法
"""

from datetime import datetime
from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash


class User(UserMixin, db.Model):
    """用户模型"""

    __tablename__ = 'users'  # 指定数据库表名

    # 主键
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='用户 ID')

    # 用户名：唯一、不能为空，最长 50 字符
    username = db.Column(db.String(50), unique=True, nullable=False, comment='用户名')

    # 密码哈希值：存储加密后的密码，不存明文
    password_hash = db.Column(db.String(256), nullable=False, comment='密码哈希')

    # 昵称：显示用，可与用户名不同
    nickname = db.Column(db.String(50), default='', comment='昵称')

    # 头像 URL：存图片路径或网络地址
    avatar = db.Column(db.String(200), default='', comment='头像地址')

    # 是否管理员：0=普通用户，1=管理员
    is_admin = db.Column(db.SmallInteger, default=0, comment='是否管理员')

    # 当前装备的皮肤 ID（默认1=森林小狐狸）
    skin_id = db.Column(db.Integer, default=1, comment='当前装备皮肤ID')

    # 累计金币余额（用于购买皮肤）
    coin_balance = db.Column(db.Integer, default=0, comment='金币余额')

    # 创建时间：自动记录注册时间
    create_time = db.Column(db.DateTime, default=datetime.utcnow, comment='注册时间')

    # 关联成绩（一个用户对应多条成绩）
    scores = db.relationship('Score', backref='user', lazy='dynamic')

    def set_password(self, password):
        """设置密码（自动加密）"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """验证密码是否正确"""
        return check_password_hash(self.password_hash, password)

    def get_best_score(self):
        """获取该用户的最高分"""
        from app.models.score import Score
        best = Score.query.filter_by(user_id=self.id).order_by(Score.score.desc()).first()
        return best.score if best else 0

    def get_total_games(self):
        """获取该用户的总游戏次数"""
        return self.scores.count()

    def get_total_coins(self):
        """获取该用户累计收集的金币数"""
        from sqlalchemy import func
        from app.models.score import Score
        total = db.session.query(func.sum(Score.coins)).filter_by(user_id=self.id).scalar()
        return total or 0

    def get_rank(self):
        """获取该用户在全服排行榜中的排名"""
        from sqlalchemy import func
        from app.models.score import Score
        subquery = db.session.query(
            Score.user_id,
            func.max(Score.score).label('best_score')
        ).group_by(Score.user_id).subquery()

        rank = db.session.query(subquery).filter(
            subquery.c.best_score > self.get_best_score()
        ).count()
        return rank + 1

    def to_dict(self):
        """将用户信息转为字典（API 返回用）"""
        return {
            'id': self.id,
            'username': self.username,
            'nickname': self.nickname,
            'avatar': self.avatar,
            'is_admin': bool(self.is_admin),
            'skin_id': self.skin_id,
            'coin_balance': self.coin_balance,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None
        }

    def __repr__(self):
        return f'<User {self.username}>'
