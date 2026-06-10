# C 岗 Flask 后端接口说明

**负责人：肖盼**  
**分支：feature/backend-auth**  
**完成时间：2026-06-10**

---

## 一、功能说明（Word 文档用）

本岗位负责《森林酷跑》系统的 Flask 后端开发，使用蓝图结构组织路由，实现了用户注册（表单校验 + bcrypt 密码哈希加密）、用户登录（数据库验证 + Flask session 管理）、退出登录功能，以及三个数据接口：游戏结束后通过 `POST /score/submit` 保存成绩、`GET /score/rank` 查询全服排行榜（每用户取最高分）、`GET /score/my-scores` 查询个人历史成绩。所有接口均做了登录态验证和参数校验，保证数据安全可靠。

---

## 二、主要路由接口列表

| 路由路径 | 请求方法 | 功能描述 | 是否需要登录 |
|---|---|---|---|
| `/auth/register` | GET / POST | 用户注册页面，POST 提交时校验表单并将密码哈希后存入数据库 | 否 |
| `/auth/login` | GET / POST | 用户登录页面，POST 提交时验证用户名+密码，成功后写入 session | 否 |
| `/auth/logout` | GET | 退出登录，清除 session，跳转到登录页 | 是 |
| `/score/submit` | POST（JSON） | 游戏结束提交本局成绩，保存到数据库 | 是 |
| `/score/rank` | GET | 排行榜页面，展示全服前 20 名最高分 | 否 |
| `/score/api/rank` | GET | 排行榜 JSON 接口，供前端 AJAX 调用 | 否 |
| `/score/my-scores` | GET | 个人历史成绩 JSON 接口，返回当前用户全部成绩 | 是 |
| `/score/statistics` | GET | 全局统计接口，返回总局数、总用户数、历史最高分 | 否 |

---

## 三、成绩提交接口详细说明

### POST /score/submit

**功能**：游戏结束后由前端 AJAX 调用，将本局成绩保存到数据库。

**请求格式**：JSON

**请求参数**：

| 参数名 | 类型 | 是否必填 | 说明 |
|---|---|---|---|
| score | int | 必填 | 本局得分（非负整数） |
| coins | int | 可选 | 收集金币数，默认 0 |
| distance | int | 可选 | 跑动距离（米），默认 0 |
| difficulty | string | 可选 | 难度：easy / normal / hard，默认 normal |
| play_time | int | 可选 | 游戏时长（秒），默认 0 |

**请求示例**：
```json
{
    "score": 1280,
    "coins": 15,
    "distance": 120,
    "difficulty": "normal",
    "play_time": 43
}
```

**返回示例（成功）**：
```json
{
    "success": true,
    "message": "成绩已保存！🎉 新纪录！",
    "is_new_record": true,
    "score_id": 7
}
```

**返回示例（未登录）**：
```json
{
    "success": false,
    "message": "请先登录再提交成绩！"
}
```

---

## 四、修改的文件清单

| 文件路径 | 修改内容 |
|---|---|
| `app/routes/auth.py` | 实现注册（表单校验+密码哈希）、登录（数据库验证+session）、退出 |
| `app/routes/game.py` | 添加 login_required 装饰器，游戏页/个人中心未登录自动跳转 |
| `app/routes/score.py` | 实现成绩提交、排行榜、个人历史成绩三个接口 |
| `app/models/score.py` | 补全 get_global_ranking / get_user_scores / get_user_best_score / get_statistics / to_dict 方法 |
| `app/templates/login.html` | 移除演示版提示文字 |
| `app/templates/register.html` | 修复确认密码字段 name（confirm）前后端统一 |
| `app/templates/rank.html` | 修复模板字段名与后端字典字段名不匹配的问题 |

---

## 五、截图清单（需自行截图）

请按如下顺序截图，保存到 `docs/运行截图/` 目录：

1. `注册页.png` — 打开 http://127.0.0.1:5000/auth/register，填写表单
2. `注册成功.png` — 注册后跳转到登录页，显示"注册成功"提示
3. `登录页.png` — 打开 http://127.0.0.1:5000/auth/login
4. `登录成功.png` — 登录后跳转到首页
5. `排行榜页.png` — 打开 http://127.0.0.1:5000/score/rank，有数据显示
6. `成绩保存.png` — 玩一局游戏结束后弹出"成绩已保存"提示

---

## 六、展示时的一句话

> **"我负责 Flask 后端框架搭建，实现了用户注册（密码加密存储）、登录（session 管理）和三个数据接口：成绩提交、排行榜查询、个人历史成绩查询。"**
