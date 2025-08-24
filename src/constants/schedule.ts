export const SLOT_MINUTES = 30;
export const MINUTES_PER_DAY = 1440;
export const LAST_SLOT_START = MINUTES_PER_DAY - SLOT_MINUTES; // 1410 when 30m slot
// 3段階（やや暗め中心） 明→暗 (1..3)
export const SHADE_LIGHTNESS = [39, 30, 21];
export const SHADE_COUNT = SHADE_LIGHTNESS.length; // 現在 3
export const STORAGE_KEYS = { weekday: 'weekdaySchedule', weekend: 'weekendSchedule', templates: 'scheduleTemplates' } as const;

// 旧バージョンの 5段階/10段階データを 3段階へ縮約
export function normalizeShade(shade:number){
	if(shade >=1 && shade <= SHADE_COUNT) return shade;
	if(shade > SHADE_COUNT){
		const baseScale = shade <=5 ? 5 : 10; // 旧5 or 旧10段階を推定
		const approx = Math.round(shade * SHADE_COUNT / baseScale);
		return Math.min(SHADE_COUNT, Math.max(1, approx));
	}
	return Math.ceil(SHADE_COUNT/2); // デフォルトは中間
}
