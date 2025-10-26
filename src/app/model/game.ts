import { Board } from './board';
import { Clock } from './clock';
import { GAME_MODE_EASY, GAME_MODE_EXPERT, type GAME_MODE_ID, GAME_MODE_STANDARD, STATES } from './consts';
import { SOUNDS, Sound } from './sound';
import type { Stone } from './stone';
import type { GameStateStore, Layout, LayoutScoreStore, StorageProvider } from './types';
import type { BUILD_MODE_ID } from './builder';
import { Music } from './music';
import { RANDOM_LAYOUT_ID_PREFIX } from './random-layout/consts';

export class Game {
	clock: Clock = new Clock();
	board: Board = new Board();
	sound: Sound = new Sound();
	music: Music = new Music();
	state: number = STATES.idle;
	message?: { messageID?: string; playTime?: number };
	layoutID?: string = undefined;
	mode: GAME_MODE_ID = GAME_MODE_STANDARD;
	private saveTimer?: ReturnType<typeof setTimeout> = undefined;
	
	// Achievement tracking
	private onGameCompleted?: (payload: any) => void;
	private onAchievementUnlocked?: (payload: any) => void;
	private onHighScore?: (payload: any) => void;

	constructor(private readonly storage: StorageProvider) {
	}

	init(): void {
		this.load();
		this.board.update();
		if (this.state === STATES.run) {
			this.pause();
		}
		this.message = { messageID: this.isPaused() ? 'MSG_CONTINUE_SAVE' : 'MSG_START' };
	}

	click(stone?: Stone): boolean {
		if (!stone) {
			this.board.clearSelection();
			return false;
		}
		if (!this.isRunning() || stone.state.blocked) {
			this.sound.play(SOUNDS.NOPE);
			this.wiggleStone(stone);
			return true;
		}
		if (this.clock.elapsed === 0) {
			this.clock.run();
		}
		if (this.board.selected && stone && stone !== this.board.selected && stone.groupNr === this.board.selected.groupNr) {
			this.resolveMatchingStone(stone);
			return true;
		}
		this.board.setStoneSelected(this.board.selected === stone ? undefined : stone);
		this.sound.play(SOUNDS.SELECT);
		return true;
	}

	wiggleStone(stone?: Stone): void {
		if (!stone) {
			return;
		}
		stone.effects = stone.effects || {};
		stone.effects.wiggle = true;
		setTimeout(() => {
			if (stone.effects) {
				stone.effects.wiggle = false;
			}
		}, 300);
	}

	isRunning(): boolean {
		return this.state === STATES.run;
	}

	isPaused(): boolean {
		return this.state === STATES.pause;
	}

	isIdle(): boolean {
		return this.state === STATES.idle;
	}

	resume(): void {
		this.run();
		this.clock.run();
		this.music.play();
	}

	run(): void {
		this.board.clearHints();
		this.board.update();
		this.setState(STATES.run);
	}

	toggle(): void {
		if (this.state === STATES.run) {
			this.pause();
		} else if (this.state === STATES.pause) {
			this.resume();
		}
	}

	pause(): void {
		this.clock.pause();
		this.setState(STATES.pause, 'MSG_CONTINUE_PAUSE');
		this.save();
		this.music.pause();
	}

	reset(): void {
		this.clock.reset();
		this.setState(STATES.idle);
		this.board.reset();
	}

	start(layout: Layout, buildMode: BUILD_MODE_ID, gameMode: GAME_MODE_ID): void {
		this.layoutID = layout.id;
		this.mode = gameMode;
		this.board.applyMapping(layout.mapping, buildMode);
		this.board.update();
		this.run();
	}

	hint(): void {
		if (this.mode === GAME_MODE_EXPERT) {
			return;
		}
		this.board.hint();
	}

	shuffle(): void {
		if (this.mode !== GAME_MODE_EASY) {
			return;
		}
		this.board.shuffle();
	}

	back(): void {
		if (this.mode === GAME_MODE_EXPERT) {
			return;
		}
		if (!this.isRunning()) {
			return;
		}
		this.board.back();
	}

	load(): boolean {
		try {
			const store: GameStateStore | undefined = this.storage.getState();
			if (store?.stones) {
				this.clock.elapsed = store.elapsed ?? 0;
				this.layoutID = store.layout;
				this.mode = store.gameMode ?? GAME_MODE_STANDARD;
				this.state = store.state ?? STATES.idle;
				this.board.load(store.stones, store.undo ?? []);
				return true;
			}
		} catch (error) {
			console.error('load state failed', error);
		}
		return false;
	}

