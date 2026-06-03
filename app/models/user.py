"""
app/models/user.py —— 用户数据模型
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

    def __repr__(self):
        return f'<User {self.username}>'
