# 🌐 外部网站集成麻将游戏语言联动详细文档

## 📋 目录
1. [概述](#概述)
2. [基础要求](#基础要求)
3. [快速集成](#快速集成)
4. [详细实现](#详细实现)
5. [高级功能](#高级功能)
6. [完整示例](#完整示例)
7. [故障排除](#故障排除)
8. [最佳实践](#最佳实践)
9. [技术支持](#技术支持)

## 📋 概述

麻将游戏现在支持通过 iframe 嵌入并与外部网站的语言选择器进行联动。当外部网站切换语言时，游戏内部会自动同步语言设置。本功能基于 PostMessage API 实现，支持跨域通信，兼容所有现代浏览器。

## 🔧 基础要求

### 浏览器兼容性
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ 所有现代移动浏览器

### 技术要求
- HTML5 iframe 支持
- JavaScript ES6+ 基础语法
- PostMessage API 支持（所有现代浏览器都支持）

## ⚡ 快速集成

### 方法一：基础单向控制（最简单）

```html
<!DOCTYPE html>
<html>
<head>
    <title>我的网站</title>
</head>
<body>
    <!-- 你的语言选择器 -->
    <select onchange="changeGameLanguage(this.value)">
        <option value="en">English</option>
        <option value="zh">中文</option>
        <option value="de">Deutsch</option>
    </select>

    <!-- 麻将游戏iframe -->
    <iframe id="mahjongGame" 
            src="https://your-domain.com/mahjong/" 
            width="800" 
            height="600"
            onload="initGame()">
    </iframe>

    <script>
        function changeGameLanguage(language) {
            const gameFrame = document.getElementById('mahjongGame');
            const message = {
                type: 'MAHJONG_LANGUAGE_CHANGE',
                payload: {
                    language: language,
                    source: 'my-website'
                }
            };
            gameFrame.contentWindow.postMessage(message, '*');
        }

        function initGame() {
            // 等待游戏加载完成后设置初始语言
            setTimeout(() => {
                changeGameLanguage('en'); // 设置默认语言
            }, 2000);
        }
    </script>
</body>
</html>
```

### 方法二：双向同步（推荐）

如果你想实现双向同步，即游戏内语言变化也更新外部选择器：

```html
<!DOCTYPE html>
<html>
<head>
    <title>我的网站</title>
</head>
<body>
    <!-- 你的语言选择器 -->
    <select id="languageSelector">
        <option value="en">English</option>
        <option value="zh">中文</option>
        <option value="de">Deutsch</option>
        <!-- 更多语言... -->
    </select>

    <!-- 麻将游戏iframe -->
    <iframe id="mahjongGame" 
            src="https://your-domain.com/mahjong/" 
            width="800" 
            height="600">
    </iframe>

    <script>
        // 游戏语言联动管理器
        class MahjongLanguageSync {
            constructor() {
                this.gameFrame = null;
                this.languageSelector = null;
                this.isGameReady = false;
                this.init();
            }

            init() {
                this.gameFrame = document.getElementById('mahjongGame');
                this.languageSelector = document.getElementById('languageSelector');
                
                // 设置事件监听器
                this.setupEventListeners();
                
                // iframe加载完成后初始化
                this.gameFrame.onload = () => this.onGameLoad();
            }

            setupEventListeners() {
                // 外部语言选择器变化
                this.languageSelector.addEventListener('change', (e) => {
                    this.sendLanguageChange(e.target.value, 'external-selector');
                });

                // 监听来自游戏的消息
                window.addEventListener('message', (e) => this.handleGameMessage(e));
            }

            onGameLoad() {
                this.isGameReady = true;
                console.log('🎮 麻将游戏已加载完成');
                
                // 发送初始语言设置
                setTimeout(() => {
                    this.sendLanguageChange(this.languageSelector.value, 'external-initial');
                    this.requestCurrentLanguage(); // 请求游戏当前语言
                }, 1000);
            }

            sendLanguageChange(language, source = 'external') {
                if (!this.isGameReady) {
                    console.warn('⚠️ 游戏尚未加载完成');
                    return;
                }

                const message = {
                    type: 'MAHJONG_LANGUAGE_CHANGE',
                    payload: {
                        language: language,
                        source: source
                    }
                };

                try {
                    this.gameFrame.contentWindow.postMessage(message, '*');
                    console.log(`📤 语言切换消息已发送: ${language} (${source})`);
                } catch (error) {
                    console.error('❌ 发送语言切换消息失败:', error);
                }
            }

            requestCurrentLanguage() {
                if (!this.isGameReady) return;

                const message = {
                    type: 'MAHJONG_LANGUAGE_REQUEST',
                    payload: {
                        source: 'external'
                    }
                };

                try {
                    this.gameFrame.contentWindow.postMessage(message, '*');
                    console.log('📤 语言请求消息已发送');
                } catch (error) {
                    console.error('❌ 发送语言请求消息失败:', error);
                }
            }

            handleGameMessage(event) {
                const message = event.data;
                
                if (!message || typeof message !== 'object') return;

                switch (message.type) {
                    case 'MAHJONG_LANGUAGE_CHANGE':
                        this.onLanguageChanged(message);
                        break;
                    case 'MAHJONG_LANGUAGE_REQUEST':
                        this.onLanguageRequested(message);
                        break;
                    default:
                        console.log('📨 收到未知消息类型:', message.type);
                }
            }

            onLanguageChanged(message) {
                const { language, source } = message.payload;
                console.log(`📥 收到语言变化通知: ${language} (${source})`);

                // 如果不是来自外部的变化，更新外部选择器
                if (source !== 'external' && source !== 'external-selector') {
                    this.languageSelector.value = language;
                    console.log(`🔄 外部语言选择器已同步到: ${language}`);
                }

                // 触发自定义事件（可选）
                this.dispatchLanguageChangeEvent(language, source);
            }

            onLanguageRequested(message) {
                console.log('📥 收到语言请求，发送当前语言');
                this.sendLanguageChange(this.languageSelector.value, 'external-response');
            }

            dispatchLanguageChangeEvent(language, source) {
                const event = new CustomEvent('mahjongLanguageChanged', {
                    detail: { language, source }
                });
                window.dispatchEvent(event);
            }
        }

        // 初始化语言同步
        const mahjongSync = new MahjongLanguageSync();

        // 可选：监听语言变化事件
        window.addEventListener('mahjongLanguageChanged', (e) => {
            console.log('🎯 游戏语言已变化:', e.detail);
            // 在这里可以添加其他逻辑，比如更新页面其他部分
        });
    </script>
</body>
</html>
```

## 📋 详细实现

### 步骤1：HTML结构设置

```html
<!-- 1. 确保iframe有ID用于JavaScript访问 -->
<iframe id="mahjongGame" 
        src="你的游戏URL" 
        width="推荐宽度" 
        height="推荐高度"
        style="border: none; border-radius: 8px;">
</iframe>

<!-- 2. 创建语言选择器 -->
<select id="languageSelector" class="language-selector">
    <option value="en">🇺🇸 English</option>
    <option value="zh">🇨🇳 中文</option>
    <option value="de">🇩🇪 Deutsch</option>
    <option value="nl">🇳🇱 Nederlands</option>
    <option value="pt">🇵🇹 Português</option>
    <option value="ru">🇷🇺 русский</option>
    <option value="es">🇪🇸 Español</option>
    <option value="eu">🏴 Euskara</option>
    <option value="jp">🇯🇵 日本語</option>
    <option value="fr">🇫🇷 Français</option>
</select>
```

### 步骤2：CSS样式美化

```css
.language-selector {
    padding: 10px 15px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
}

.language-selector:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0,123,255,0.2);
}

.language-selector:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

#mahjongGame {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-radius: 8px;
}
```

### 步骤3：JavaScript核心逻辑

```javascript
// 1. 基础消息发送函数
function sendLanguageToGame(language, source = 'external') {
    const gameFrame = document.getElementById('mahjongGame');
    
    if (!gameFrame || !gameFrame.contentWindow) {
        console.error('❌ 游戏iframe未找到或未加载');
        return false;
    }

    const message = {
        type: 'MAHJONG_LANGUAGE_CHANGE',
        payload: {
            language: language,
            source: source
        }
    };

    try {
        gameFrame.contentWindow.postMessage(message, '*');
        console.log(`✅ 语言消息已发送: ${language}`);
        return true;
    } catch (error) {
        console.error('❌ 发送消息失败:', error);
        return false;
    }
}

// 2. 监听游戏消息
window.addEventListener('message', function(event) {
    // 安全检查：验证消息来源（可选）
    // if (event.origin !== 'https://your-game-domain.com') return;
    
    const message = event.data;
    
    if (message && message.type === 'MAHJONG_LANGUAGE_CHANGE') {
        const { language, source } = message.payload;
        
        console.log(`📥 收到游戏语言变化: ${language} (${source})`);
        
        // 更新外部语言选择器（如果不是来自外部）
        if (source !== 'external') {
            document.getElementById('languageSelector').value = language;
        }
    }
});

// 3. 初始化设置
document.addEventListener('DOMContentLoaded', function() {
    const gameFrame = document.getElementById('mahjongGame');
    
    // 等待iframe加载
    gameFrame.onload = function() {
        console.log('🎮 游戏iframe已加载');
        
        // 延迟发送初始语言设置
        setTimeout(() => {
            const currentLanguage = document.getElementById('languageSelector').value;
            sendLanguageToGame(currentLanguage, 'external-initial');
        }, 2000);
    };
    
    // 设置语言选择器事件
    document.getElementById('languageSelector').addEventListener('change', function(e) {
        sendLanguageToGame(e.target.value, 'external-selector');
    });
});
```

## 📡 消息协议

### 语言切换消息

**发送到游戏：**
```javascript
{
    type: 'MAHJONG_LANGUAGE_CHANGE',
    payload: {
        language: 'zh|en|de|nl|pt|ru|es|eu|jp|fr',
        source: 'your-app-name'  // 可选，用于标识消息来源
    }
}
```

**从游戏接收：**
- 游戏在语言变化时会自动发送相同格式的消息回父窗口
- 消息包含新的语言和来源标识

### 语言请求消息

**请求当前语言：**
```javascript
{
    type: 'MAHJONG_LANGUAGE_REQUEST',
    payload: {
        source: 'your-app-name'  // 可选
    }
}
```

## 🌍 支持的语言

| 语言代码 | 语言名称 | 显示名称 |
|---------|---------|---------|
| `en` | English | English |
| `zh` | 中文 | 中文 |
| `de` | Deutsch | Deutsch |
| `nl` | Nederlands | Nederlands |
| `pt` | Português | Português |
| `ru` | русский | русский |
| `es` | Español | Español |
| `eu` | Euskara | Euskara |
| `jp` | 日本語 | 日本語 |
| `fr` | Français | Français |

## 🚀 高级功能

### 1. 带状态指示的语言选择器

```html
<div class="language-control">
    <label for="languageSelector">游戏语言：</label>
    <select id="languageSelector">
        <!-- 语言选项 -->
    </select>
    <span id="syncStatus" class="sync-status">同步中...</span>
</div>

<style>
.sync-status {
    margin-left: 10px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
}

.sync-status.syncing {
    background: #fff3cd;
    color: #856404;
}

.sync-status.synced {
    background: #d4edda;
    color: #155724;
}

.sync-status.error {
    background: #f8d7da;
    color: #721c24;
}
</style>

<script>
function updateSyncStatus(status, message = '') {
    const statusEl = document.getElementById('syncStatus');
    statusEl.className = `sync-status ${status}`;
    statusEl.textContent = message;
}

function sendLanguageToGame(language, source = 'external') {
    updateSyncStatus('syncing', '同步中...');
    
    const gameFrame = document.getElementById('mahjongGame');
    const message = {
        type: 'MAHJONG_LANGUAGE_CHANGE',
        payload: { language, source }
    };

    try {
        gameFrame.contentWindow.postMessage(message, '*');
        
        // 设置超时检查
        setTimeout(() => {
            if (document.getElementById('syncStatus').className.includes('syncing')) {
                updateSyncStatus('error', '同步超时');
            }
        }, 3000);
        
    } catch (error) {
        updateSyncStatus('error', '同步失败');
        console.error('发送消息失败:', error);
    }
}

// 监听同步成功消息
window.addEventListener('message', function(event) {
    const message = event.data;
    
    if (message && message.type === 'MAHJONG_LANGUAGE_CHANGE') {
        const { source } = message.payload;
        if (source === 'mahjong-game') {
            updateSyncStatus('synced', '已同步');
            setTimeout(() => {
                updateSyncStatus('synced', '');
            }, 2000);
        }
    }
});
</script>
```

### 2. 安全配置

如果需要限制消息来源，可以指定目标域名：

```javascript
// 替换 '*' 为具体域名以提高安全性
gameFrame.contentWindow.postMessage(message, 'https://your-domain.com');
```

### 3. 错误处理

```javascript
function changeGameLanguage(language) {
    try {
        const gameFrame = document.getElementById('mahjongGame');
        if (!gameFrame || !gameFrame.contentWindow) {
            console.error('游戏iframe未找到或未加载完成');
            return;
        }
        
        const message = {
            type: 'MAHJONG_LANGUAGE_CHANGE',
            payload: { language, source: 'parent-website' }
        };
        
        gameFrame.contentWindow.postMessage(message, '*');
        console.log('语言切换消息已发送:', language);
    } catch (error) {
        console.error('发送语言切换消息失败:', error);
    }
}
```

### 4. React/Vue/Angular 组件示例

**React 组件示例：**
```jsx
import React, { useState, useEffect, useRef } from 'react';

const MahjongGame = ({ gameUrl, initialLanguage = 'en', onLanguageChange }) => {
    const iframeRef = useRef(null);
    const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
    const [syncStatus, setSyncStatus] = useState('loading');

    useEffect(() => {
        const handleMessage = (event) => {
            const message = event.data;
            
            if (message && message.type === 'MAHJONG_LANGUAGE_CHANGE') {
                const { language, source } = message.payload;
                
                if (source !== 'external') {
                    setCurrentLanguage(language);
                    setSyncStatus('synced');
                    onLanguageChange?.(language, source);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onLanguageChange]);

    useEffect(() => {
        const iframe = iframeRef.current;
        
        const handleLoad = () => {
            setSyncStatus('ready');
            sendLanguageChange(currentLanguage, 'external-initial');
        };

        iframe.addEventListener('load', handleLoad);
        return () => iframe.removeEventListener('load', handleLoad);
    }, [currentLanguage]);

    const sendLanguageChange = (language, source = 'external') => {
        const iframe = iframeRef.current;
        
        if (!iframe || !iframe.contentWindow) return;

        const message = {
            type: 'MAHJONG_LANGUAGE_CHANGE',
            payload: { language, source }
        };

        try {
            iframe.contentWindow.postMessage(message, '*');
            setSyncStatus('syncing');
        } catch (error) {
            setSyncStatus('error');
            console.error('发送语言消息失败:', error);
        }
    };

    const handleLanguageSelect = (event) => {
        const newLanguage = event.target.value;
        setCurrentLanguage(newLanguage);
        sendLanguageChange(newLanguage, 'external-selector');
    };

    return (
        <div className="mahjong-game-container">
            <div className="language-control">
                <label>游戏语言：</label>
                <select value={currentLanguage} onChange={handleLanguageSelect}>
                    <option value="en">🇺🇸 English</option>
                    <option value="zh">🇨🇳 中文</option>
                    <option value="de">🇩🇪 Deutsch</option>
                    {/* 更多语言选项 */}
                </select>
                <span className={`sync-status ${syncStatus}`}>
                    {syncStatus === 'loading' && '加载中...'}
                    {syncStatus === 'ready' && '就绪'}
                    {syncStatus === 'syncing' && '同步中...'}
                    {syncStatus === 'synced' && '已同步'}
                    {syncStatus === 'error' && '同步失败'}
                </span>
            </div>
            
            <iframe
                ref={iframeRef}
                src={gameUrl}
                width="800"
                height="600"
                style={{ border: 'none', borderRadius: '8px' }}
            />
        </div>
    );
};

// 使用示例
export default function App() {
    const handleGameLanguageChange = (language, source) => {
        console.log(`游戏语言已变化: ${language} (${source})`);
        // 可以在这里更新应用的其他部分
    };

    return (
        <div>
            <h1>我的游戏网站</h1>
            <MahjongGame 
                gameUrl="https://your-domain.com/mahjong/"
                initialLanguage="zh"
                onLanguageChange={handleGameLanguageChange}
            />
        </div>
    );
}
```

## 🧪 测试

项目包含一个测试文件 `test-iframe.html`，可以用来测试 iframe 语言联动功能：

1. 启动开发服务器：`npm start`
2. 在浏览器中打开 `test-iframe.html`
3. 使用页面上的语言选择器测试联动效果

## 🔧 故障排除

### 常见问题

1. **语言没有切换**
   - 检查控制台是否有错误信息
   - 确认游戏已经完全加载（建议等待 2-3 秒）
   - 验证语言代码是否正确

2. **消息发送失败**
   - 确认 iframe 已加载完成
   - 检查跨域限制
   - 验证消息格式是否正确

3. **双向同步不工作**
   - 确认已正确添加消息监听器
   - 检查消息来源判断逻辑

## 📞 技术支持

如果遇到集成问题，请检查：
1. 浏览器控制台的错误信息
2. 网络请求状态
3. iframe 加载状态

---

*本功能基于 PostMessage API 实现，支持跨域通信，兼容所有现代浏览器。*