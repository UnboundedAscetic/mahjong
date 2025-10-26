import { Injectable } from '@angular/core';

export interface LanguageMessage {
  type: 'MAHJONG_LANGUAGE_CHANGE';
  payload: {
    language: string;
    source?: string;
  };
}

export interface LanguageRequestMessage {
  type: 'MAHJONG_LANGUAGE_REQUEST';
  payload?: {
    source?: string;
  };
}

// Game completion message
export interface GameCompletedMessage {
  type: 'MAHJONG_GAME_COMPLETED';
  payload: {
    layoutName: string;
    layoutId: string;
    timeElapsed: number;
    movesCount: number;
    hintsUsed: number;
    undoCount: number;
    difficulty?: 'beginner' | 'intermediate' | 'expert';
    score?: number;
    comboMax?: number;
    perfectGame: boolean;
    timestamp: number;
  };
}

// Achievement unlocked message
export interface AchievementUnlockedMessage {
  type: 'MAHJONG_ACHIEVEMENT_UNLOCKED';
  payload: {
    achievementId: string;
    achievementName: string;
    achievementType: 'first_win' | 'speed_demon' | 'perfectionist' | 'marathon' | 'combo_master' | 'explorer';
    description: string;
    context: {
      layoutName?: string;
      timeElapsed?: number;
      movesCount?: number;
      value?: number;
      threshold?: number;
    };
    isNewAchievement: boolean;
    progress?: number;
    totalRequired?: number;
    timestamp: number;
  };
}

// High score message
export interface HighScoreMessage {
  type: 'MAHJONG_HIGH_SCORE';
  payload: {
    layoutName: string;
    layoutId: string;
    scoreType: 'time' | 'moves' | 'score';
    newValue: number;
    previousValue: number;
    improvement: number;
    context: {
      movesCount: number;
      hintsUsed: number;
      undoCount: number;
      perfectGame: boolean;
    };
    rank?: number;
    percentile?: number;
    timestamp: number;
  };
}

export type MahjongMessage = LanguageMessage | LanguageRequestMessage | GameCompletedMessage | AchievementUnlockedMessage | HighScoreMessage;

@Injectable({
  providedIn: 'root'
})
export class IframeCommunicationService {
  private readonly MESSAGE_TYPE = 'MAHJONG';
  private readonly LANGUAGE_CHANGE_TYPE = 'MAHJONG_LANGUAGE_CHANGE';
  private readonly LANGUAGE_REQUEST_TYPE = 'MAHJONG_LANGUAGE_REQUEST';
  private readonly GAME_COMPLETED_TYPE = 'MAHJONG_GAME_COMPLETED';
  private readonly ACHIEVEMENT_UNLOCKED_TYPE = 'MAHJONG_ACHIEVEMENT_UNLOCKED';
  private readonly HIGH_SCORE_TYPE = 'MAHJONG_HIGH_SCORE';
  
  private isIframe = false;
  private parentOrigin: string | null = null;
  private languageChangeCallback?: (language: string) => void;
  private debugMode = false;

  constructor() {
    this.detectIframeMode();
    this.initializeMessageListener();
  }

  /**
   * 检测是否在iframe中运行
   */
  private detectIframeMode(): void {
    this.isIframe = window.self !== window.top;
    if (this.isIframe) {
      try {
        // 尝试获取父窗口域名用于验证
        this.parentOrigin = window.parent.location.origin;
        this.log('Iframe模式检测成功，父窗口域名:', this.parentOrigin);
      } catch (error) {
        // 跨域情况下无法获取父窗口域名，但仍可通信
        this.parentOrigin = null;
        this.log('Iframe跨域模式检测成功');
      }
    } else {
      this.log('独立模式运行');
    }
  }

  /**
   * 初始化消息监听器
   */
  private initializeMessageListener(): void {
    if (!this.isIframe) {
      return;
    }

    window.addEventListener('message', this.handleMessage.bind(this));
    this.log('消息监听器已初始化');
  }

  /**
   * 处理来自父窗口的消息
   */
  private handleMessage(event: MessageEvent): void {
    // 安全性验证：只处理来自特定域名的消息（如果有设置）
    if (this.parentOrigin && event.origin !== this.parentOrigin) {
      this.log('忽略来自未知域名的消息:', event.origin);
      return;
    }

    const message = event.data as MahjongMessage;
    
    if (!this.isValidMessage(message)) {
      this.log('收到无效消息格式:', message);
      return;
    }

    this.log('收到消息:', message);

    switch (message.type) {
      case this.LANGUAGE_CHANGE_TYPE:
        this.handleLanguageChange(message as LanguageMessage);
        break;
      case this.LANGUAGE_REQUEST_TYPE:
        this.handleLanguageRequest(message as LanguageRequestMessage);
        break;
      case this.GAME_COMPLETED_TYPE:
      case this.ACHIEVEMENT_UNLOCKED_TYPE:
      case this.HIGH_SCORE_TYPE:
        // These are outgoing messages only - no handling needed for incoming
        this.log('Received outgoing message type (should not happen):', message.type);
        break;
    }
  }

