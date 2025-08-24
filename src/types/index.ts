// Shared type definitions
export interface ScheduleEntry { id: string; title: string; start: number; end: number; shade: number }
export interface DaySchedule { entries: ScheduleEntry[] }
export interface DayTemplate { id: string; name: string; entries: ScheduleEntry[] }
export type Mode = 'weekday' | 'weekend'
export interface State { mode: Mode; weekday: DaySchedule; weekend: DaySchedule; templates: DayTemplate[] }
export interface EditData { id?:string; start:number; end:number; title:string; shade:number }