	save(): void {
		if (!this.layoutID) {
			return;
		}
		try {
			this.storage.storeState({
				elapsed: this.clock.elapsed,
				state: this.state,
				layout: this.layoutID,
				gameMode: this.mode,
				undo: this.board.undo,
				stones: this.board.save()
			});
		} catch (error) {
			console.error('storing state failed', error);
		}
	}

	private isStorableLayoutId(): boolean {
		return this.layoutID != undefined && !this.layoutID.startsWith(RANDOM_LAYOUT_ID_PREFIX);
	}

	private gameOverLosing(): void {
		if (this.isStorableLayoutId()) {
			const id = this.layoutID ?? 'unknown';
			const score = this.storage.getScore(id) ?? {};
			score.playCount = (score.playCount ?? 0) + 1;
			this.storage.storeScore(id, score);
		}
		this.gameOver('MSG_FAIL');
	}

	private gameOverWinning(): void {
		const playTime = this.clock.elapsed;
		
		// Update score records and trigger achievements
		this.updateScoreRecords(playTime);
		
		// Trigger game completion message
		this.triggerGameCompleted(playTime);
		
		// Determine message type based on whether it was a new best time
		const isNewBest = this.isNewBestTime(playTime);
		if (!this.isStorableLayoutId()) {
			this.gameOver('MSG_GOOD', playTime);
		} else if (isNewBest) {
			this.gameOver('MSG_BEST', playTime);
		} else {
			this.gameOver('MSG_GOOD', playTime);
		}
	}

	private isNewBestTime(playTime: number): boolean {
		if (!this.layoutID || !this.isStorableLayoutId()) {
			return false;
		}
		const score = this.storage.getScore(this.layoutID);
		return !score?.bestTime || playTime < score.bestTime;
	}

	private delayedSave(): void {
		clearTimeout(this.saveTimer);
		this.saveTimer = setTimeout(() => {
			this.save();
		}, 300);
	}

	private resolveMatchingStone(stone: Stone): void {
		const sel = this.board.selected;
		if (!sel) {
			return;
		}
		this.board.pick(sel, stone);
		if (this.board.count < 2) {
			this.gameOverWinning();
		} else if (this.board.free.length === 0) {
			this.gameOverLosing();
		} else {
			this.sound.play(SOUNDS.MATCH);
			this.delayedSave();
		}
	}

	private gameOver(message: string, playTime?: number): void {
		this.sound.play(SOUNDS.OVER);
		this.setState(STATES.idle, message, playTime);
		this.clock.reset();
		this.delayedSave();
	}

	private setState(state: number, messageID?: string, playTime?: number): void {
		this.message = messageID ? { messageID, playTime } : undefined;
		this.state = state;
	}

	// Achievement system methods
	setAchievementCallbacks(callbacks: {
		onGameCompleted?: (payload: any) => void;
		onAchievementUnlocked?: (payload: any) => void;
		onHighScore?: (payload: any) => void;
	}): void {
		this.onGameCompleted = callbacks.onGameCompleted;
		this.onAchievementUnlocked = callbacks.onAchievementUnlocked;
		this.onHighScore = callbacks.onHighScore;
	}

	private updateScoreRecords(playTime: number): void {
		if (!this.layoutID || !this.isStorableLayoutId()) {
			return;
		}

		const id = this.layoutID;
		const score = this.storage.getScore(id) ?? {};
		const isFirstWin = !score.playCount;

		// Update basic statistics
		score.playCount = (score.playCount ?? 0) + 1;

		// Track recent times for average calculation
		if (!score.recentTimes) {
			score.recentTimes = [];
		}
		score.recentTimes.push(playTime);
		if (score.recentTimes.length > 10) {
			score.recentTimes.shift();
		}
		score.averageTime = score.recentTimes.reduce((a, b) => a + b, 0) / score.recentTimes.length;

		// Initialize mode tracking
		if (!score.modeTimes) {
			score.modeTimes = {};
		}
		if (!score.modeTimes[this.mode]) {
			score.modeTimes[this.mode] = {};
		}

		const modeRecord = score.modeTimes[this.mode]!;
		modeRecord.playCount = (modeRecord.playCount ?? 0) + 1;

		// Check for perfect game
		const isPerfectGame = this.isPerfectGame();
		if (isPerfectGame) {
			score.perfectGames = (score.perfectGames ?? 0) + 1;
			modeRecord.perfectGames = (modeRecord.perfectGames ?? 0) + 1;
		}

		// First win achievement
		if (isFirstWin) {
			score.firstWinTime = playTime;
			this.triggerAchievement('first_win', 'First Victory', 'first_win', 
				'Complete your first mahjong game', {
					layoutName: this.getCurrentLayoutName(),
					timeElapsed: playTime,
					movesCount: this.board.movesCount
				});
		}

		// Check for new best time
		const isNewBestTime = !score.bestTime || playTime < score.bestTime;
		const previousBest = score.bestTime;

		if (isNewBestTime) {
			score.bestTime = playTime;
			modeRecord.bestTime = playTime;
			
			// Trigger high score achievement
			this.triggerHighScore({
				layoutName: this.getCurrentLayoutName(),
				layoutId: id,
				scoreType: 'time',
				newValue: playTime,
				previousValue: previousBest || 0,
				improvement: previousBest ? previousBest - playTime : playTime,
				context: {
					movesCount: this.board.movesCount,
					hintsUsed: this.board.hintsUsed,
					undoCount: this.board.undoUsed,
					perfectGame: isPerfectGame
				}
			});
		}

		// Check for speed achievements
		this.checkSpeedAchievements(playTime);

		// Store updated score
		this.storage.storeScore(id, score);
	}

