// iframe加载性能优化服务
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IframePerformanceService {
  private loadingStartTime: number = 0;
  private performanceCallbacks: ((loadTime: number) => void)[] = [];

  constructor() {
    this.initializePerformanceTracking();
  }

  /**
   * 初始化性能追踪
   */
  private initializePerformanceTracking(): void {
    if (typeof window !== 'undefined') {
      this.loadingStartTime = performance.now();
      
      // 监听资源加载完成
      window.addEventListener('load', () => {
        this.reportLoadingPerformance();
      });
    }
  }

  /**
   * 注册性能回调
   */
  onLoadingComplete(callback: (loadTime: number) => void): void {
    this.performanceCallbacks.push(callback);
  }

  /**
   * 报告加载性能
   */
  private reportLoadingPerformance(): void {
    const loadTime = performance.now() - this.loadingStartTime;
    
    console.log(`[IframePerformance] 加载完成，耗时: ${loadTime.toFixed(2)}ms`);
    
    // 通知父窗口加载完成
    if (this.isInIframe()) {
      this.notifyParentWindow('iframe-loaded', {
        loadTime: Math.round(loadTime),
        timestamp: Date.now()
      });
    }

    // 执行回调
    this.performanceCallbacks.forEach(callback => callback(loadTime));
  }

  /**
   * 预加载关键资源
   */
  preloadCriticalResources(): void {
    if (typeof document === 'undefined') return;

    // 预加载语言文件
    const langFiles = ['en', 'zh'];
    langFiles.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `./assets/i18n/${lang}.json`;
      document.head.appendChild(link);
    });

    // 预加载关键图片
    const criticalImages = [
      './assets/logo2.png',
      './assets/app/favicon-logo.png'
    ];
    
    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  /**
   * 优化iframe加载策略
   */
  optimizeIframeLoading(): void {
    if (!this.isInIframe()) return;

    // 禁用不必要的动画以提升加载速度
    this.disableInitialAnimations();

    // 预加载资源
    this.preloadCriticalResources();

    // 通知父窗口开始加载
    this.notifyParentWindow('iframe-loading-start', {
      timestamp: Date.now()
    });
  }

  /**
   * 检查是否在iframe中
   */
  private isInIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  /**
   * 通知父窗口
   */
  private notifyParentWindow(event: string, data: any): void {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: event,
          source: 'mahjong-game',
          data: data
        }, '*');
      }
    } catch (e) {
      console.warn('[IframePerformance] 无法通知父窗口:', e);
    }
  }

  /**
   * 临时禁用初始动画
   */
  private disableInitialAnimations(): void {
    if (typeof document === 'undefined') return;

    // 临时禁用动画类
    const style = document.createElement('style');
    style.textContent = `
      .loading-animations-disabled * {
        animation: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);

    // 1秒后移除限制，恢复正常动画
    setTimeout(() => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
      document.body.classList.remove('loading-animations-disabled');
    }, 1000);
  }

  /**
   * 获取加载指标
   */
  getLoadingMetrics(): {
    domContentLoaded: number;
    loadComplete: number;
    resourceCount: number;
  } {
    if (typeof performance === 'undefined') {
      return { domContentLoaded: 0, loadComplete: 0, resourceCount: 0 };
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource');

    return {
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
      loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      resourceCount: resources.length
    };
  }
}