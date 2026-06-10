"""
app/models/notice.py -- 公告数据模型
对应数据库 notices 表
"""

from datetime import datetime
from app import db


class Notice(db.Model):
    """公告模型"""

    __tablename__ = 'notices'

    # 主键
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='公告 ID')

    # 公告标题
    title = db.Column(db.String(200), nullable=False, comment='公告标题')

    # 公告内容
    content = db.Column(db.Text, default='', comment='公告内容')

    # 是否发布：0=草稿，1=已发布
    is_published = db.Column(db.SmallInteger, default=1, comment='是否发布')

    # 发布人 ID
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, comment='发布人 ID')

    # 创建时间
    create_time = db.Column(db.DateTime, default=datetime.utcnow, comment='创建时间')

    # 关联发布人
    author = db.relationship('User', backref='notices')

    def to_dict(self):
        """序列化为字典"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'is_published': bool(self.is_published),
            'author': self.author.nickname or self.author.username if self.author else '-',
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M') if self.create_time else None,
        }

    def __repr__(self):
        return f'<Notice {self.title}>'
