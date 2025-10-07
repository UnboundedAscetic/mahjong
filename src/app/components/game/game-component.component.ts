import { Component, inject, viewChild, ElementRef, ViewChildren, QueryList } from '@angular/core';
import type { Game } from '../../model/game';
import type { Stone } from '../../model/stone';
import type { Layout, Place } from '../../model/types';
import { AppService } from '../../service/app.service';
import type { BUILD_MODE_ID } from '../../model/builder';
import type { GAME_MODE_ID } from '../../model/consts';
import { WorkerService } from '../../service/worker.service';
import { environment } from '../../../environments/environment';
import { DialogComponent } from '../dialog/dialog.component';
import { HelpComponent } from '../help/help.component';
import { TilesInfoComponent } from '../tiles-info/tiles-info.component';
import { SettingsComponent } from '../settings/settings.component';
import { ChooseLayoutComponent } from '../choose-layout/choose-layout.component';
import { TranslatePipe } from '@ngx-translate/core';
import { BoardComponent } from '../board/board.component';
import { DurationPipe } from '../../pipes/duration.pipe';
import { GameModeEasyPipe, GameModeStandardPipe } from '../../pipes/game-mode.pipe';
import { NgClass } from '@angular/common';

interface DocumentExtended extends Document {
	fullScreen: boolean;
	fullscreen: boolean;
	mozFullScreen: boolean;
	webkitIsFullScreen: boolean;
	mozFullscreenEnabled: boolean;
	webkitFullscreenEnabled: boolean;

	mozCancelFullScreen(): void;

	webkitExitFullscreen(): void;
}

interface HTMLElementExtended extends HTMLElement {
	webkitRequestFullscreen(): void;

	mozRequestFullScreen(): void;
}

@Component({
	selector: 'app-game-component',
	templateUrl: './game-component.component.html',
	styleUrls: ['./game-component.component.scss'],
	host: { '(document:keydown)': 'handleKeyDownEvent($event)' },
	imports: [
		BoardComponent, DurationPipe, GameModeStandardPipe, GameModeEasyPipe,
		HelpComponent, TilesInfoComponent, SettingsComponent, ChooseLayoutComponent, TranslatePipe, DialogComponent, NgClass
	]
})
export class GameComponent {
	readonly info = viewChild.required<DialogComponent>('info');
	readonly settings = viewChild.required<DialogComponent>('settings');
	readonly help = viewChild.required<DialogComponent>('help');
	readonly newgame = viewChild.required<DialogComponent>('newgame');
	app = inject(AppService);
	game: Game;
	fullScreenEnabled: boolean = true;
	title: string = '';
	workerService = inject(WorkerService);

	// Floating dock properties
	@ViewChildren('dockItem') dockItems!: QueryList<ElementRef>;
	mouseX: number | null = null;
	buttonWidth: number = 48;
	buttonHeight: number = 48;
	iconSize: number = 20;
	dockContainerRef = viewChild<ElementRef>('dockContainer');

	
	constructor() {
		this.game = this.app.game;
		this.fullScreenEnabled = this.canFullscreen();
		this.title = `${this.app.name} v${environment.version}`;
	}

	showNewGame(): void {
		this.newgame().visible.set(true);
	}

	handleKeyDownEventKey(key: string): boolean {
		switch (key) {
			case 'h': {
				this.help().toggle();
				break;
			}
			case 'i': {
				this.info().toggle();
				break;
			}
			case 's': {
				this.settings().toggle();
				break;
			}
			case 't': {
				this.game.hint();
				break;
			}
			case 'm': {
				this.game.shuffle();
				break;
			}
			case 'g': {
				this.debugSolve();
				break;
			}
			case 'u': {
				this.game.back();
				break;
			}
			case 'n': {
				this.game.pause();
				this.newgame().toggle();
				break;
			}
			case ' ': // space
			case 'space': // space
			case 'Space': // space
			case 'spacebar': // space
			case 'Spacebar': // space
			case 'p': {
				if (this.game.isRunning()) {
					this.game.pause();
				} else if (this.game.isPaused()) {
					this.game.resume();
				}
				break;
			}
			default: {
				return false;
			}
		}
		return true;
	}

	handleKeyDownDialogExit(): boolean {
		const help = this.help();
		if (help.visible()) {
			help.toggle();
			return true;
		}
		const newgame = this.newgame();
		if (newgame.visible()) {
			newgame.toggle();
			return true;
		}
		const info = this.info();
		if (info.visible()) {
			info.toggle();
			return true;
		}
		const settings = this.settings();
		if (settings.visible()) {
			settings.toggle();
			return true;
		}
		return false;
	}

	handleKeyDownEvent(event: KeyboardEvent): void {
		if (event.key === 'Escape' && this.handleKeyDownDialogExit()) {
			return;
		}
		const nodeName = ((event.target as { nodeName?: string })?.nodeName ?? '').toLocaleLowerCase();
		if (nodeName === 'input') {
			return;
		}
		if (this.handleKeyDownEventKey(event.key)) {
			event.preventDefault();
		}
	}

	stoneClick(stone?: Stone): void {
		this.game.click(stone);
	}

