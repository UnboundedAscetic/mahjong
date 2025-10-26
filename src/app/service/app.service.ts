import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Game } from '../model/game';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../model/languages';
import { Settings } from '../model/settings';
import { LangAuto } from '../model/consts';
import { LocalstorageService } from './localstorage.service';
import { IframeCommunicationService } from './iframe-communication.service';
import { IframePerformanceService } from './iframe-performance.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppService {
	name: string = 'Mah Jong';
	game: Game;
	settings: Settings;
	storage = inject(LocalstorageService);
	translate = inject(TranslateService);
	iframeCommunication = inject(IframeCommunicationService);
	iframePerformance = inject(IframePerformanceService);

	constructor() {
		this.game = new Game(this.storage);
		this.settings = new Settings(this.storage);
		this.settings.load();
		
		// 初始化iframe通信
		this.initializeIframeCommunication();
		
		// 初始化成就系统
		this.initializeAchievementSystem();
		
		// 优化iframe加载性能
		this.iframePerformance.optimizeIframeLoading();
		
		this.setLang();
		this.game.init();
		this.game.sound.enabled = this.settings.sounds;
		this.game.music.enabled = this.settings.music;
	}

	setLang(language?: string): void {
		const targetLang = language || this.settings.lang;
		const userLang =
			(!targetLang || targetLang === LangAuto) ?
				(navigator.language.split('-')[0] || DEFAULT_LANGUAGE).toLowerCase() : // use navigator lang if available
				targetLang;
		if (Object.keys(LANGUAGES).includes(userLang)) {
			this.translate.use(userLang);
			this.onLanguageChanged(userLang);
		} else {
			this.translate.use(DEFAULT_LANGUAGE);
			this.onLanguageChanged(DEFAULT_LANGUAGE);
		}
	}

	/**
	 * 初始化iframe通信
	 */
	private initializeIframeCommunication(): void {
		if (this.iframeCommunication.isInIframe()) {
			// 设置语言变化回调
			this.iframeCommunication.setLanguageChangeCallback((language: string) => {
				this.changeLanguage(language, 'external-parent');
			});

			// 在开发模式下启用调试
			this.iframeCommunication.setDebugMode(!environment.production);

			// 延迟请求当前语言，确保组件已初始化
			setTimeout(() => {
				this.iframeCommunication.requestLanguage();
			}, 1000);
		}
	}

	/**
	 * 语言变化处理
	 */
	private onLanguageChanged(language: string): void {
		// 通知父窗口语言已变化
		if (this.iframeCommunication.isInIframe()) {
			this.iframeCommunication.notifyLanguageChange(language, 'mahjong-game');
		}
	}

	/**
	 * 初始化成就系统
	 */
	private initializeAchievementSystem(): void {
		// 设置成就回调
		this.game.setAchievementCallbacks({
			onGameCompleted: (payload) => this.onGameCompleted(payload),
			onAchievementUnlocked: (payload) => this.onAchievementUnlocked(payload),
			onHighScore: (payload) => this.onHighScore(payload)
		});
	}

	/**
	 * 游戏完成处理
	 */
	private onGameCompleted(payload: any): void {
		console.log('[AppService] 游戏完成:', payload);
		
		// 发送游戏完成消息到父窗口
		if (this.iframeCommunication.isInIframe()) {
			this.iframeCommunication.sendGameCompleted(payload);
		}
	}

	/**
	 * 成就解锁处理
	 */
	private onAchievementUnlocked(payload: any): void {
		console.log('[AppService] 成就解锁:', payload);
		
		// 发送成就消息到父窗口
		if (this.iframeCommunication.isInIframe()) {
			this.iframeCommunication.sendAchievementUnlocked(payload);
		}
	}

	/**
	 * 高分记录处理
	 */
	private onHighScore(payload: any): void {
		console.log('[AppService] 新高分记录:', payload);
		
		// 发送高分消息到父窗口
		if (this.iframeCommunication.isInIframe()) {
			this.iframeCommunication.sendHighScore(payload);
		}
	}

	/**
	 * 改变语言（外部调用接口）
	 */
	changeLanguage(language: string, source: string = 'internal'): void {
		if (Object.keys(LANGUAGES).includes(language) && language !== this.settings.lang) {
			this.settings.lang = language;
			this.settings.save();
			this.translate.use(language);
			
			console.log(`[AppService] 语言已切换为: ${language} (来源: ${source})`);
			
			// 通知父窗口语言变化
			if (this.iframeCommunication.isInIframe() && source !== 'external-parent') {
				this.iframeCommunication.notifyLanguageChange(language, source);
			}
		}
	}

	/**
	 * 检查是否在iframe中运行
	 */
	isInIframe(): boolean {
		return this.iframeCommunication.isInIframe();
	}

	toggleSound(): void {
		this.settings.sounds = !this.settings.sounds;
		this.game.sound.enabled = this.settings.sounds;
		this.settings.save();
	}

	toggleMusic(): void {
		this.settings.music = !this.settings.music;
		this.game.music.enabled = this.settings.music;
		this.game.music.toggle();
		this.settings.save();
	}
}
