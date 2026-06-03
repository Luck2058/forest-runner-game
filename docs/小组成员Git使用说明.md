# 🌲 森林酷跑 · 小组成员 Git 使用说明

> 适合不太熟悉 Git 的同学，按步骤操作即可。
> 所有命令在 **Windows PowerShell** 中运行。

---

## 📌 每人对应的分支名

| 角色 | 分支名 |
|------|--------|
| 组长 | `dev`（直接在 dev 整合） |
| 成员一（游戏逻辑） | `feature/game-core` |
| 成员二（美术设计） | `feature/ui-design` |
| 成员三（Flask 后端） | `feature/backend-auth` |
| 成员四（数据库） | `feature/database-score` |
| 成员五（测试文档） | `feature/test-docs` |

---

## 第一步：下载项目（只做一次）

打开 PowerShell，进入你想放项目的文件夹，然后运行：

```powershell
git clone https://github.com/Luck2058/forest-runner-game.git
cd forest-runner-game
```

> 💡 如果提示没有 git，先去安装：https://git-scm.com/download/win

---

## 第二步：安装依赖（只做一次）

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

安装完成后，运行项目：

```powershell
python run.py
```

浏览器访问 http://127.0.0.1:5000 就能看到页面了。

---

## 第三步：切换到 dev 分支

```powershell
git checkout dev
git pull origin dev
```

> ⚠️ 每次开始写代码前都要先执行这两条，确保你的代码是最新的。

---

## 第四步：创建自己的功能分支（只做一次）

根据你的角色，选择对应的命令执行：

```powershell
# 成员一
git checkout -b feature/game-core

# 成员二
git checkout -b feature/ui-design

# 成员三
git checkout -b feature/backend-auth

# 成员四
git checkout -b feature/database-score

# 成员五
git checkout -b feature/test-docs
```

执行后你就切换到自己的专属分支了，之后就在这个分支上写代码。

---

## 第五步：提交代码

写完代码之后，按以下步骤提交：

**① 查看改了哪些文件**

```powershell
git status
```

**② 添加所有修改**

```powershell
git add .
```

**③ 写提交说明并提交**

```powershell
git commit -m "这里写你做了什么，例如：feat: 实现跳跃二段跳动作"
```

> 💡 提交说明建议格式：
> - `feat: 新增了xx功能`
> - `fix: 修复了xx问题`
> - `style: 调整了xx样式`
> - `docs: 更新了xx文档`

---

## 第六步：推送到 GitHub

```powershell
git push origin feature/game-core
```

> ⚠️ 把 `feature/game-core` 换成你自己的分支名。

**第一次推送用这个命令（加 -u）：**

```powershell
git push -u origin feature/game-core
```

之后每次直接：

```powershell
git push
```

---

## 第七步：同步别人的最新代码

每次开始写代码前，先同步一下 dev 分支的最新内容：

```powershell
# 切回 dev 分支拉取最新代码
git checkout dev
git pull origin dev

# 切回自己的分支
git checkout feature/game-core

# 把 dev 的最新内容合并进来
git merge dev
```

> 这样可以避免最后合并时有太多冲突。

---

## ❌ 注意：不要直接修改 main 分支

`main` 分支是最终稳定版本，**不允许直接推送**。

正确流程是：
1. 在自己的功能分支写代码
2. 推送到 GitHub
3. 在 GitHub 网页上发起 **Pull Request**（PR），请求合并到 `dev`
4. 组长审核后合并

---

## 🆘 常用命令速查

| 命令 | 作用 |
|------|------|
| `git status` | 查看当前改了哪些文件 |
| `git branch` | 查看当前在哪个分支 |
| `git checkout dev` | 切换到 dev 分支 |
| `git pull origin dev` | 拉取 dev 最新代码 |
| `git add .` | 添加所有修改 |
| `git commit -m "说明"` | 提交代码 |
| `git push` | 推送到 GitHub |
| `git log --oneline` | 查看提交历史 |

---

## 📞 遇到问题怎么办？

1. 先截图报错信息
2. 发到群里，组长或其他成员帮忙看
3. 也可以百度/Google 报错信息

> 🎯 记住：**只在自己的分支上改代码，不碰 main，有问题问组长！**
