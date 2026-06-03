-- ============================================================
-- forest_runner.sql —— 森林酷跑游戏系统数据库初始化脚本
-- 适用数据库：MySQL 5.7+
-- 由【成员四：MySQL 数据库与排行榜】负责维护和优化
-- ============================================================

-- 创建并选择数据库
CREATE DATABASE IF NOT EXISTS forest_runner
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE forest_runner;

-- ============================================================
-- 1. 用户表 users
-- 存储所有注册用户的基本信息
-- ============================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id`          INT          NOT NULL AUTO_INCREMENT COMMENT '用户 ID（主键）',
    `username`    VARCHAR(50)  NOT NULL UNIQUE         COMMENT '用户名（登录用，唯一）',
    `password`    VARCHAR(256) NOT NULL                COMMENT '密码哈希值（请勿存明文）',
    `nickname`    VARCHAR(50)  NOT NULL DEFAULT ''     COMMENT '昵称（排行榜展示用）',
    `avatar`      VARCHAR(200) NOT NULL DEFAULT ''     COMMENT '头像图片地址',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    PRIMARY KEY (`id`),
    INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================================
-- 2. 成绩表 scores
-- 每次游戏结束后记录一条成绩
-- ============================================================
DROP TABLE IF EXISTS `scores`;
CREATE TABLE `scores` (
    `id`          INT         NOT NULL AUTO_INCREMENT COMMENT '成绩 ID（主键）',
    `user_id`     INT         NOT NULL               COMMENT '用户 ID（外键，关联 users.id）',
    `score`       INT         NOT NULL DEFAULT 0     COMMENT '游戏得分',
    `coins`       INT         NOT NULL DEFAULT 0     COMMENT '收集金币数',
    `distance`    INT         NOT NULL DEFAULT 0     COMMENT '跑动距离（单位：米）',
    `difficulty`  VARCHAR(20) NOT NULL DEFAULT 'normal' COMMENT '游戏难度：easy/normal/hard',
    `play_time`   INT         NOT NULL DEFAULT 0     COMMENT '游戏时长（单位：秒）',
    `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '游戏时间',
    PRIMARY KEY (`id`),
    -- 外键关联：用户被删除时同步删除其成绩
    CONSTRAINT `fk_scores_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_score`   (`score` DESC),   -- 排行榜查询优化
    INDEX `idx_user_id` (`user_id`)       -- 查询个人成绩优化
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏成绩表';

-- ============================================================
-- 3. 公告表 notices
-- 管理员发布的公告（首页展示）
-- ============================================================
DROP TABLE IF EXISTS `notices`;
CREATE TABLE `notices` (
    `id`          INT          NOT NULL AUTO_INCREMENT COMMENT '公告 ID（主键）',
    `title`       VARCHAR(100) NOT NULL               COMMENT '公告标题',
    `content`     TEXT         NOT NULL               COMMENT '公告正文内容',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公告表';

-- ============================================================
-- 4. 皮肤表 skins（扩展功能，可选）
-- 玩家解锁后可以更换游戏角色外观
-- ============================================================
DROP TABLE IF EXISTS `skins`;
CREATE TABLE `skins` (
    `id`           INT          NOT NULL AUTO_INCREMENT COMMENT '皮肤 ID（主键）',
    `name`         VARCHAR(50)  NOT NULL               COMMENT '皮肤名称',
    `image_url`    VARCHAR(200) NOT NULL               COMMENT '皮肤图片地址',
    `unlock_score` INT          NOT NULL DEFAULT 0     COMMENT '解锁所需最高分',
    `create_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色皮肤表';

-- ============================================================
-- 插入测试数据
-- ============================================================

-- 测试用户（密码为 pbkdf2 哈希，对应明文 "123456"）
INSERT INTO `users` (`username`, `password`, `nickname`, `create_time`) VALUES
('admin',   'pbkdf2:sha256:600000$test$hash1', '管理员',   '2024-06-01 09:00:00'),
('player1', 'pbkdf2:sha256:600000$test$hash2', '森林小熊', '2024-06-01 10:00:00'),
('player2', 'pbkdf2:sha256:600000$test$hash3', '飞奔兔子', '2024-06-01 11:00:00'),
('player3', 'pbkdf2:sha256:600000$test$hash4', '跑酷松鼠', '2024-06-01 12:00:00'),
('player4', 'pbkdf2:sha256:600000$test$hash5', '冒险狐狸', '2024-06-01 13:00:00');

-- 测试成绩（注意：user_id 对应上方用户的 id）
INSERT INTO `scores` (`user_id`, `score`, `coins`, `distance`, `difficulty`, `play_time`, `create_time`) VALUES
(2, 9980, 88, 2500, 'normal', 120, '2024-06-01 14:00:00'),
(3, 8760, 72, 2100, 'normal', 105, '2024-06-01 14:30:00'),
(4, 7650, 65, 1900, 'normal',  92, '2024-06-01 15:00:00'),
(5, 6540, 55, 1600, 'easy',    78, '2024-06-01 15:30:00'),
(2, 5800, 50, 1500, 'normal',  70, '2024-06-01 16:00:00'),
(3, 4200, 38, 1100, 'easy',    55, '2024-06-01 16:30:00');

-- 测试公告
INSERT INTO `notices` (`title`, `content`, `create_time`) VALUES
('🌲 游戏正式上线！',        '森林酷跑游戏正式上线，快来挑战排行榜第一吧！',    '2024-06-01 09:00:00'),
('🏆 排行榜活动开始',        '本周挑战赛开始，排名前三的玩家将获得特殊称号！', '2024-06-01 10:00:00'),
('🦊 新皮肤上线：狐狸探险家', '全新皮肤"狐狸探险家"已上线，达到 5000 分即可解锁！', '2024-06-02 09:00:00');

-- 测试皮肤
INSERT INTO `skins` (`name`, `image_url`, `unlock_score`, `create_time`) VALUES
('默认小绿人',     'images/skin_default.png', 0,    '2024-06-01 09:00:00'),
('狐狸探险家',     'images/skin_fox.png',     5000, '2024-06-01 09:00:00'),
('草莓熊骑士',     'images/skin_bear.png',    10000,'2024-06-01 09:00:00'),
('彩虹兔子',       'images/skin_bunny.png',   20000,'2024-06-01 09:00:00');

-- ============================================================
-- 常用查询备忘（方便成员四直接用）
-- ============================================================

-- 查询全服排行榜 TOP 10（取每个用户的最高分）
-- SELECT u.nickname, MAX(s.score) AS best_score, MAX(s.coins) AS best_coins
-- FROM scores s JOIN users u ON s.user_id = u.id
-- GROUP BY s.user_id
-- ORDER BY best_score DESC
-- LIMIT 10;

-- 查询某用户的所有成绩
-- SELECT * FROM scores WHERE user_id = 1 ORDER BY score DESC;

-- 查询最新公告
-- SELECT * FROM notices ORDER BY create_time DESC LIMIT 5;
