# 🌲 森林酷跑游戏系统

> 一个基于 Flask + MySQL + HTML5 Canvas 的 2D Web 跑酷小游戏  
> 期末综合训练项目 · 6 人小组协作开发

---

## 📖 项目简介

《森林酷跑》是一款类似"地铁跑酷 / 熊大快跑"的 2D 横版跑酷游戏。  
玩家登录后进入游戏，通过跳跃躲避障碍、收集金币获得分数，游戏结束后保存成绩并展示排行榜。

---

## 🛠️ 技术栈

| 模块 | 技术 |
|------|------|
| 后端框架 | Python Flask 3.x |
| 数据库 | MySQL 5.7+ |
| ORM | Flask-SQLAlchemy |
| 前端 | HTML5 + CSS3 + JavaScript |
| 游戏引擎 | HTML5 Canvas 原生 API |
| 登录管理 | Flask-Login |

---

## 🎮 功能模块

- **用户系统**：注册、登录、登出、个人中心
- **游戏系统**：Canvas 跑酷游戏，支持跳跃、二段跳、碰撞检测
- **成绩系统**：自动保存成绩，支持历史记录查看
- **排行榜**：全服 TOP 10 排名展示，含领奖台动效
- **管理后台**：用户管理、公告发布、数据统计
- **趣味扩展**（待开发）：皮肤系统、道具系统

---

## 📁 项目目录结构

```
forest-runner-game/
├── README.md             # 本文件
├── requirements.txt      # Python 依赖
├── run.py                # 启动入口
├── config.py             # 配置文件（含 MySQL 配置）
│
├── app/
│   ├── __init__.py       # Flask 工厂函数
│   ├── routes/           # 路由（蓝图）
│   │   ├── __init__.py   # 主页路由
│   │   ├── auth.py       # 登录/注册/登出
│   │   ├── game.py       # 游戏页/个人中心
│   │   ├── score.py      # 成绩提交/排行榜
│   │   └── admin.py      # 后台管理
│   ├── models/           # 数据模型
│   │   ├── user.py       # 用户表模型
│   │   └── score.py      # 成绩表模型
│   ├── templates/        # Jinja2 HTML 模板
│   │   ├── base.html     # 公共布局
│   │   ├── login.html    # 登录页
│   │   ├── register.html # 注册页
│   │   ├── index.html    # 首页
│   │   ├── game.html     # 游戏页
│   │   ├── rank.html     # 排行榜
│   │   ├── profile.html  # 个人中心
│   │   └── admin.html    # 后台管理
│   └── static/
│       ├── css/style.css # 全局样式
│       ├── js/
│       │   ├── game.js   # 游戏核心逻辑 ⭐
│       │   ├── main.js   # 全局公共 JS
│       │   └── rank.js   # 排行榜 JS
│       ├── images/       # 图片素材（待替换）
│       └── audio/        # 音效素材（待添加）
│
├── database/
│   └── forest_runner.sql # 建表语句 + 测试数据
│
├── docs/                 # 项目文档
├── tests/                # 单元测试
└── .env.example          # 环境变量示例
```

---

## 👥 小组分工说明

| 角色 | 负责内容 |
|------|---------|
| **组长** | 项目统筹、仓库管理、文档汇总、功能模块图、最终演示 |
| **成员一** | 游戏核心逻辑（game.js 完善：下滑、道具、音效、难度等级）|
| **成员二** | 美术设计与趣味交互（图片素材替换、CSS 动效、音效）|
| **成员三** | Flask 后端接口（真实数据库对接、表单验证、API 完善）|
| **成员四** | MySQL 数据库与排行榜（数据表优化、排行榜接口、个人成绩统计）|
| **成员五** | 测试、截图与展示材料（单元测试、运行截图、演示视频）|

---

## 🚀 运行步骤

### 1. 克隆/下载项目

```bash
git clone <仓库地址>
cd forest-runner-game
```

### 2. 安装 Python 依赖

```bash
# 建议先创建虚拟环境
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

### 3. 配置环境（可选，开发阶段使用 SQLite 无需配置）

复制 `.env.example` 为 `.env`，填写数据库信息：

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密码
DB_NAME=forest_runner
```

### 4. 启动项目

```bash
python run.py
```

访问：[http://127.0.0.1:5000](http://127.0.0.1:5000)

> 💡 **开发阶段**：`config.py` 默认使用 SQLite，无需安装 MySQL 也能运行！

---

## 🗄️ 数据库导入方法（MySQL）

```bash
# 1. 登录 MySQL
mysql -u root -p

# 2. 执行 SQL 文件（会自动创建数据库）
source database/forest_runner.sql

# 或者：
mysql -u root -p < database/forest_runner.sql
```

然后修改 `config.py` 中的 `ProductionConfig` 或设置环境变量，将 `DevelopmentConfig` 改为使用 MySQL URI。

---

## 📌 后续开发计划

- [ ] 成员一：实现下滑动作（↓键）
- [ ] 成员一：添加飞行障碍物（低头才能过）
- [ ] 成员一：实现道具系统（无敌星、加速靴）
- [ ] 成员二：替换矩形为真实图片素材
- [ ] 成员二：添加背景音乐和音效
- [ ] 成员二：添加粒子特效（收集金币时）
- [ ] 成员三：完善真实登录验证（密码哈希）
- [ ] 成员三：完善注册表单验证
- [ ] 成员四：完善排行榜真实查询
- [ ] 成员四：实现成绩自动保存接口
- [ ] 成员五：编写单元测试
- [ ] 全员：代码 Review 与合并

---

---

## 🌿 Git 分支协作规范

> 小组成员**不要直接修改 `main` 分支**，统一在 `dev` 分支上协作，各自功能从 `dev` 切出。

| 分支名 | 用途 |
|--------|------|
| `main` | 最终稳定版本，只在阶段性完成后合并 |
| `dev` | 日常开发整合版本，各功能分支向此合并 |
| `feature/game-core` | 成员一：游戏核心逻辑（跳跃/道具/难度）|
| `feature/ui-design` | 成员二：页面美术与交互（素材/动效/音效）|
| `feature/backend-auth` | 成员三：Flask 登录注册与后端接口 |
| `feature/database-score` | 成员四：数据库、成绩保存与排行榜 |
| `feature/test-docs` | 成员五：测试、截图与文档整理 |

### 标准工作流程

```bash
# 1. 克隆仓库
git clone https://github.com/Luck2058/forest-runner-game.git
cd forest-runner-game

# 2. 切换到 dev 分支
git checkout dev

# 3. 从 dev 创建自己的功能分支（以成员一为例）
git checkout -b feature/game-core

# 4. 开发完成后提交
git add .
git commit -m "feat: 实现下滑动作和飞行障碍物"

# 5. 推送到远程
git push -u origin feature/game-core

# 6. 在 GitHub 上发起 Pull Request，将功能分支合并到 dev
```

> ⚠️ **注意事项**
> - 不要直接 `push` 到 `main`
> - 合并前先 `git pull origin dev` 同步最新代码，避免冲突
> - 提交信息格式：`feat:` 新功能 / `fix:` 修复 / `docs:` 文档 / `style:` 样式

---

*📅 项目创建时间：2026年6月*

PR 权限测试