  /**
   * 验证消息格式
   */
  private isValidMessage(message: any): message is MahjongMessage {
    return message && 
           typeof message === 'object' && 
           typeof message.type === 'string' &&
           (message.type === this.LANGUAGE_CHANGE_TYPE || 
            message.type === this.LANGUAGE_REQUEST_TYPE ||
            message.type === this.GAME_COMPLETED_TYPE ||
            message.type === this.ACHIEVEMENT_UNLOCKED_TYPE ||
            message.type === this.HIGH_SCORE_TYPE);
  }

  /**
   * 处理语言切换消息
   */
  private handleLanguageChange(message: LanguageMessage): void {
    const { language, source } = message.payload;
    
    if (typeof language === 'string' && this.languageChangeCallback) {
      this.log(`处理语言切换请求: ${language} (来源: ${source || '未知'})`);
      this.languageChangeCallback(language);
    } else {
      this.log('无效的语言切换消息:', message.payload);
    }
  }

  /**
   * 处理语言请求消息
   */
  private handleLanguageRequest(message: LanguageRequestMessage): void {
    this.log('收到语言请求，准备发送当前语言');
    // 当前语言会在AppService中处理，这里只是记录请求
  }

  /**
   * 设置语言变化回调函数
   */
  setLanguageChangeCallback(callback: (language: string) => void): void {
    this.languageChangeCallback = callback;
  }

  /**
   * 向父窗口发送语言变化通知
   */
  notifyLanguageChange(language: string, source: string = 'mahjong-game'): void {
    if (!this.isIframe) {
      return;
    }

    const message: LanguageMessage = {
      type: this.LANGUAGE_CHANGE_TYPE,
      payload: {
        language,
        source
      }
    };

    this.sendMessage(message);
  }

  /**
   * 向父窗口发送语言请求
   */
  requestLanguage(): void {
    if (!this.isIframe) {
      return;
    }

    const message: LanguageRequestMessage = {
      type: this.LANGUAGE_REQUEST_TYPE,
      payload: {
        source: 'mahjong-game'
      }
    };

    this.sendMessage(message);
  }

  /**
   * 发送游戏完成消息
   */
  sendGameCompleted(payload: GameCompletedMessage['payload']): void {
    if (!this.isIframe) {
      return;
    }

    const message: GameCompletedMessage = {
      type: this.GAME_COMPLETED_TYPE,
      payload
    };

    this.sendMessage(message);
  }

  /**
   * 发送成就解锁消息
   */
  sendAchievementUnlocked(payload: AchievementUnlockedMessage['payload']): void {
    if (!this.isIframe) {
      return;
    }

    const message: AchievementUnlockedMessage = {
      type: this.ACHIEVEMENT_UNLOCKED_TYPE,
      payload
    };

    this.sendMessage(message);
  }

  /**
   * 发送高分记录消息
   */
  sendHighScore(payload: HighScoreMessage['payload']): void {
    if (!this.isIframe) {
      return;
    }

    const message: HighScoreMessage = {
      type: this.HIGH_SCORE_TYPE,
      payload
    };

    this.sendMessage(message);
  }

  /**
   * 发送消息到父窗口
   */
  private sendMessage(message: MahjongMessage): void {
    try {
      window.parent.postMessage(message, this.parentOrigin || '*');
      this.log('消息已发送:', message);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  }

  /**
   * 检查是否在iframe中
   */
  isInIframe(): boolean {
    return this.isIframe;
  }

  /**
   * 设置调试模式
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * 日志输出
   */
  private log(...args: any[]): void {
    if (this.debugMode) {
      console.log('[IframeCommunication]', ...args);
    }
  }

  /**
   * 获取支持的协议信息（用于外部集成文档）
   */
  getMessageProtocol(): {
    languageChange: LanguageMessage;
    languageRequest: LanguageRequestMessage;
  } {
    return {
      languageChange: {
        type: this.LANGUAGE_CHANGE_TYPE,
        payload: {
          language: 'en|zh|de|nl|pt|ru|es|eu|jp|fr',
          source: 'external-app-name'
        }
      },
      languageRequest: {
        type: this.LANGUAGE_REQUEST_TYPE,
        payload: {
          source: 'mahjong-game'
        }
      }
    };
  }
}