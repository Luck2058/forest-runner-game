"""
app/models/score.py -- 成绩数据模型
对应数据库 scores 表
C 岗（肖盼）补全：get_global_ranking / get_user_scores /
                   get_user_best_score / get_statistics / to_dict
"""

from datetime import datetime, date
from app import db
from sqlalchemy import func


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

    # ------------------------------------------------------------------ #
    #  类方法：查询与统计
    # ------------------------------------------------------------------ #

    @classmethod
    def get_global_ranking(cls, limit=10):
        """
        获取全服排行榜（每个用户只取最高分）
        返回按最高分降序排列的字典列表，包含排名、昵称、最高分等
        """
        # 避免循环导入，在方法内部导入 User
        from app.models.user import User

        # 子查询：每个用户的最高分/最高金币/最大距离
        subq = (
            db.session.query(
                cls.user_id,
                func.max(cls.score).label('best_score'),
                func.max(cls.coins).label('best_coins'),
                func.max(cls.distance).label('best_distance')
            )
            .group_by(cls.user_id)
            .subquery()
        )

        # 关联用户表，取昵称
        rows = (
            db.session.query(
                subq.c.user_id,
                subq.c.best_score,
                subq.c.best_coins,
                subq.c.best_distance,
                User.nickname,
                User.username
            )
            .join(User, User.id == subq.c.user_id)
            .order_by(subq.c.best_score.desc())
            .limit(limit)
            .all()
        )

        result = []
        for i, row in enumerate(rows, start=1):
            result.append({
                'rank':          i,
                'user_id':       row.user_id,
                'nickname':      row.nickname or row.username,
                'best_score':    row.best_score,
                'best_coins':    row.best_coins,
                'distance':      row.best_distance,
            })
        return result

    @classmethod
    def get_user_scores(cls, user_id, limit=None):
        """
        获取某用户的历史成绩，按分数降序排列
        limit=None 时返回全部记录
        返回 Score 对象列表
        """
        query = (
            cls.query
            .filter_by(user_id=user_id)
            .order_by(cls.score.desc())
        )
        if limit:
            query = query.limit(limit)
        return query.all()

    @classmethod
    def get_user_best_score(cls, user_id):
        """
        获取某用户的历史最高分
        无记录时返回 0
        """
        result = (
            db.session.query(func.max(cls.score))
            .filter(cls.user_id == user_id)
            .scalar()
        )
        return result or 0

    @classmethod
    def get_statistics(cls):
        """
        获取全局统计信息
        返回字典：total_games / total_users / top_score / today_games
        """
        total_games = db.session.query(func.count(cls.id)).scalar() or 0
        total_users = db.session.query(func.count(func.distinct(cls.user_id))).scalar() or 0
        top_score   = db.session.query(func.max(cls.score)).scalar() or 0

        # 今日游戏次数
        today = date.today()
        today_games = db.session.query(func.count(cls.id)).filter(
            func.date(cls.create_time) == today
        ).scalar() or 0

        return {
            'total_games':  total_games,
            'total_users':  total_users,
            'top_score':    top_score,
            'today_games':  today_games,
        }

    # ------------------------------------------------------------------ #
    #  实例方法
    # ------------------------------------------------------------------ #

    def to_dict(self):
        """将成绩记录序列化为字典，供 API 返回 JSON 使用"""
        return {
            'id':          self.id,
            'user_id':     self.user_id,
            'score':       self.score,
            'coins':       self.coins,
            'distance':    self.distance,
            'difficulty':  self.difficulty,
            'play_time':   self.play_time,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None,
        }

    def __repr__(self):
        return f'<Score user_id={self.user_id} score={self.score}>'
