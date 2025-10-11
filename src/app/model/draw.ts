import { CONSTS } from './consts';
import { Stone } from './stone';
import type { Mapping } from './types';

export interface DrawPos {
	x: number;
	y: number;
	z: number;
	translate: string;
}

export interface Draw {
	x: number;
	y: number;
	z: number;
	v: number;
	pos: DrawPos;
	visible: boolean;
	url?: string;
	className?: string;
	source: Stone;
}

export function calcDrawPos(z: number, x: number, y: number): DrawPos {
	const pos = {
		x: ((CONSTS.tileWidth + 2) * x / 2 - (z * 8)) + (CONSTS.tileWidth / 2),
		y: ((CONSTS.tileHeight + 2) * y / 2 - (z * 8)) + (CONSTS.tileHeight / 2),
		z: y + CONSTS.mY * (x + CONSTS.mX * z),
		translate: ''
	};
	pos.translate = `translate(${pos.x},${pos.y})`;
	return pos;
}

export function sortDrawItems(items: Array<Draw>): Array<Draw> {
	const sortToDraw = (draw: Draw) => draw.pos.z;
	return items.sort((ad: Draw, bd: Draw) => {
		const a = sortToDraw(ad);
		const b = sortToDraw(bd);
		if (a < b) {
			return -1;
		}
		if (a > b) {
			return 1;
		}
		return 0;
	});
}

export function getDrawBoundsViewPort(bounds: Array<number>, rotate: boolean = false): string {
	if (rotate) {
		// 竖屏模式：要让内容变小，需要增大viewBox的尺寸
		const width = bounds[2] - bounds[0];
		const height = bounds[3] - bounds[1];
		
		// 获取屏幕实际尺寸
		const screenWidth = window.innerWidth || 375;
		const screenHeight = window.innerHeight || 667;
		
		// 计算合适的放大倍数（让viewBox变大，内容就变小）
		// 目标是让内容适合屏幕，所以需要让viewBox比原尺寸大
		const scaleX = screenHeight / height; // 竖屏高度作为基准
		const scaleY = screenWidth / width;  // 竖屏宽度作为基准
		const enlargeScale = Math.max(scaleX, scaleY) * 1.4; // 进一步增大确保右侧不溢出
		
		// 计算放大后的viewBox尺寸（内容会相应缩小）
		const finalWidth = width * enlargeScale;
		const finalHeight = height * enlargeScale;
		
		// 调整位置来居中显示，稍微偏左以避免右侧溢出
		const centerX = (bounds[0] + bounds[2]) / 2;
		const centerY = (bounds[1] + bounds[3]) / 2;
		const portraitX = centerX - finalWidth / 2 - 35; // 进一步增加左偏移，实现完美居中
		const portraitY = centerY - finalHeight / 2;
		
		return `${portraitX} ${portraitY} ${finalWidth} ${finalHeight}`;
	} else {
		// 大屏幕模式：要缩小牌堆，需要增大viewBox尺寸
		const b = [
			bounds[0] - 80,        // 左边界向外扩展
			bounds[1] - 120,       // 上边界向外扩展，为顶部留出空间
			bounds[2] + CONSTS.tileHeight + 120,  // 右边界向外扩展
			bounds[3] + CONSTS.tileHeight + 200   // 下边界向外扩展200px，为底部留出更多空间
		];
		return b.join(' ');
	}
}

export function getDrawViewPort(items: Array<Draw>, width: number, height: number, rotate: boolean = false): string {
	const bounds = getDrawBounds(items, width, height);
	return getDrawBoundsViewPort(bounds, rotate);
}

export function getDrawBounds(items: Array<Draw>, width: number, height: number): Array<number> {
	const m = Math.max(width, height);
	const bounds = [m, m, 0, 0];
	for (const draw of items) {
		bounds[0] = Math.min(bounds[0], draw.pos.x);
		bounds[1] = Math.min(bounds[1], draw.pos.y);
		bounds[2] = Math.max(bounds[2], draw.pos.x);
		bounds[3] = Math.max(bounds[3], draw.pos.y);
	}
	return bounds;
}

export function mappingToDrawItems(mapping: Mapping): Array<Draw> {
	const emptySource: Stone = new Stone(0, 0, 0, 0, 0);
	const result = mapping.map((row: Array<number>): Draw =>
		({
			z: row[0],
			x: row[1],
			y: row[2],
			v: 0,
			visible: true,
			pos: calcDrawPos(row[0], row[1], row[2]),
			source: emptySource
		}));
	return sortDrawItems(result);
}
