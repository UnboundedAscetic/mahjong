import { BackgroundDefault, ImageSetDefault, LangDefault } from './consts';
import type { SettingsStore, StorageProvider } from './types';

export class Settings {
	lang = LangDefault;
	sounds = true;
	tileset = ImageSetDefault;
	music = false;
	contrast = false;
	dark = false;
	background = BackgroundDefault;
	kyodaiUrl?: string;
	stats = {
		games: 0,
		bestTime: 0
	};

	constructor(private readonly storageProvider: StorageProvider) {
	}

	load(): boolean {
		try {
			const store: SettingsStore | undefined = this.storageProvider.getSettings();
			if (store) {
				this.lang = store.lang ?? LangDefault;
				this.tileset = store.tileset ?? ImageSetDefault;
				this.background = store.background ?? BackgroundDefault;
				this.contrast = store.contrast ?? false;
				this.dark = store.dark ?? false;
				this.sounds = store.sounds ?? this.sounds;
				this.music = store.music ?? this.music;
				this.kyodaiUrl = store.kyodaiUrl;
			}
			return true;
		} catch (error) {
			console.error('load settings failed', error);
		}
		return false;
	}

	save(): boolean {
		try {
			this.storageProvider.storeSettings({
				lang: this.lang,
				sounds: this.sounds,
				music: this.music,
				contrast: this.contrast,
				dark: this.dark,
				background: this.background,
				tileset: this.tileset,
				kyodaiUrl: this.kyodaiUrl
			});
			return true;
		} catch (error) {
			console.error('storing settings failed', error);
		}
		return false;
	}
}
