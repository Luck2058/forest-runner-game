# 音效素材说明

请【成员二：美术设计与趣味交互】将音频素材放在这个目录下。

## 需要的音效清单

| 文件名 | 说明 | 格式 |
|--------|------|------|
| `bgm.mp3` | 背景音乐（轻松森林风） | MP3 |
| `jump.wav` | 跳跃音效 | WAV |
| `coin.wav` | 收集金币音效 | WAV |
| `gameover.wav` | 游戏结束音效 | WAV |
| `start.wav` | 游戏开始音效（可选） | WAV |

## 使用方法（在 game.js 中加载）

```javascript
// 加载音效示例（成员二参考）
const jumpSound = new Audio('/static/audio/jump.wav');
const coinSound = new Audio('/static/audio/coin.wav');

// 播放跳跃音
function jump() {
    jumpSound.currentTime = 0;
    jumpSound.play();
    // ... 跳跃逻辑
}
```

## 免费音效来源
- https://freesound.org （免费音效库）
- https://opengameart.org （开源游戏音效）
- https://mixkit.co/free-sound-effects/ （免费音效）
