export const SLOT_MINUTES = 30;
export const MINUTES_PER_DAY = 1440;
export const LAST_SLOT_START = MINUTES_PER_DAY - SLOT_MINUTES; // 1410 when 30m slot
// 3段階（やや暗め中心） 明→暗
export const SHADE_LIGHTNESS = [50, 38, 26];
export const STORAGE_KEYS = { weekday: 'weekdaySchedule', weekend: 'weekendSchedule', templates: 'scheduleTemplates' } as const;

export function normalizeShade(shade:number){
	if(shade>=1 && shade<=5) return shade;
	if(shade>5) return Math.min(5, Math.max(1, Math.round(shade/2)));
	return 3;
}
