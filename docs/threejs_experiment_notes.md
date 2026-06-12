# Three.js 真 3D 跑酷实验版说明

## 实验定位

`/game3d-three` 是《森林酷跑》的独立 Three.js 真 3D 实验页面，用于验证项目未来向 3D 跑酷扩展的可行性。

它不替换正式 2D 游戏 `/game`，也不覆盖 2.5D 实验版 `/game3d`。当前实验代码集中在：

- `app/templates/game3d_three.html`
- `app/static/js/game3d_three.js`
- `app/static/css/game3d_three.css`

## 当前已实现

- Three.js `Scene`、`PerspectiveCamera`、`WebGLRenderer`
- 森林主题 3D 场景、草地、三车道跑道、树木、天空和云朵
- 低多边形卡通小狐狸玩家模型
- 左右三车道平滑切换
- 空格 / 上方向键跳跃
- 树桩、石头、木箱三类障碍物
- 金币旋转、拾取和粒子反馈
- 分数、距离、金币、速度 HUD
- 开始、暂停、继续、重新开始、结算流程
- 基于 `lane + z 窗口 + jumpHeight + passed` 的逻辑碰撞
- 低矮障碍物可跳过，高木箱主要通过换道躲避
- 碰撞、跳跃、金币拾取时的轻量屏幕反馈

## 不影响的正式功能

实验版不修改以下正式功能的核心代码：

- `/game` 2D Canvas 正式版
- `/game3d` 2.5D Canvas 实验版
- 登录注册
- 排行榜
- 个人中心
- 后台管理
- 数据库表结构

## 本地运行

在项目根目录运行：

```powershell
python run.py
```

然后访问：

```text
http://127.0.0.1:5000/game3d-three
```

相关页面检查地址：

- `http://127.0.0.1:5000/`
- `http://127.0.0.1:5000/game`
- `http://127.0.0.1:5000/game3d`
- `http://127.0.0.1:5000/game3d-three`
- `http://127.0.0.1:5000/rank`
- `http://127.0.0.1:5000/profile`

## 验证建议

基础检查：

```powershell
node --check app\static\js\game3d_three.js
python -m pytest tests -p no:cacheprovider
```

手动体验重点：

- 不跳跃撞到同车道树桩，应结束游戏
- 跳跃越过同车道树桩或石头，应继续游戏
- 同车道木箱主要通过换道躲避
- 不同车道障碍物不应撞到玩家
- 障碍物远处不应提前触发碰撞
- 障碍物越过玩家后不应重复触发碰撞
- 金币只增加金币和分数，不触发死亡
- 暂停、继续、重新开始、结算按钮可用

## 展示建议

展示时建议先说明这是实验页面，再按下面顺序演示：

1. 打开 `/game3d-three`，说明它和正式 `/game` 独立。
2. 展示小狐狸角色、森林跑道和三车道纵深。
3. 演示左右换道和跳跃。
4. 演示跳过树桩或石头。
5. 演示金币拾取和 HUD 增长。
6. 演示撞到木箱后的结算页。
7. 点击返回 2D 或返回 2.5D，说明正式功能未受影响。

## 已知不足

- 角色和障碍物仍为基础几何体组合，没有外部模型和骨骼动画。
- 没有音效系统，当前主要依赖视觉反馈。
- 关卡节奏仍较简单，障碍物和金币生成还没有完整关卡编排。
- 移动端触控按钮尚未针对真 3D 实验页单独设计。
- Three.js 通过 CDN 引入，离线环境下需要网络可用或后续补充本地降级方案。

## 合并建议

建议先保留在 `experiment/codex-threejs-prototype` 分支继续验收。若需要合并到 `dev`，建议满足以下条件：

- `/game3d-three` 在目标演示机器上能正常加载 Three.js CDN。
- `/game` 和 `/game3d` 在合并前后都能正常访问。
- `python -m pytest tests -p no:cacheprovider` 通过。
- 浏览器控制台没有 `/game3d-three` 页面脚本错误。

不建议直接合并到 `main`，因为该页面仍属于实验功能。
