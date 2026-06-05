"""
app/models/score.py -- 成绩数据模型
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

    # ------------------------------------------------------------------
    # 类方法：排行榜相关查询
    # ------------------------------------------------------------------

    @classmethod
    def get_global_ranking(cls, limit=10):
        """
        获取全服排行榜（取每个用户的最高分）
        :param limit: 返回前 N 名，默认 10
        :return: 列表，每个元素为 dict，包含 rank, user_id, nickname, best_score, best_coins
        """
        from sqlalchemy import func
        from app.models.user import User

        results = db.session.query(
            cls.user_id,
            User.nickname,
            func.max(cls.score).label('best_score'),
            func.max(cls.coins).label('best_coins')
        ).join(User, cls.user_id == User.id) \
         .group_by(cls.user_id) \
         .order_by(func.max(cls.score).desc()) \
         .limit(limit).all()

        ranking = []
        for rank, row in enumerate(results, start=1):
            ranking.append({
                'rank': rank,
                'user_id': row.user_id,
                'nickname': row.nickname or '匿名玩家',
                'best_score': row.best_score,
                'best_coins': row.best_coins
            })
        return ranking

    @classmethod
    def get_user_scores(cls, user_id, limit=None):
        """
        获取某用户的所有历史成绩
        :param user_id: 用户 ID
        :param limit: 限制返回条数，None 表示不限制
        :return: Score 对象列表
        """
        query = cls.query.filter_by(user_id=user_id).order_by(cls.score.desc())
        if limit:
            query = query.limit(limit)
        return query.all()

    @classmethod
    def get_user_best_score(cls, user_id):
        """获取某用户的最高分"""
        best = cls.query.filter_by(user_id=user_id).order_by(cls.score.desc()).first()
        return best.score if best else 0

    @classmethod
    def get_today_top_scores(cls, limit=10):
        """
        获取今日排行榜
        :param limit: 返回前 N 名
        """
        from sqlalchemy import func
        from app.models.user import User
        from datetime import date

        today_start = datetime.combine(date.today(), datetime.min.time())

        results = db.session.query(
            cls.user_id,
            User.nickname,
            func.max(cls.score).label('best_score')
        ).join(User, cls.user_id == User.id) \
         .filter(cls.create_time >= today_start) \
         .group_by(cls.user_id) \
         .order_by(func.max(cls.score).desc()) \
         .limit(limit).all()

        ranking = []
        for rank, row in enumerate(results, start=1):
            ranking.append({
                'rank': rank,
                'user_id': row.user_id,
                'nickname': row.nickname or '匿名玩家',
                'best_score': row.best_score
            })
        return ranking

    @classmethod
    def get_statistics(cls):
        """获取全局统计信息"""
        from sqlalchemy import func

        total_games = cls.query.count()
        total_users = db.session.query(func.count(func.distinct(cls.user_id))).scalar()
        top_score = db.session.query(func.max(cls.score)).scalar() or 0

        return {
            'total_games': total_games,
            'total_users': total_users,
            'top_score': top_score
        }

    # ------------------------------------------------------------------
    # 实例方法
    # ------------------------------------------------------------------

    def to_dict(self):
        """将成绩记录转为字典（API 返回用）"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'score': self.score,
            'coins': self.coins,
            'distance': self.distance,
            'difficulty': self.difficulty,
            'play_time': self.play_time,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None
        }

    def __repr__(self):
        return f'<Score user_id={self.user_id} score={self.score}>'
