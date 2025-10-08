import { HttpClient } from '@angular/common/http';
import { buildKyodaiSVG, imageSetIsKyodai } from '../model/tilesets';
import { Injectable, inject } from '@angular/core';

export interface CacheItem {
	data?: string;
	request?: Promise<string>;
}

@Injectable({
	providedIn: 'root'
})
export class SvgdefService {
	private readonly http = inject(HttpClient);
	private readonly cache: Record<string, CacheItem> = {};

	async get(name: string, kyodaiUrl?: string): Promise<string> {
		if (imageSetIsKyodai(name)) {
			return buildKyodaiSVG(kyodaiUrl);
		}
		let item = this.cache[name];
		if (item) {
			if (item.data) {
				return item.data;
			}
			if (item.request !== undefined) {
				return item.request;
			}
		}
		item = {};
		const request = new Promise<string>((resolve, reject) => {
			setTimeout(() => {
				this.http.get(`./assets/svg/${name}.svg`, { responseType: 'text' })
					.subscribe({
						next: result => {
							item.data = result;
							item.request = undefined;
							resolve(result);
						},
						error: (error: unknown) => {
							reject(error as Error);
						}
					});
			});
		});
		item.request = request;
		this.cache[name] = item;
		return request;
	}
}