	isFullscreenEnabled(): boolean {
		const doc = window.document as DocumentExtended;
		// Prefer the standard property when available
		if (typeof doc.fullscreenEnabled === 'boolean') {
			return doc.fullscreenEnabled;
		}
		// Fallback: detect support via requestFullscreen on the document element or vendor-prefixed methods
		const element = document.documentElement as HTMLElementExtended;
		return !!(element.requestFullscreen || element.webkitRequestFullscreen || element.mozRequestFullScreen);
	}

	canFullscreen(): boolean {
		if (environment.mobile) {
			return false;
		}
		return this.isFullscreenEnabled();
	}

	isFullscreen(): boolean {
		const doc = window.document as DocumentExtended;
		// Prefer the standard property; fall back to vendor-specific flags
		return !!(doc.fullscreenElement || doc.webkitIsFullScreen || doc.mozFullScreen);
	}

	exitFullscreen(): void {
		const doc = window.document as DocumentExtended;
		if (doc.exitFullscreen) {
			doc.exitFullscreen()
				.catch(error => {
					console.error(error);
				});
		} else if (doc.mozCancelFullScreen) {
			doc.mozCancelFullScreen();
		} else if (doc.webkitExitFullscreen) {
			doc.webkitExitFullscreen();
		}
	}

	requestFullscreen(): void {
		const element = document.body as HTMLElementExtended;
		if (element.requestFullscreen) {
			element.requestFullscreen()
				.catch(error => {
					console.error(error);
				});
		} else if (element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		} else if (element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		}
	}

	enterFullScreen(): void {
		if (this.isFullscreen()) {
			this.exitFullscreen();
		} else {
			this.requestFullscreen();
		}
	}

	newGame(): void {
		this.game.pause();
		this.showNewGame();
	}

	startGame(data: { layout: Layout; buildMode: BUILD_MODE_ID; gameMode: GAME_MODE_ID }): void {
		this.newgame().visible.set(false);
		this.game.reset();
		this.game.start(data.layout, data.buildMode, data.gameMode);
	}

	toggleDialogState(dialogVisible: boolean): void {
		if (dialogVisible) {
			if (!this.app.game.isPaused()) {
				this.app.game.pause();
			}
		} else {
			this.app.settings.save();
			if (this.app.game.isPaused()) {
				this.app.game.resume();
			}
		}
	}

	clickMessage(): void {
		if (this.game.isPaused()) {
			this.game.resume();
		} else {
			this.game.reset();
			this.showNewGame();
		}
	}

	debugSolve(): void {
		if (environment.production) {
			return;
		}
		const play = (index: number, list: Array<Place>) => {
			const t1 = list[index];
			const t2 = list[index + 1];
			if (!t1 || !t2) {
				return;
			}
			const stones = this.game.board.stones.filter(s => (
				((s.z === t1[0]) && (s.x === t1[1]) && (s.y === t1[2])) ||
				((s.z === t2[0]) && (s.x === t2[1]) && (s.y === t2[2])))
			);
			if (stones.length > 1) {
				for (const stone of stones) {
					stone.selected = true;
				}
				setTimeout(() => {
					this.game.board.pick(stones[0], stones[1]);
					play(index + 2, list);
				}, 300);
			}
		};

		this.workerService.solveGame(this.game.board.stones.filter(s => !s.picked).map(s => s.toPosition()), data => {
			play(0, data.order);
		});
	}

	// Floating dock mouse tracking - 简化版本
	hoveredIndex: number | null = null;
	private dockElement: HTMLElement | null = null;
	private itemElements: HTMLElement[] = [];

	ngAfterViewInit(): void {
		// 缓存 dock 元素引用
		this.dockElement = document.querySelector('.floating-dock') as HTMLElement;
		if (this.dockElement) {
			this.itemElements = Array.from(this.dockElement.querySelectorAll('.dock-item, .dock-stat')) as HTMLElement[];
		}
	}

	onDockMouseMove(event: MouseEvent): void {
		const dockElement = this.dockElement || (event.currentTarget as HTMLElement).querySelector('.floating-dock');
		if (dockElement) {
			const rect = dockElement.getBoundingClientRect();
			this.mouseX = event.clientX - rect.left;
		}
	}

	onDockMouseLeave(): void {
		this.mouseX = null;
		this.hoveredIndex = null;
	}

	onItemHover(index: number): void {
		this.hoveredIndex = index;
	}

	calculateScale(index: number): number {
		// 如果鼠标悬停在某个项目上，给它最大缩放
		if (this.hoveredIndex === index) {
			return 1.5;
		}

		if (this.mouseX === null || !this.dockElement || index >= this.itemElements.length) return 1;

		const itemElement = this.itemElements[index];
		if (!itemElement) return 1;

		const rect = itemElement.getBoundingClientRect();
		const dockRect = this.dockElement.getBoundingClientRect();
		const itemCenter = rect.left - dockRect.left + rect.width / 2;
		const distance = Math.abs(this.mouseX! - itemCenter);
		const maxDistance = 150;

		if (distance < maxDistance) {
			return 1 + (1 - distance / maxDistance) * 0.5; // 1.0 到 1.5 的缩放范围
		}

		return 1;
	}

	}
