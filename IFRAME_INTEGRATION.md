# 🌐 外部网站集成麻将游戏语言联动详细文档

## 📋 目录
1. [概述](#概述)
2. [基础要求](#基础要求)
3. [快速集成](#快速集成)
4. [Next.js专用集成](#nextjs专用集成)
5. [现代前端框架集成](#现代前端框架集成)
6. [详细实现](#详细实现)
7. [高级功能](#高级功能)
8. [安全性配置](#安全性配置)
9. [开发调试工具](#开发调试工具)
10. [生产环境最佳实践](#生产环境最佳实践)
11. [完整示例](#完整示例)
12. [故障排除](#故障排除)
13. [最佳实践](#最佳实践)
14. [技术支持](#技术支持)

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

## ⚡ Next.js专用集成

### 🚀 快速开始（Next.js 13+ App Router）

**1. 创建React Hook**

```typescript
// hooks/useMahjongCommunication.ts
import { useEffect, useState, useCallback } from 'react';

interface MahjongLanguageMessage {
  type: 'MAHJONG_LANGUAGE_CHANGE';
  payload: {
    language: string;
    source: string;
  };
}

interface MahjongRequestMessage {
  type: 'MAHJONG_LANGUAGE_REQUEST';
  payload: {
    source?: string;
  };
}

export const useMahjongCommunication = (gameFrameId: string) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isGameReady, setIsGameReady] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'loading' | 'ready' | 'syncing' | 'synced' | 'error'>('loading');

  // 发送语言变化到游戏
  const sendLanguageToGame = useCallback((language: string) => {
    const gameFrame = document.getElementById(gameFrameId) as HTMLIFrameElement;
    if (!gameFrame || !gameFrame.contentWindow) {
      console.warn('⚠️ 游戏iframe未找到或未加载完成');
      setSyncStatus('error');
      return;
    }

    const message: MahjongLanguageMessage = {
      type: 'MAHJONG_LANGUAGE_CHANGE',
      payload: {
        language,
        source: 'nextjs-website'
      }
    };

    try {
      gameFrame.contentWindow.postMessage(message, '*');
      setSyncStatus('syncing');
      console.log(`📤 语言消息已发送到游戏: ${language}`);
    } catch (error) {
      setSyncStatus('error');
      console.error('❌ 发送语言消息失败:', error);
    }
  }, [gameFrameId]);

  // 请求游戏当前语言
  const requestGameLanguage = useCallback(() => {
    const gameFrame = document.getElementById(gameFrameId) as HTMLIFrameElement;
    if (!gameFrame || !gameFrame.contentWindow) return;

    const message: MahjongRequestMessage = {
      type: 'MAHJONG_LANGUAGE_REQUEST',
      payload: {
        source: 'nextjs-website'
      }
    };

    try {
      gameFrame.contentWindow.postMessage(message, '*');
      console.log('📤 语言请求已发送到游戏');
    } catch (error) {
      console.error('❌ 发送语言请求失败:', error);
    }
  }, [gameFrameId]);

  useEffect(() => {
    // 消息监听器
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      const message = event.data as MahjongLanguageMessage | MahjongRequestMessage;

      switch (message.type) {
        case 'MAHJONG_LANGUAGE_CHANGE':
          const { language, source } = message.payload;
          console.log(`📥 收到游戏语言变化: ${language} (来源: ${source})`);
          
          if (source === 'mahjong-game' || source === 'internal') {
            setCurrentLanguage(language);
            setSyncStatus('synced');
            
            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('mahjongLanguageChanged', {
              detail: { language, source }
            }));
          }
          break;

        case 'MAHJONG_LANGUAGE_REQUEST':
          console.log('📥 收到游戏的语言请求');
          sendLanguageToGame(currentLanguage);
          break;

        default:
          console.log('📨 收到未知消息类型:', message.type);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentLanguage, sendLanguageToGame]);

  return {
    currentLanguage,
    isGameReady,
    syncStatus,
    sendLanguageToGame,
    requestGameLanguage,
    setIsGameReady
  };
};
```

**2. 创建页面组件**

```typescript
// app/mahjong/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useMahjongCommunication } from '@/hooks/useMahjongCommunication';

export default function MahjongGamePage() {
  const gameFrameId = 'mahjongGameFrame';
  
  const {
    currentLanguage,
    isGameReady,
    syncStatus,
    sendLanguageToGame,
    requestGameLanguage,
    setIsGameReady
  } = useMahjongCommunication(gameFrameId);

  // iframe加载完成处理
  const handleGameLoad = () => {
    console.log('🎮 游戏iframe加载完成');
    setIsGameReady(true);
    
    setTimeout(() => {
      requestGameLanguage();
    }, 1000);
  };

  // 外部语言切换处理
  const handleLanguageChange = (newLanguage: string) => {
    sendLanguageToGame(newLanguage);
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'loading': return 'text-yellow-600';
      case 'ready': return 'text-green-600';
      case 'syncing': return 'text-blue-600';
      case 'synced': return 'text-green-500';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'loading': return '加载中...';
      case 'ready': return '就绪';
      case 'syncing': return '同步中...';
      case 'synced': return '已同步';
      case 'error': return '同步失败';
      default: return '未知状态';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Mahjong游戏集成</h1>
        
        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label htmlFor="languageSelector" className="font-semibold">
                游戏语言：
              </label>
              <select
                id="languageSelector"
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
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
            </div>
            
            <div className="flex items-center gap-6">
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                状态: {getStatusText()}
              </span>
              <span className="text-sm text-gray-600">
                当前语言: {currentLanguage}
              </span>
            </div>
          </div>
        </div>

        {/* 游戏iframe */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <iframe
            id={gameFrameId}
            src="https://your-domain.com/mahjong/"
            width="100%"
            height="600"
            onLoad={handleGameLoad}
            className="w-full h-[600px] border-0"
            title="Mahjong Game"
            allowFullScreen
          />
        </div>

        {/* 调试信息 */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold mb-2">调试信息</h3>
          <div className="text-sm space-y-1 font-mono">
            <div>游戏就绪: {isGameReady ? '✅' : '⏳'}</div>
            <div>同步状态: {syncStatus}</div>
            <div>当前语言: {currentLanguage}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**3. 全局语言同步Provider**

```typescript
// components/LanguageSyncProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface LanguageContextType {
  gameLanguage: string;
  isGameConnected: boolean;
  setGameLanguage: (language: string) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  gameLanguage: 'en',
  isGameConnected: false,
  setGameLanguage: () => {}
});

export const useGameLanguage = () => useContext(LanguageContext);

export const LanguageSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameLanguage, setGameLanguage] = useState('en');
  const [isGameConnected, setIsGameConnected] = useState(false);

  useEffect(() => {
    const handleMahjongLanguageChange = (event: CustomEvent) => {
      const { language } = event.detail;
      setGameLanguage(language);
      setIsGameConnected(true);
      console.log(`🌐 全局语言同步: ${language}`);
    };

    window.addEventListener('mahjongLanguageChanged', handleMahjongLanguageChange as EventListener);

    return () => {
      window.removeEventListener('mahjongLanguageChanged', handleMahjongLanguageChange as EventListener);
    };
  }, []);

  return (
    <LanguageContext.Provider value={{ 
      gameLanguage, 
      isGameConnected, 
      setGameLanguage 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
```

**4. 在layout.tsx中配置**

```typescript
// app/layout.tsx
import { LanguageSyncProvider } from '@/components/LanguageSyncProvider';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageSyncProvider>
          {children}
        </LanguageSyncProvider>
      </body>
    </html>
  );
}
```

### 🔧 Next.js配置

**1. 安全头部配置**

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://your-game-domain.com;"
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://your-game-domain.com'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

**2. TypeScript类型定义**

```typescript
// types/mahjong.d.ts
export interface MahjongLanguageMessage {
  type: 'MAHJONG_LANGUAGE_CHANGE';
  payload: {
    language: 'en' | 'zh' | 'de' | 'nl' | 'pt' | 'ru' | 'es' | 'eu' | 'jp' | 'fr';
    source: string;
  };
}

export interface MahjongRequestMessage {
  type: 'MAHJONG_LANGUAGE_REQUEST';
  payload: {
    source?: string;
  };
}

export type MahjongMessage = MahjongLanguageMessage | MahjongRequestMessage;

declare global {
  interface Window {
    testMahjongMessage?: () => void;
  }
}

export {};
```

### 🎯 Pages Router集成 (Next.js 12及以下)

```typescript
// pages/mahjong.tsx
import React, { useEffect } from 'react';
import { useMahjongCommunication } from '../hooks/useMahjongCommunication';

export default function MahjongGamePage() {
  // Hook使用方式与App Router相同
  const gameCommunication = useMahjongCommunication('mahjongGameFrame');

  return (
    <div className="container">
      {/* 与App Router相同的组件结构 */}
    </div>
  );
}

// pages/_app.tsx
import type { AppProps } from 'next/app';
import { LanguageSyncProvider } from '../components/LanguageSyncProvider';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageSyncProvider>
      <Component {...pageProps} />
    </LanguageSyncProvider>
  );
}
```

## ⚡ 现代前端框架集成

### 🔥 Vue 3 Composition API

**1. 创建Composable Hook**

```typescript
// composables/useMahjongCommunication.ts
import { ref, onMounted, onUnmounted } from 'vue';

interface MahjongLanguageMessage {
  type: 'MAHJONG_LANGUAGE_CHANGE';
  payload: {
    language: string;
    source: string;
  };
}

export const useMahjongCommunication = (gameFrameId: string) => {
  const currentLanguage = ref<string>('en');
  const isGameReady = ref<boolean>(false);
  const syncStatus = ref<'loading' | 'ready' | 'syncing' | 'synced' | 'error'>('loading');

  let gameFrame: HTMLIFrameElement | null = null;

  // 发送语言变化到游戏
  const sendLanguageToGame = (language: string) => {
    if (!gameFrame?.contentWindow) {
      console.warn('⚠️ 游戏iframe未找到或未加载完成');
      syncStatus.value = 'error';
      return;
    }

    const message: MahjongLanguageMessage = {
      type: 'MAHJONG_LANGUAGE_CHANGE',
      payload: {
        language,
        source: 'vue-app'
      }
    };

    try {
      gameFrame.contentWindow.postMessage(message, '*');
      syncStatus.value = 'syncing';
      console.log(`📤 语言消息已发送到游戏: ${language}`);
    } catch (error) {
      syncStatus.value = 'error';
      console.error('❌ 发送语言消息失败:', error);
    }
  };

  // 请求游戏当前语言
  const requestGameLanguage = () => {
    if (!gameFrame?.contentWindow) return;

    const message = {
      type: 'MAHJONG_LANGUAGE_REQUEST',
      payload: {
        source: 'vue-app'
      }
    };

    try {
      gameFrame.contentWindow.postMessage(message, '*');
      console.log('📤 语言请求已发送到游戏');
    } catch (error) {
      console.error('❌ 发送语言请求失败:', error);
    }
  };

  // 消息处理器
  const handleMessage = (event: MessageEvent) => {
    if (!event.data || typeof event.data !== 'object') return;

    const message = event.data;

    switch (message.type) {
      case 'MAHJONG_LANGUAGE_CHANGE':
        const { language, source } = message.payload;
        console.log(`📥 收到游戏语言变化: ${language} (来源: ${source})`);
        
        if (source === 'mahjong-game' || source === 'internal') {
          currentLanguage.value = language;
          syncStatus.value = 'synced';
        }
        break;

      case 'MAHJONG_LANGUAGE_REQUEST':
        console.log('📥 收到游戏的语言请求');
        sendLanguageToGame(currentLanguage.value);
        break;
    }
  };

  onMounted(() => {
    gameFrame = document.getElementById(gameFrameId) as HTMLIFrameElement;
    window.addEventListener('message', handleMessage);
  });

  onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
  });

  return {
    currentLanguage: readonly(currentLanguage),
    isGameReady: readonly(isGameReady),
    syncStatus: readonly(syncStatus),
    sendLanguageToGame,
    requestGameLanguage,
    setIsGameReady: (ready: boolean) => { isGameReady.value = ready; }
  };
};
```

**2. Vue组件实现**

```vue
<!-- components/MahjongGame.vue -->
<template>
  <div class="mahjong-game-container">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="language-controls">
        <label for="languageSelector">游戏语言：</label>
        <select 
          id="languageSelector"
          v-model="selectedLanguage"
          @change="handleLanguageChange"
          :class="['language-select', statusClass]"
        >
          <option v-for="lang in languages" :key="lang.code" :value="lang.code">
            {{ lang.flag }} {{ lang.name }}
          </option>
        </select>
        
        <div class="status-indicator">
          <span :class="['status', statusClass]">{{ statusText }}</span>
          <span class="current-lang">当前: {{ currentLanguage }}</span>
        </div>
      </div>
    </div>

    <!-- 游戏iframe -->
    <div class="game-wrapper">
      <iframe
        :id="gameFrameId"
        :src="gameUrl"
        width="100%"
        height="600"
        @load="handleGameLoad"
        class="game-frame"
        title="Mahjong Game"
      />
    </div>

    <!-- 调试面板 -->
    <div class="debug-panel" v-if="showDebug">
      <h3>调试信息</h3>
      <div class="debug-info">
        <div>游戏就绪: {{ isGameReady ? '✅' : '⏳' }}</div>
        <div>同步状态: {{ syncStatus }}</div>
        <div>当前语言: {{ currentLanguage }}</div>
        <div>选中语言: {{ selectedLanguage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMahjongCommunication } from '@/composables/useMahjongCommunication';

interface Props {
  gameUrl: string;
  initialLanguage?: string;
  showDebug?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  initialLanguage: 'en',
  showDebug: false
});

const gameFrameId = 'mahjongGameFrame';
const selectedLanguage = ref(props.initialLanguage);

const {
  currentLanguage,
  isGameReady,
  syncStatus,
  sendLanguageToGame,
  requestGameLanguage,
  setIsGameReady
} = useMahjongCommunication(gameFrameId);

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'eu', name: 'Euskara', flag: '🏴' },
  { code: 'jp', name: '日本語', flag: '🇯🇵' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

const statusClass = computed(() => {
  switch (syncStatus.value) {
    case 'loading': return 'status-loading';
    case 'ready': return 'status-ready';
    case 'syncing': return 'status-syncing';
    case 'synced': return 'status-synced';
    case 'error': return 'status-error';
    default: return '';
  }
});

const statusText = computed(() => {
  switch (syncStatus.value) {
    case 'loading': return '加载中...';
    case 'ready': return '就绪';
    case 'syncing': return '同步中...';
    case 'synced': return '已同步';
    case 'error': return '同步失败';
    default: return '未知状态';
  }
});

const handleGameLoad = () => {
  console.log('🎮 游戏iframe加载完成');
  setIsGameReady(true);
  
  setTimeout(() => {
    requestGameLanguage();
  }, 1000);
};

const handleLanguageChange = () => {
  sendLanguageToGame(selectedLanguage.value);
};

// 监听游戏语言变化，同步到选择器
watch(currentLanguage, (newLanguage) => {
  if (newLanguage !== selectedLanguage.value) {
    selectedLanguage.value = newLanguage;
  }
});
</script>

<style scoped>
.mahjong-game-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.control-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.language-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.language-select {
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.language-select.status-loading {
  border-color: #f6ad55;
}

.language-select.status-ready {
  border-color: #48bb78;
}

.language-select.status-syncing {
  border-color: #4299e1;
}

.language-select.status-synced {
  border-color: #38a169;
}

.language-select.status-error {
  border-color: #f56565;
}

.status-indicator {
  display: flex;
  gap: 12px;
  align-items: center;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-loading { background: #fef5e7; color: #f39c12; }
.status-ready { background: #e8f8f5; color: #27ae60; }
.status-syncing { background: #e3f2fd; color: #2196f3; }
.status-synced { background: #e8f8f5; color: #229954; }
.status-error { background: #ffeaea; color: #e74c3c; }

.current-lang {
  font-size: 14px;
  color: #666;
}

.game-wrapper {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.game-frame {
  border: none;
  width: 100%;
  height: 600px;
}

.debug-panel {
  margin-top: 20px;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.debug-panel h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #007bff;
}

.debug-info {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .language-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .game-frame {
    height: 400px;
  }
}
</style>
```

### 🅰️ Angular 15+ Signals

**1. 创建服务**

```typescript
// services/mahjong-communication.service.ts
import { Injectable, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface MahjongLanguageMessage {
  type: 'MAHJONG_LANGUAGE_CHANGE';
  payload: {
    language: string;
    source: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MahjongCommunicationService {
  private currentLanguage = signal<string>('en');
  private isGameReady = signal<boolean>(false);
  private syncStatus = signal<'loading' | 'ready' | 'syncing' | 'synced' | 'error'>('loading');

  // 公共signals
  readonly currentLanguageSig = this.currentLanguage.asReadonly();
  readonly isGameReadySig = this.isGameReady.asReadonly();
  readonly syncStatusSig = this.syncStatus.asReadonly();

  // 计算属性
  readonly statusText = computed(() => {
    switch (this.syncStatus()) {
      case 'loading': return '加载中...';
      case 'ready': return '就绪';
      case 'syncing': return '同步中...';
      case 'synced': return '已同步';
      case 'error': return '同步失败';
      default: return '未知状态';
    }
  });

  private gameFrameId: string | null = null;

  constructor(private destroyRef: DestroyRef) {
    this.initializeMessageListener();
  }

  initialize(gameFrameId: string): void {
    this.gameFrameId = gameFrameId;
  }

  sendLanguageToGame(language: string): void {
    if (!this.gameFrameId) return;

    const gameFrame = document.getElementById(this.gameFrameId) as HTMLIFrameElement;
    if (!gameFrame?.contentWindow) {
      console.warn('⚠️ 游戏iframe未找到或未加载完成');
      this.syncStatus.set('error');
      return;
    }

    const message: MahjongLanguageMessage = {
      type: 'MAHJONG_LANGUAGE_CHANGE',
      payload: {
        language,
        source: 'angular-app'
      }
    };

    try {
      gameFrame.contentWindow.postMessage(message, '*');
      this.syncStatus.set('syncing');
      console.log(`📤 语言消息已发送到游戏: ${language}`);
    } catch (error) {
      this.syncStatus.set('error');
      console.error('❌ 发送语言消息失败:', error);
    }
  }

  requestGameLanguage(): void {
    if (!this.gameFrameId) return;

    const gameFrame = document.getElementById(this.gameFrameId) as HTMLIFrameElement;
    if (!gameFrame?.contentWindow) return;

    const message = {
      type: 'MAHJONG_LANGUAGE_REQUEST',
      payload: {
        source: 'angular-app'
      }
    };

    try {
      gameFrame.contentWindow.postMessage(message, '*');
      console.log('📤 语言请求已发送到游戏');
    } catch (error) {
      console.error('❌ 发送语言请求失败:', error);
    }
  }

  setGameReady(ready: boolean): void {
    this.isGameReady.set(ready);
    if (ready) {
      this.syncStatus.set('ready');
    }
  }

  private initializeMessageListener(): void {
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent): void {
    if (!event.data || typeof event.data !== 'object') return;

    const message = event.data;

    switch (message.type) {
      case 'MAHJONG_LANGUAGE_CHANGE':
        const { language, source } = message.payload;
        console.log(`📥 收到游戏语言变化: ${language} (来源: ${source})`);
        
        if (source === 'mahjong-game' || source === 'internal') {
          this.currentLanguage.set(language);
          this.syncStatus.set('synced');
        }
        break;

      case 'MAHJONG_LANGUAGE_REQUEST':
        console.log('📥 收到游戏的语言请求');
        this.sendLanguageToGame(this.currentLanguage());
        break;
    }
  }
}
```

**2. Angular组件**

```typescript
// components/mahjong-game/mahjong-game.component.ts
import { Component, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MahjongCommunicationService } from '../../services/mahjong-communication.service';

@Component({
  selector: 'app-mahjong-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mahjong-game-container">
      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="language-controls">
          <label for="languageSelector">游戏语言：</label>
          <select 
            id="languageSelector"
            [(ngModel)]="selectedLanguage"
            (ngModelChange)="handleLanguageChange()"
            [class]="statusClass()"
          >
            <option *ngFor="let lang of languages" [value]="lang.code">
              {{ lang.flag }} {{ lang.name }}
            </option>
          </select>
          
          <div class="status-indicator">
            <span [class]="['status', statusClass()]">{{ communicationService.statusText() }}</span>
            <span class="current-lang">当前: {{ communicationService.currentLanguageSig() }}</span>
          </div>
        </div>
      </div>

      <!-- 游戏iframe -->
      <div class="game-wrapper">
        <iframe
          [id]="gameFrameId"
          [src]="gameUrl"
          width="100%"
          height="600"
          (load)="handleGameLoad()"
          class="game-frame"
          title="Mahjong Game">
        </iframe>
      </div>

      <!-- 调试面板 -->
      <div class="debug-panel" *ngIf="showDebug">
        <h3>调试信息</h3>
        <div class="debug-info">
          <div>游戏就绪: {{ communicationService.isGameReadySig() ? '✅' : '⏳' }}</div>
          <div>同步状态: {{ communicationService.syncStatusSig() }}</div>
          <div>当前语言: {{ communicationService.currentLanguageSig() }}</div>
          <div>选中语言: {{ selectedLanguage }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* CSS样式与Vue组件类似 */
  `]
})
export class MahjongGameComponent implements OnInit {
  readonly gameFrameId = 'mahjongGameFrame';
  readonly gameUrl = 'https://your-domain.com/mahjong/';
  selectedLanguage = 'en';
  showDebug = false;

  readonly languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'русский', flag: '🇷🇺' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'eu', name: 'Euskara', flag: '🏴' },
    { code: 'jp', name: '日本語', flag: '🇯🇵' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  readonly statusClass = computed(() => {
    const status = this.communicationService.syncStatusSig();
    switch (status()) {
      case 'loading': return 'status-loading';
      case 'ready': return 'status-ready';
      case 'syncing': return 'status-syncing';
      case 'synced': return 'status-synced';
      case 'error': return 'status-error';
      default: return '';
    }
  });

  constructor(public communicationService: MahjongCommunicationService) {
    // 使用effect监听语言变化
    effect(() => {
      const gameLanguage = this.communicationService.currentLanguageSig();
      if (gameLanguage() !== this.selectedLanguage) {
        this.selectedLanguage = gameLanguage();
      }
    });
  }

  ngOnInit(): void {
    this.communicationService.initialize(this.gameFrameId);
  }

  handleGameLoad(): void {
    console.log('🎮 游戏iframe加载完成');
    this.communicationService.setGameReady(true);
    
    setTimeout(() => {
      this.communicationService.requestGameLanguage();
    }, 1000);
  }

  handleLanguageChange(): void {
    this.communicationService.sendLanguageToGame(this.selectedLanguage);
  }
}
```

### 🚀 Svelte 5

```typescript
// lib/mahjongCommunication.ts
import { writable, derived } from 'svelte/store';

interface MahjongLanguageMessage {
  type: 'MAHJONG_LANGUAGE_CHANGE';
  payload: {
    language: string;
    source: string;
  };
}

function createMahjongCommunication(gameFrameId: string) {
  const currentLanguage = writable<string>('en');
  const isGameReady = writable<boolean>(false);
  const syncStatus = writable<'loading' | 'ready' | 'syncing' | 'synced' | 'error'>('loading');

  const statusText = derived(syncStatus, $status => {
    switch ($status) {
      case 'loading': return '加载中...';
      case 'ready': return '就绪';
      case 'syncing': return '同步中...';
      case 'synced': return '已同步';
      case 'error': return '同步失败';
      default: return '未知状态';
    }
  });

  const sendLanguageToGame = (language: string) => {
    const gameFrame = document.getElementById(gameFrameId) as HTMLIFrameElement;
    if (!gameFrame?.contentWindow) {
      console.warn('⚠️ 游戏iframe未找到或未加载完成');
      syncStatus.set('error');
      return;
    }

    const message: MahjongLanguageMessage = {
      type: 'MAHJONG_LANGUAGE_CHANGE',
      payload: {
        language,
        source: 'svelte-app'
      }
    };

    try {
      gameFrame.contentWindow.postMessage(message, '*');
      syncStatus.set('syncing');
      console.log(`📤 语言消息已发送到游戏: ${language}`);
    } catch (error) {
      syncStatus.set('error');
      console.error('❌ 发送语言消息失败:', error);
    }
  };

  const handleMessage = (event: MessageEvent) => {
    if (!event.data || typeof event.data !== 'object') return;

    const message = event.data;

    switch (message.type) {
      case 'MAHJONG_LANGUAGE_CHANGE':
        const { language, source } = message.payload;
        console.log(`📥 收到游戏语言变化: ${language} (来源: ${source})`);
        
        if (source === 'mahjong-game' || source === 'internal') {
          currentLanguage.set(language);
          syncStatus.set('synced');
        }
        break;

      case 'MAHJONG_LANGUAGE_REQUEST':
        console.log('📥 收到游戏的语言请求');
        sendLanguageToGame(get(currentLanguage));
        break;
    }
  };

  // 初始化监听器
  if (typeof window !== 'undefined') {
    window.addEventListener('message', handleMessage);
    
    // 清理函数
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }

  return {
    currentLanguage,
    isGameReady,
    syncStatus,
    statusText,
    sendLanguageToGame,
    setIsGameReady: (ready: boolean) => isGameReady.set(ready)
  };
}

export { createMahjongCommunication };
```

```svelte
<!-- components/MahjongGame.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createMahjongCommunication } from '$lib/mahjongCommunication';
  import { get } from 'svelte/store';

  export let gameUrl = 'https://your-domain.com/mahjong/';
  export let initialLanguage = 'en';
  export let showDebug = false;

  const gameFrameId = 'mahjongGameFrame';
  const communication = createMahjongCommunication(gameFrameId);

  let selectedLanguage = initialLanguage;
  let gameFrame: HTMLIFrameElement;

  $: statusClass = `status-${$communication.syncStatus}`;

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'русский', flag: '🇷🇺' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'eu', name: 'Euskara', flag: '🏴' },
    { code: 'jp', name: '日本語', flag: '🇯🇵' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const handleGameLoad = () => {
    console.log('🎮 游戏iframe加载完成');
    communication.setIsGameReady(true);
    
    setTimeout(() => {
      const requestMessage = {
        type: 'MAHJONG_LANGUAGE_REQUEST',
        payload: { source: 'svelte-app' }
      };
      gameFrame.contentWindow?.postMessage(requestMessage, '*');
    }, 1000);
  };

  const handleLanguageChange = () => {
    communication.sendLanguageToGame(selectedLanguage);
  };

  // 监听游戏语言变化
  $: if ($communication.currentLanguage !== selectedLanguage) {
    selectedLanguage = $communication.currentLanguage;
  }

  onMount(() => {
    gameFrame = document.getElementById(gameFrameId) as HTMLIFrameElement;
  });
</script>

<div class="mahjong-game-container">
  <!-- 控制面板 -->
  <div class="control-panel">
    <div class="language-controls">
      <label for="languageSelector">游戏语言：</label>
      <select 
        id="languageSelector"
        bind:value={selectedLanguage}
        on:change={handleLanguageChange}
        class="language-select {statusClass}"
      >
        {#each languages as lang}
          <option value={lang.code}>{lang.flag} {lang.name}</option>
        {/each}
      </select>
      
      <div class="status-indicator">
        <span class="status {statusClass}">{$communication.statusText}</span>
        <span class="current-lang">当前: {$communication.currentLanguage}</span>
      </div>
    </div>
  </div>

  <!-- 游戏iframe -->
  <div class="game-wrapper">
    <iframe
      id={gameFrameId}
      {src}
      width="100%"
      height="600"
      on:load={handleGameLoad}
      class="game-frame"
      title="Mahjong Game"
    />
  </div>

  <!-- 调试面板 -->
  {#if showDebug}
    <div class="debug-panel">
      <h3>调试信息</h3>
      <div class="debug-info">
        <div>游戏就绪: {$communication.isGameReady ? '✅' : '⏳'}</div>
        <div>同步状态: {$communication.syncStatus}</div>
        <div>当前语言: {$communication.currentLanguage}</div>
        <div>选中语言: {selectedLanguage}</div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* 样式与其他框架类似 */
</style>
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

## 🔒 安全性配置

### 🛡️ 域名白名单验证

**1. 基础域名验证**

```javascript
// 配置允许的域名列表
const ALLOWED_ORIGINS = [
  'https://your-game-domain.com',
  'https://staging-game-domain.com',
  'https://localhost:3000', // 开发环境
  'https://127.0.0.1:3000'  // 本地测试
];

function isOriginAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.some(allowedOrigin => {
    // 支持通配符匹配
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(origin);
    }
    return origin === allowedOrigin;
  });
}

// 在消息处理器中使用
function handleMessage(event: MessageEvent) {
  // 验证消息来源
  if (!isOriginAllowed(event.origin)) {
    console.warn('🚫 拒绝来自未知域名的消息:', event.origin);
    return;
  }
  
  // 处理消息...
}
```

**2. Next.js安全配置**

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://your-game-domain.com;",
              "style-src 'self' 'unsafe-inline';",
              "img-src 'self' data: https:;",
              "connect-src 'self' https://your-game-domain.com;",
              "frame-src 'self' https://your-game-domain.com;",
              "frame-ancestors 'self' https://your-trusted-domains.com;"
            ].join(' ')
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://your-game-domain.com'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  // 生产环境安全优化
  productionBrowserSourceMaps: false,
  compress: true
};

module.exports = nextConfig;
```

**3. Express.js安全中间件**

```javascript
// server.js 或 middleware/security.js
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

// 配置安全头部
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameSrc: ["'self'", "https://your-game-domain.com"],
      frameAncestors: ["'self'", "https://your-trusted-domains.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://your-game-domain.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://your-game-domain.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 100个请求
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### 🔐 消息加密和签名

**1. 消息签名验证**

```typescript
// utils/messageSecurity.ts
import crypto from 'crypto';

const SECRET_KEY = process.env.MAHJONG_SECRET_KEY || 'your-secret-key';

interface SecureMessage {
  data: any;
  signature: string;
  timestamp: number;
}

// 签名消息
export function signMessage(data: any): SecureMessage {
  const messageString = JSON.stringify(data);
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${messageString}:${timestamp}`)
    .digest('hex');

  return {
    data,
    signature,
    timestamp
  };
}

// 验证消息签名
export function verifyMessage(secureMessage: SecureMessage): boolean {
  try {
    const { data, signature, timestamp } = secureMessage;
    
    // 检查时间戳（防止重放攻击）
    const now = Date.now();
    if (Math.abs(now - timestamp) > 5 * 60 * 1000) { // 5分钟有效期
      console.warn('⏰ 消息已过期');
      return false;
    }

    const messageString = JSON.stringify(data);
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(`${messageString}:${timestamp}`)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('❌ 消息验证失败:', error);
    return false;
  }
}

// 在iframe通信中使用
export function sendSecureMessage(gameFrame: HTMLIFrameElement, message: any): void {
  const secureMessage = signMessage(message);
  gameFrame.contentWindow?.postMessage(secureMessage, 'https://your-game-domain.com');
}

export function handleSecureMessage(event: MessageEvent): any | null {
  if (!verifyMessage(event.data)) {
    console.warn('🚫 收到无效签名消息');
    return null;
  }
  
  return event.data.data;
}
```

### 🔍 XSS和CSRF防护

**1. 输入验证和清理**

```typescript
// utils/sanitization.ts
import DOMPurify from 'dompurify';

export function sanitizeLanguageCode(language: string): string {
  // 只允许字母和连字符，最大长度10
  const sanitized = language.toLowerCase().replace(/[^a-z-]/g, '');
  return sanitized.slice(0, 10);
}

export function validateLanguage(language: string): boolean {
  const allowedLanguages = ['en', 'zh', 'de', 'nl', 'pt', 'ru', 'es', 'eu', 'jp', 'fr'];
  return allowedLanguages.includes(sanitizeLanguageCode(language));
}

export function sanitizeSource(source: string): string {
  // 只允许字母、数字、连字符和下划线
  return source.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 50);
}

// 在消息处理中使用
function handleMessage(event: MessageEvent) {
  const { language, source } = event.data.payload || {};
  
  // 验证和清理输入
  if (!validateLanguage(language)) {
    console.warn('🚫 无效的语言代码:', language);
    return;
  }
  
  const cleanSource = sanitizeSource(source || '');
  
  // 处理验证过的消息...
}
```

### 🌐 环境配置

**1. 开发环境配置**

```javascript
// .env.development
NEXT_PUBLIC_MAHJONG_URL=http://localhost:4200
MAHJONG_SECRET_KEY=dev-secret-key
ENCRYPTION_KEY=dev-encryption-key
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

// 开发环境禁用某些安全检查
NEXT_PUBLIC_DEBUG_MODE=true
```

**2. 生产环境配置**

```javascript
// .env.production
NEXT_PUBLIC_MAHJONG_URL=https://your-game-domain.com
MAHJONG_SECRET_KEY=super-secure-production-key
ENCRYPTION_KEY=production-encryption-key-with-32-chars
ALLOWED_ORIGINS=https://your-domain.com,https://admin.your-domain.com

// 生产环境启用所有安全检查
NEXT_PUBLIC_DEBUG_MODE=false
NODE_ENV=production
```

### 🚨 安全监控

**1. 安全事件记录**

```typescript
// utils/securityLogger.ts
interface SecurityEvent {
  type: 'unauthorized_origin' | 'invalid_signature' | 'xss_attempt' | 'csrf_failure';
  timestamp: Date;
  details: any;
  ip?: string;
  userAgent?: string;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  
  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };
    
    this.events.push(securityEvent);
    console.warn('🚨 安全事件:', securityEvent);
    
    // 发送到安全监控系统
    this.sendToSecurityMonitor(securityEvent);
  }
  
  private sendToSecurityMonitor(event: SecurityEvent): void {
    // 集成到你选择的监控服务
    if (process.env.NODE_ENV === 'production') {
      // Sentry, Datadog, 或自定义监控
    }
  }
}

export const securityLogger = new SecurityLogger();

// 在消息处理中使用
function handleMessage(event: MessageEvent) {
  if (!isOriginAllowed(event.origin)) {
    securityLogger.log({
      type: 'unauthorized_origin',
      details: { origin: event.origin, data: event.data }
    });
    return;
  }
}
```

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

## 🛠️ 开发调试工具

### 🔍 消息监控工具

**1. 开发环境消息调试器**

```typescript
// utils/messageDebugger.ts
interface DebugMessage {
  timestamp: Date;
  direction: 'sent' | 'received';
  type: string;
  payload: any;
  origin?: string;
  error?: string;
}

class MessageDebugger {
  private messages: DebugMessage[] = [];
  private isEnabled = false;
  private maxMessages = 100;

  enable(): void {
    this.isEnabled = true;
    console.log('🔧 Mahjong消息调试器已启用');
    this.createDebugPanel();
  }

  disable(): void {
    this.isEnabled = false;
    console.log('🔧 Mahjong消息调试器已禁用');
  }

  logSentMessage(type: string, payload: any): void {
    if (!this.isEnabled) return;
    
    const message: DebugMessage = {
      timestamp: new Date(),
      direction: 'sent',
      type,
      payload,
      error: undefined
    };
    
    this.addMessage(message);
  }

  logReceivedMessage(event: MessageEvent): void {
    if (!this.isEnabled) return;
    
    const message: DebugMessage = {
      timestamp: new Date(),
      direction: 'received',
      type: event.data?.type || 'unknown',
      payload: event.data,
      origin: event.origin,
      error: undefined
    };
    
    this.addMessage(message);
  }

  logError(type: string, error: Error | string): void {
    if (!this.isEnabled) return;
    
    const message: DebugMessage = {
      timestamp: new Date(),
      direction: 'received',
      type,
      payload: null,
      error: error instanceof Error ? error.message : error
    };
    
    this.addMessage(message);
  }

  private addMessage(message: DebugMessage): void {
    this.messages.push(message);
    
    // 限制消息数量
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
    
    console.debug('🔧 Mahjong消息:', message);
    this.updateDebugPanel();
  }

  getMessages(): DebugMessage[] {
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
    this.updateDebugPanel();
  }

  export(): string {
    return JSON.stringify(this.messages, null, 2);
  }

  private createDebugPanel(): void {
    if (typeof document === 'undefined') return;

    // 检查是否已存在调试面板
    if (document.getElementById('mahjong-debug-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'mahjong-debug-panel';
    panel.innerHTML = `
      <div style="position: fixed; top: 10px; right: 10px; width: 400px; max-height: 500px; 
                  background: #1a1a1a; color: #fff; border-radius: 8px; z-index: 10000; 
                  font-family: monospace; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
        <div style="padding: 10px; background: #333; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
          <span>Mahjong消息调试器</span>
          <button onclick="this.closest('#mahjong-debug-panel').remove()" style="background: #ff4444; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer;">✕</button>
        </div>
        <div style="padding: 10px; max-height: 400px; overflow-y: auto;" id="debug-messages">
          <div style="color: #888;">等待消息...</div>
        </div>
        <div style="padding: 10px; background: #333; border-radius: 0 0 8px 8px; display: flex; gap: 8px;">
          <button onclick="window.mahjongDebugger.clear()" style="background: #555; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">清空</button>
          <button onclick="window.mahjongDebugger.exportToClipboard()" style="background: #555; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">导出</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    window.mahjongDebugger = this;
  }

  private updateDebugPanel(): void {
    const messagesContainer = document.getElementById('debug-messages');
    if (!messagesContainer) return;

    const messagesHtml = this.messages.slice(-20).reverse().map(msg => {
      const time = msg.timestamp.toLocaleTimeString();
      const color = msg.direction === 'sent' ? '#4CAF50' : '#2196F3';
      const errorColor = msg.error ? '#ff4444' : '';
      
      return `
        <div style="margin-bottom: 8px; padding: 4px; background: #2a2a2a; border-radius: 4px; border-left: 3px solid ${color};">
          <div style="color: ${color}; font-weight: bold;">${msg.direction === 'sent' ? '↑' : '↓'} ${msg.type} (${time})</div>
          ${msg.origin ? `<div style="color: #888;">来源: ${msg.origin}</div>` : ''}
          ${msg.payload ? `<div style="color: #ccc; font-size: 11px;">${JSON.stringify(msg.payload)}</div>` : ''}
          ${msg.error ? `<div style="color: ${errorColor};">❌ ${msg.error}</div>` : ''}
        </div>
      `;
    }).join('');

    messagesContainer.innerHTML = messagesHtml || '<div style="color: #888;">暂无消息</div>';
  }

  exportToClipboard(): void {
    navigator.clipboard.writeText(this.export()).then(() => {
      alert('调试信息已复制到剪贴板');
    });
  }
}

// 全局实例
export const messageDebugger = new MessageDebugger();

// 开发环境自动启用
if (process.env.NODE_ENV === 'development') {
  messageDebugger.enable();
}

// 全局访问
declare global {
  interface Window {
    mahjongDebugger?: MessageDebugger;
  }
}
```

**2. Vue DevTools集成**

```typescript
// plugins/mahjongDevTools.ts
import { App } from 'vue';

export function installMahjongDevTools(app: App) {
  if (process.env.NODE_ENV === 'development') {
    // 添加到Vue DevTools
    app.config.globalProperties.$mahjongDebug = {
      messages: [],
      isConnected: false,
      
      logMessage(message: any) {
        this.messages.push({
          timestamp: new Date(),
          ...message
        });
      },
      
      getRecentMessages(count = 10) {
        return this.messages.slice(-count);
      },
      
      clear() {
        this.messages = [];
      }
    };

    // 在控制台添加调试命令
    console.log('🔧 Mahjong开发工具已安装');
    console.log('使用 $mahjongDebug 访问调试功能');
  }
}
```

**3. React DevTools扩展**

```typescript
// hooks/useMahjongDevTools.ts
import { useEffect } from 'react';

export const useMahjongDevTools = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // 扩展React DevTools
      (window as any).__MAHJONG_DEVTOOLS__ = {
        messages: [],
        stats: {
          sent: 0,
          received: 0,
          errors: 0
        },
        
        log(type: 'sent' | 'received' | 'error', data: any) {
          this.messages.push({
            timestamp: Date.now(),
            type,
            data
          });
          
          this.stats[type === 'error' ? 'errors' : type]++;
          
          // 在DevTools中显示
          if (type === 'error') {
            console.error('🎮 Mahjong错误:', data);
          } else {
            console.log(`🎮 Mahjong ${type}:`, data);
          }
        },
        
        clear() {
          this.messages = [];
          this.stats = { sent: 0, received: 0, errors: 0 };
        }
      };

      console.log('🔧 Mahjong React DevTools已启用');
      console.log('使用 __MAHJONG_DEVTOOLS__ 访问调试功能');
    }
  }, []);
};
```

### 🧪 测试工具

**1. 单元测试工具**

```typescript
// utils/testUtils.ts
export class MahjongTestHelper {
  private testMessages: any[] = [];
  private mockHandlers: Map<string, Function[]> = new Map();

  // 模拟发送消息
  simulateMessage(message: any, origin = 'https://test-domain.com'): void {
    const event = new MessageEvent('message', {
      data: message,
      origin: origin,
      source: window
    });
    
    window.dispatchEvent(event);
    this.testMessages.push({ message, origin, timestamp: Date.now() });
  }

  // 模拟语言切换消息
  simulateLanguageChange(language: string, source = 'test'): void {
    this.simulateMessage({
      type: 'MAHJONG_LANGUAGE_CHANGE',
      payload: { language, source }
    });
  }

  // 模拟语言请求消息
  simulateLanguageRequest(source = 'test'): void {
    this.simulateMessage({
      type: 'MAHJONG_LANGUAGE_REQUEST',
      payload: { source }
    });
  }

  // 等待消息
  async waitForMessage(type: string, timeout = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`等待${type}消息超时`));
      }, timeout);

      const handler = (event: MessageEvent) => {
        if (event.data?.type === type) {
          clearTimeout(timer);
          window.removeEventListener('message', handler);
          resolve(event.data);
        }
      };

      window.addEventListener('message', handler);
    });
  }

  // 清除测试数据
  clear(): void {
    this.testMessages = [];
    this.mockHandlers.clear();
  }

  // 获取测试历史
  getTestHistory(): any[] {
    return [...this.testMessages];
  }
}

// 测试工具实例
export const mahjongTestHelper = new MahjongTestHelper();
```

**2. Jest测试示例**

```typescript
// __tests__/mahjongCommunication.test.ts
import { renderHook, act } from '@testing-library/react';
import { useMahjongCommunication } from '../hooks/useMahjongCommunication';
import { mahjongTestHelper } from '../utils/testUtils';

describe('useMahjongCommunication', () => {
  beforeEach(() => {
    mahjongTestHelper.clear();
  });

  test('应该正确接收语言变化消息', async () => {
    const { result } = renderHook(() => useMahjongCommunication('test-frame'));

    // 模拟发送语言变化消息
    act(() => {
      mahjongTestHelper.simulateLanguageChange('zh', 'mahjong-game');
    });

    expect(result.current.currentLanguage).toBe('zh');
    expect(result.current.syncStatus).toBe('synced');
  });

  test('应该正确发送语言变化消息', () => {
    const { result } = renderHook(() => useMahjongCommunication('test-frame'));

    // 创建mock iframe
    const mockIframe = {
      contentWindow: {
        postMessage: jest.fn()
      }
    };
    
    document.getElementById = jest.fn().mockReturnValue(mockIframe);

    act(() => {
      result.current.sendLanguageToGame('en');
    });

    expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
      {
        type: 'MAHJONG_LANGUAGE_CHANGE',
        payload: { language: 'en', source: 'nextjs-website' }
      },
      '*'
    );
  });
});
```

## 🚀 生产环境最佳实践

### 📊 性能优化

**1. 消息节流和防抖**

```typescript
// utils/performance.ts
export function createThrottledMessageHandler(handler: Function, delay = 100) {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout;

  return function(...args: any[]) {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      handler.apply(this, args);
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        handler.apply(this, args);
      }, delay - (now - lastCall));
    }
  };
}

export function createDebouncedMessageSender(delay = 300) {
  let timeoutId: NodeJS.Timeout;
  let pendingMessage: any;

  return function(message: any, gameFrame: HTMLIFrameElement) {
    pendingMessage = message;
    
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (gameFrame?.contentWindow && pendingMessage) {
        gameFrame.contentWindow.postMessage(pendingMessage, '*');
        pendingMessage = null;
      }
    }, delay);
  };
}

// 使用示例
const throttledHandler = createThrottledMessageHandler((event: MessageEvent) => {
  // 处理消息逻辑
}, 100);

const debouncedSender = createDebouncedMessageSender(300);
```

**2. 内存泄漏防护**

```typescript
// utils/memoryManager.ts
export class MemoryManager {
  private static instance: MemoryManager;
  private cleanupTasks: Map<string, () => void> = new Map();

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  registerCleanup(id: string, cleanup: () => void): void {
    // 如果已存在，先清理
    if (this.cleanupTasks.has(id)) {
      this.cleanupTasks.get(id)!();
    }
    
    this.cleanupTasks.set(id, cleanup);
  }

  unregisterCleanup(id: string): void {
    const cleanup = this.cleanupTasks.get(id);
    if (cleanup) {
      cleanup();
      this.cleanupTasks.delete(id);
    }
  }

  cleanup(): void {
    this.cleanupTasks.forEach(cleanup => cleanup());
    this.cleanupTasks.clear();
  }

  // 获取内存使用情况
  getMemoryStats(): any {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }
}

// 在React组件中使用
export const useMemoryCleanup = (componentId: string) => {
  useEffect(() => {
    return () => {
      MemoryManager.getInstance().unregisterCleanup(componentId);
    };
  }, [componentId]);
};
```

**3. 错误边界和恢复**

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MahjongErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🎮 Mahjong组件错误:', error, errorInfo);
    
    // 发送错误到监控系统
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          <h3>🎮 游戏组件暂时不可用</h3>
          <p>请刷新页面重试</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{ padding: '8px 16px', marginTop: '10px' }}
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 📈 监控和分析

**1. 性能监控**

```typescript
// utils/performanceMonitor.ts
export interface PerformanceMetrics {
  messageCount: number;
  averageResponseTime: number;
  errorRate: number;
  lastActivity: Date;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    messageCount: 0,
    averageResponseTime: 0,
    errorRate: 0,
    lastActivity: new Date()
  };
  
  private responseTimes: number[] = [];
  private errorCount = 0;
  private maxResponseTimes = 100;

  recordMessage(type: 'sent' | 'received' | 'error'): void {
    this.metrics.messageCount++;
    this.metrics.lastActivity = new Date();
    
    if (type === 'error') {
      this.errorCount++;
    }
    
    this.updateErrorRate();
  }

  recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    
    // 限制数组大小
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes = this.responseTimes.slice(-this.maxResponseTimes);
    }
    
    this.updateAverageResponseTime();
  }

  private updateAverageResponseTime(): void {
    if (this.responseTimes.length === 0) {
      this.metrics.averageResponseTime = 0;
      return;
    }
    
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageResponseTime = sum / this.responseTimes.length;
  }

  private updateErrorRate(): void {
    if (this.metrics.messageCount === 0) {
      this.metrics.errorRate = 0;
      return;
    }
    
    this.metrics.errorRate = (this.errorCount / this.metrics.messageCount) * 100;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      messageCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastActivity: new Date()
    };
    this.responseTimes = [];
    this.errorCount = 0;
  }

  // 发送指标到监控系统
  sendMetrics(): void {
    if (process.env.NODE_ENV === 'production') {
      // 发送到analytics服务
      // analytics.track('mahjong_performance', this.metrics);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

**2. A/B测试支持**

```typescript
// utils/abTesting.ts
export interface ABTestConfig {
  testName: string;
  variants: string[];
  traffic: number[]; // 流量分配，总和应为100
}

export class ABTestManager {
  private static instance: ABTestManager;
  private tests: Map<string, ABTestConfig> = new Map();
  private assignments: Map<string, string> = new Map();

  static getInstance(): ABTestManager {
    if (!ABTestManager.instance) {
      ABTestManager.instance = new ABTestManager();
    }
    return ABTestManager.instance;
  }

  registerTest(config: ABTestConfig): void {
    this.tests.set(config.testName, config);
  }

  getVariant(testName: string, userId?: string): string {
    // 检查是否已有分配
    const cacheKey = `${testName}-${userId || 'anonymous'}`;
    if (this.assignments.has(cacheKey)) {
      return this.assignments.get(cacheKey)!;
    }

    const test = this.tests.get(testName);
    if (!test) {
      return 'control';
    }

    // 简单的哈希分配
    const hash = this.simpleHash(userId || Math.random().toString());
    const percentage = hash % 100;
    
    let accumulated = 0;
    for (let i = 0; i < test.variants.length; i++) {
      accumulated += test.traffic[i];
      if (percentage < accumulated) {
        this.assignments.set(cacheKey, test.variants[i]);
        return test.variants[i];
      }
    }

    return test.variants[0]; // 默认第一个变体
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  // 记录转化事件
  trackConversion(testName: string, variant: string, conversionType: string): void {
    if (process.env.NODE_ENV === 'production') {
      // 发送到分析服务
      console.log(`🎯 A/B测试转化: ${testName} - ${variant} - ${conversionType}`);
    }
  }
}

export const abTestManager = ABTestManager.getInstance();
```

### 🔧 部署配置

**1. Docker生产配置**

```dockerfile
# Dockerfile.production
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

**2. Kubernetes配置**

```yaml
# k8s/mahjong-integration.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mahjong-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mahjong-frontend
  template:
    metadata:
      labels:
        app: mahjong-frontend
    spec:
      containers:
      - name: mahjong-frontend
        image: your-registry/mahjong-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MAHJONG_URL
          valueFrom:
            configMapKeyRef:
              name: mahjong-config
              key: game-url
        - name: MAHJONG_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: mahjong-secrets
              key: secret-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: mahjong-frontend-service
spec:
  selector:
    app: mahjong-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

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