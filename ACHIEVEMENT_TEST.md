# 游戏成就系统测试指南

## 功能概述
已成功实现了基于 GAME_ACHIEVEMENT_API.md 要求的游戏成就消息机制，包括：

### 实现的消息类型
1. **MAHJONG_GAME_COMPLETED** - 游戏完成消息
2. **MAHJONG_ACHIEVEMENT_UNLOCKED** - 成就解锁消息  
3. **MAHJONG_HIGH_SCORE** - 高分记录消息

### 成就类型
1. **首次胜利** (first_win) - 完成第一个游戏
2. **速度成就** (speed_demon) - 快速完成游戏
3. **完美游戏** (perfectionist) - 无辅助功能完成
4. **高分记录** - 打破个人最佳时间

## 测试步骤

### 1. 启动测试环境
```bash
# 开发服务器已在 http://localhost:4200/ 运行
# 测试页面: test-achievement.html
```

### 2. 测试成就消息
1. 打开 `test-achievement.html` 页面（在浏览器中）
2. 在 iframe 中完成一局麻将游戏
3. 观察消息日志显示的成就消息

### 3. 预期消息示例

#### 游戏完成消息
```javascript
{
  "type": "MAHJONG_GAME_COMPLETED",
  "payload": {
    "layoutName": "Turtle",
    "layoutId": "classic_turtle", 
    "timeElapsed": 125000,
    "movesCount": 143,
    "hintsUsed": 2,
    "undoCount": 5,
    "difficulty": "intermediate",
    "perfectGame": false,
    "timestamp": 1704067200000
  }
}
```

#### 首次胜利成就
```javascript
{
  "type": "MAHJONG_ACHIEVEMENT_UNLOCKED",
  "payload": {
    "achievementId": "first_win",
    "achievementName": "First Victory",
    "achievementType": "first_win", 
    "description": "Complete your first mahjong game",
    "context": {
      "layoutName": "Turtle",
      "timeElapsed": 125000,
      "movesCount": 143
    },
    "isNewAchievement": true,
    "timestamp": 1704067200000
  }
}
```

#### 高分记录消息
```javascript
{
  "type": "MAHJONG_HIGH_SCORE",
  "payload": {
    "layoutName": "Turtle",
    "layoutId": "classic_turtle",
    "scoreType": "time",
    "newValue": 120000,
    "previousValue": 150000, 
    "improvement": 30000,
    "context": {
      "movesCount": 143,
      "hintsUsed": 0,
      "undoCount": 2,
      "perfectGame": false
    },
    "timestamp": 1704067200000
  }
}
```

## 修改的文件

### 核心文件
1. `src/app/model/types.ts` - 扩展了 LayoutScoreStore 接口
2. `src/app/service/iframe-communication.service.ts` - 添加成就消息类型和发送方法
3. `src/app/model/board.ts` - 添加统计跟踪（移动、提示、撤销）
4. `src/app/model/game.ts` - 实现成就检测和记录更新
5. `src/app/service/app.service.ts` - 集成成就消息发送

### 测试文件
- `test-achievement.html` - 成就消息测试页面

## 设计特点

### 统计数据
- **移动次数**: 成功配对的次数
- **提示使用**: 根据游戏模式，专家模式固定为0
- **撤销使用**: 根据游戏模式，专家模式固定为0
- **完美游戏**: 无任何辅助功能完成

### 时间阈值
- 基于牌数和游戏模式动态计算
- 简单模式: 每张牌1.5秒基准
- 标准模式: 每张牌2秒基准  
- 专家模式: 每张牌3秒基准

### 存储机制
- 使用 localStorage 本地存储
- 支持按游戏模式分类记录
- 保存最近10次游戏时间用于计算平均值

## 向后兼容性
- 完全兼容现有的语言同步功能
- 不影响现有游戏逻辑
- 消息只在 iframe 模式下发送

## 后续集成
主站可以：
1. 监听这些消息类型
2. 触发庆祝动画
3. 生成分享图片
4. 实现社交分享功能
5. 可选择性地将记录存储到云端