import { Component, type ElementRef, inject, viewChild } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Backgrounds, ImageSets, Themes } from '../../model/consts';
import { AppService } from '../../service/app.service';
import { LayoutService } from '../../service/layout.service';
import { LocalstorageService } from '../../service/localstorage.service';
import { LANGUAGES } from '../../model/languages';
import { KyodaiTileSets } from '../../model/tilesets';
import { environment } from '../../../environments/environment';

@Component({
	selector: 'app-settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss'],
	imports: [TranslatePipe]
})
export class SettingsComponent {
	readonly kyodaiInput = viewChild.required<ElementRef<HTMLInputElement>>('kyodaiInput');
	canKyodai = environment.kyodai;
	kyodaiTileSets = KyodaiTileSets;
	sets = ImageSets;
	backs = Backgrounds;
	languages = Object.keys(LANGUAGES).map(key => ({ key, title: LANGUAGES[key].title }));
	app = inject(AppService);
	private readonly storage = inject(LocalstorageService);
	private readonly layoutService = inject(LayoutService);
	private readonly translate = inject(TranslateService);

	// iframe模式检测
	get isIframeMode(): boolean {
		return this.app.isInIframe();
	}

	updateKyodaiUrl(event: Event): void {
		this.app.settings.kyodaiUrl = (event.target as HTMLInputElement).value;
		this.app.settings.save();
	}

	clearKyodaiUrl(): void {
		this.app.settings.kyodaiUrl = undefined;
		this.app.settings.save();
	}

	setKyodaiUrl(event: Event): void {
		const kyodaiInput = this.kyodaiInput();
		if (kyodaiInput.nativeElement) {
			event.preventDefault();
			event.stopPropagation();
			kyodaiInput.nativeElement.value = (event.target as HTMLSelectElement).value;
		}
	}

	applyKyodaiUrl(): void {
		const kyodaiInput = this.kyodaiInput();
		if (kyodaiInput.nativeElement) {
			this.app.settings.kyodaiUrl = kyodaiInput.nativeElement.value;
			this.app.settings.save();
		}
	}

	async clearTimes(): Promise<void> {
		const layouts = await this.layoutService.get();
		for (const layout of layouts.items) {
			this.storage.clearScore(layout.id);
		}
	}

	clearTimesClick(): void {
		if (confirm(this.translate.instant('BEST_TIMES_CLEAR_SURE'))) {
			this.clearTimes().catch(error => {
				console.error(error);
			});
		}
	}

	/**
	 * 获取当前语言标题
	 */
	getCurrentLanguageTitle(): string {
		const currentLang = this.app.settings.lang;
		if (currentLang === 'auto') {
			return this.translate.instant('LANG_AUTO');
		}
		return LANGUAGES[currentLang]?.title || currentLang;
	}

	/**
	 * 改变语言（支持双向控制）
	 */
	changeLanguage(language: string): void {
		this.app.changeLanguage(language, 'settings');
	}
}
