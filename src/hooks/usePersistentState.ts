import { useEffect, useReducer } from 'react'
import type { State, DaySchedule, DayTemplate, ScheduleEntry, Mode } from '../types/index.ts'
import { STORAGE_KEYS, SLOT_MINUTES } from '../constants/schedule.ts'

const emptySchedule: DaySchedule = { entries: [] }

function safeParse<T>(s: string|null): T|undefined { try { return s? JSON.parse(s) as T: undefined } catch { return undefined } }

function cloneEntry(e: ScheduleEntry): ScheduleEntry { return { ...e, id: crypto.randomUUID() } }
function dedupeAndSort(entries: ScheduleEntry[]): ScheduleEntry[] { return [...entries].sort((a,b)=>a.start-b.start) }
function overlapping(a: ScheduleEntry, b: ScheduleEntry){ return a.start < b.end && b.start < a.end }

function normalizeShade(shade:number){
  if(shade>=1 && shade<=5) return shade;
  if(shade>5) return Math.min(5, Math.max(1, Math.round(shade/2)));
  return 3;
}

export type Action =
  | { type: 'switch', mode: Mode }
  | { type: 'add', entry: ScheduleEntry }
  | { type: 'update', entry: ScheduleEntry }
  | { type: 'delete', id: string }
  | { type: 'applyTemplate', templateId: string }
  | { type: 'saveTemplate', name: string }
  | { type: 'load', state: Partial<State> }

function reducer(state: State, action: Action): State {
  const current = state.mode === 'weekday' ? state.weekday : state.weekend
  switch(action.type){
    case 'switch': return { ...state, mode: action.mode }
    case 'add': {
      const list = current.entries
      if (list.some(e=>overlapping(e, action.entry))) return state
      const updated = { entries: dedupeAndSort([...list, action.entry]) }
      return state.mode==='weekday'? { ...state, weekday: updated } : { ...state, weekend: updated }
    }
    case 'update': {
      const list = current.entries.map(e=> e.id===action.entry.id ? action.entry : e)
      if (list.some(e=> e.id!==action.entry.id && overlapping(e, action.entry))) return state
      const updated = { entries: dedupeAndSort(list) }
      return state.mode==='weekday'? { ...state, weekday: updated } : { ...state, weekend: updated }
    }
    case 'delete': {
      const list = current.entries.filter(e=> e.id!==action.id)
      const updated = { entries: list }
      return state.mode==='weekday'? { ...state, weekday: updated } : { ...state, weekend: updated }
    }
    case 'applyTemplate': {
      const tpl = state.templates.find(t=>t.id===action.templateId)
      if(!tpl) return state
      return state.mode==='weekday'? { ...state, weekday: { entries: tpl.entries.map(cloneEntry) } } : { ...state, weekend: { entries: tpl.entries.map(cloneEntry) } }
    }
    case 'saveTemplate': {
      const id = crypto.randomUUID()
      const name = action.name.trim().slice(0,16) || 'テンプレ'
      const tpl: DayTemplate = { id, name, entries: current.entries.map(cloneEntry) }
      return { ...state, templates: [...state.templates, tpl] }
    }
    case 'load': return { ...state, ...action.state }
  }
  return state
}

export function usePersistentState(){
  const [state, dispatch] = useReducer(reducer, undefined, ()=>{
    const weekdayRaw = safeParse<DaySchedule>(localStorage.getItem(STORAGE_KEYS.weekday)) || emptySchedule
    const weekendRaw = safeParse<DaySchedule>(localStorage.getItem(STORAGE_KEYS.weekend)) || emptySchedule
    const templatesRaw = safeParse<DayTemplate[]>(localStorage.getItem(STORAGE_KEYS.templates)) || []
    const normalize = (s:DaySchedule):DaySchedule => ({ entries: s.entries.map(e=> ({ ...e,
      start: Math.min(1410, Math.round(e.start / SLOT_MINUTES) * SLOT_MINUTES),
      end: Math.min(1440, Math.round(e.end / SLOT_MINUTES) * SLOT_MINUTES),
      shade: normalizeShade(e.shade)
    })).filter(e=> e.end>e.start) })
    const weekday = normalize(weekdayRaw)
    const weekend = normalize(weekendRaw)
    const templates = templatesRaw.map(t=> ({ ...t, entries: normalize({ entries: t.entries }).entries }))
    return { mode: 'weekday', weekday, weekend, templates } as State
  })
  useEffect(()=>{ localStorage.setItem(STORAGE_KEYS.weekday, JSON.stringify(state.weekday)) }, [state.weekday])
  useEffect(()=>{ localStorage.setItem(STORAGE_KEYS.weekend, JSON.stringify(state.weekend)) }, [state.weekend])
  useEffect(()=>{ localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(state.templates)) }, [state.templates])
  return { state, dispatch }
}