	private isPerfectGame(): boolean {
		return this.board.hintsUsed === 0 && this.board.undoUsed === 0;
	}

	private getCurrentLayoutName(): string {
		// This would need to be implemented based on how layout names are stored
		return this.layoutID || 'Unknown Layout';
	}

	private checkSpeedAchievements(playTime: number): void {
		const totalTiles = this.board.stones.length;
		const thresholds = this.calculateTimeThresholds(totalTiles);

		if (playTime <= thresholds.lightning) {
			this.triggerAchievement('lightning_completion', 'Lightning Fast', 'speed_demon',
				`Complete ${this.getCurrentLayoutName()} in under ${this.formatTime(thresholds.lightning)}`, {
					layoutName: this.getCurrentLayoutName(),
					value: playTime,
					threshold: thresholds.lightning
				});
		} else if (playTime <= thresholds.quick) {
			this.triggerAchievement('quick_completion', 'Quick Completion', 'speed_demon',
				`Complete ${this.getCurrentLayoutName()} in under ${this.formatTime(thresholds.quick)}`, {
					layoutName: this.getCurrentLayoutName(),
					value: playTime,
					threshold: thresholds.quick
				});
		}
	}

	private calculateTimeThresholds(totalTiles: number): { lightning: number; quick: number; normal: number } {
		const TIME_PER_TILE = {
			[GAME_MODE_EASY]: 1500,
			[GAME_MODE_STANDARD]: 2000,
			[GAME_MODE_EXPERT]: 3000
		};

		const baseTime = totalTiles * (TIME_PER_TILE[this.mode] || 2000);
		
		return {
			lightning: baseTime * 0.8,  // 80% of base time
			quick: baseTime * 1.2,      // 120% of base time
			normal: baseTime * 1.5      // 150% of base time
		};
	}

	private formatTime(milliseconds: number): string {
		const seconds = Math.floor(milliseconds / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		
		if (minutes > 0) {
			return `${minutes}m ${remainingSeconds}s`;
		}
		return `${seconds}s`;
	}

	private triggerAchievement(achievementId: string, name: string, type: string, 
		description: string, context: any): void {
		if (this.onAchievementUnlocked) {
			this.onAchievementUnlocked({
				achievementId,
				achievementName: name,
				achievementType: type as any,
				description,
				context,
				isNewAchievement: true,
				timestamp: Date.now()
			});
		}
	}

	private triggerHighScore(payload: any): void {
		if (this.onHighScore) {
			this.onHighScore({
				...payload,
				timestamp: Date.now()
			});
		}
	}

	private triggerGameCompleted(playTime: number): void {
		if (this.onGameCompleted) {
			this.onGameCompleted({
				layoutName: this.getCurrentLayoutName(),
				layoutId: this.layoutID!,
				timeElapsed: playTime,
				movesCount: this.board.movesCount,
				hintsUsed: this.board.hintsUsed,
				undoCount: this.board.undoUsed,
				difficulty: this.getDifficultyLevel(),
				perfectGame: this.isPerfectGame(),
				timestamp: Date.now()
			});
		}
	}

	private getDifficultyLevel(): 'beginner' | 'intermediate' | 'expert' {
		switch (this.mode) {
			case GAME_MODE_EASY: return 'beginner';
			case GAME_MODE_STANDARD: return 'intermediate';
			case GAME_MODE_EXPERT: return 'expert';
			default: return 'intermediate';
		}
	}
}
