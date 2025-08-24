import { useEffect, useReducer, useState } from 'react'

// Data types
interface ScheduleEntry { id: string; title: string; start: number; end: number; shade: number }
interface DaySchedule { entries: ScheduleEntry[] }
interface DayTemplate { id: string; name: string; entries: ScheduleEntry[] }
type Mode = 'weekday' | 'weekend'
interface State { mode: Mode; weekday: DaySchedule; weekend: DaySchedule; templates: DayTemplate[] }

const emptySchedule: DaySchedule = { entries: [] }
const STORAGE_KEYS = { weekday: 'weekdaySchedule', weekend: 'weekendSchedule', templates: 'scheduleTemplates' }

// Reducer
type Action =
  | { type: 'switch', mode: Mode }
  | { type: 'add', entry: ScheduleEntry }
  | { type: 'update', entry: ScheduleEntry }
  | { type: 'delete', id: string }
  | { type: 'applyTemplate', templateId: string }
  | { type: 'saveTemplate', name: string }
  | { type: 'load', state: Partial<State> }

function dedupeAndSort(entries: ScheduleEntry[]): ScheduleEntry[] {
  return [...entries].sort((a,b)=>a.start-b.start)
}

function overlapping(a: ScheduleEntry, b: ScheduleEntry) {
  return a.start < b.end && b.start < a.end
}

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
      // overlap check excluding self
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

function cloneEntry(e: ScheduleEntry): ScheduleEntry { return { ...e, id: crypto.randomUUID() } }

function minutesToLabel(m:number){ const h=Math.floor(m/60); const mm=m%60; return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}` }

function usePersistentState(){
  const [state, dispatch] = useReducer(reducer, undefined, ()=>{
    const weekday = safeParse<DaySchedule>(localStorage.getItem(STORAGE_KEYS.weekday)) || emptySchedule
    const weekend = safeParse<DaySchedule>(localStorage.getItem(STORAGE_KEYS.weekend)) || emptySchedule
    const templates = safeParse<DayTemplate[]>(localStorage.getItem(STORAGE_KEYS.templates)) || []
    return { mode: 'weekday', weekday, weekend, templates } as State
  })
  useEffect(()=>{ localStorage.setItem(STORAGE_KEYS.weekday, JSON.stringify(state.weekday)) }, [state.weekday])
  useEffect(()=>{ localStorage.setItem(STORAGE_KEYS.weekend, JSON.stringify(state.weekend)) }, [state.weekend])
  useEffect(()=>{ localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(state.templates)) }, [state.templates])
  return { state, dispatch }
}

function safeParse<T>(s: string|null): T|undefined { try { return s? JSON.parse(s) as T: undefined } catch { return undefined } }

// Component: Pie schedule (simplified MVP - click to add, list below)
interface HighlightNew { start:number; end:number }
function Pie({ entries, onAdd, onEdit, highlightId, highlightNew }: { entries: ScheduleEntry[]; onAdd:(minute:number)=>void; onEdit:(id:string)=>void; highlightId?:string; highlightNew?:HighlightNew|null }) {
  const size = 380; // 余白確保
  const margin = 20; // ラベル用余白
  const center = size/2;
  const wedgeRadius = center - margin; // 実際の円グラフ半径（ラベルは外側）
  function handleClick(e: React.MouseEvent<SVGSVGElement>){
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;
    const angle = (Math.atan2(y,x) * 180/Math.PI + 450) % 360; // 0 at top
    const minutes = Math.round((angle/360)*1440/15)*15 % 1440;
    onAdd(minutes);
  }
  return (
    <div className="w-full flex flex-col items-center">
      <svg width={size} height={size} onClick={handleClick} className="touch-none select-none">
        <circle cx={center} cy={center} r={wedgeRadius} className="fill-neutral-800" />
        {entries.map(e=>{
          const startA = (e.start/1440)*360; const endA = (e.end/1440)*360;
          const path = arcPath(center, center, wedgeRadius, startA, endA)
          const lightness = 100 - e.shade*8;
          const isHL = highlightId===e.id;
          const midA = (startA + endA)/2;
          const span = endA - startA;
          const labelPos = polar(center, center, wedgeRadius*0.55, midA);
          return (
            <g key={e.id} onClick={(ev)=>{ev.stopPropagation(); onEdit(e.id)}} className="cursor-pointer">
              <path d={path} style={{ fill: `hsl(0 0% ${lightness}%)`, filter: isHL? 'brightness(1.4)': undefined }} className="transition-all duration-150" />
              {e.title && span >= 8 && (
                <text x={labelPos.x} y={labelPos.y} fontSize={10} textAnchor="middle" dominantBaseline="middle" fill={lightness<50? '#fff':'#111'} style={{ pointerEvents:'none' }}>
                  {e.title}
                </text>
              )}
            </g>
          )
        })}
        {highlightNew && (()=>{ const startA=(highlightNew.start/1440)*360; const endA=(highlightNew.end/1440)*360; const p=arcPath(center,center,wedgeRadius,startA,endA); return <path d={p} className="fill-blue-500/60 pointer-events-none" /> })()}
        {/* hour ticks & labels (labels outside the circle) */}
        {[...Array(24)].map((_,h)=>{
          const a = (h/24)*360; const rad = (a-90)*Math.PI/180;
          const tickInner = wedgeRadius - 8; const tickOuter = wedgeRadius - 2;
          const x1=center+tickInner*Math.cos(rad); const y1=center+tickInner*Math.sin(rad);
          const x2=center+tickOuter*Math.cos(rad); const y2=center+tickOuter*Math.sin(rad);
          const labelR = wedgeRadius + 10; const lx=center+labelR*Math.cos(rad); const ly=center+labelR*Math.sin(rad);
          return <g key={h}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#777" strokeWidth={1} />
            <text x={lx} y={ly} fontSize={11} textAnchor="middle" dominantBaseline="middle" fill="#aaa">{h}</text>
          </g>
        })}
      </svg>
    </div>
  )
}

function arcPath(cx:number, cy:number, r:number, startDeg:number, endDeg:number){
  const s = polar(cx,cy,r,startDeg); const e = polar(cx,cy,r,endDeg); const large = endDeg - startDeg > 180 ? 1 : 0; return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} L ${cx} ${cy} Z`; }
function polar(cx:number, cy:number, r:number, deg:number){ const rad=(deg-90)*Math.PI/180; return { x: cx + r*Math.cos(rad), y: cy + r*Math.sin(rad) } }

// Edit Modal (simplified)
interface EditData { id?:string; start:number; end:number; title:string; shade:number }

function EditModal({ data, onClose, onSave, onDelete }:{ data: EditData|null; onClose:()=>void; onSave:(d:EditData)=>void; onDelete:(id:string)=>void }){
  const [form, setForm] = useState<EditData| null>(data)
  useEffect(()=> setForm(data), [data])
  if(!form) return null
  function update<K extends keyof EditData>(k:K, v:EditData[K]){ setForm(prev => prev ? { ...prev, [k]: v } : prev) }
  function save(){ if(form) onSave(form) }
  const times = Array.from({length:96},(_,i)=> i*15)
  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-4">
      <div className="w-full max-w-sm bg-neutral-800 text-neutral-100 rounded-xl p-4 space-y-3 max-h-[90%] overflow-y-auto shadow-xl border border-neutral-700">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-sm">予定編集</h2>
          <button onClick={onClose} className="text-xs text-neutral-400 hover:text-neutral-200">閉じる</button>
        </div>
        <div className="space-y-2">
          <input maxLength={8} value={form.title} onChange={e=>update('title', e.target.value)} placeholder="タイトル" className="w-full bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-sm placeholder:text-neutral-400" />
          <div className="flex gap-2 text-sm">
            <select value={form.start} onChange={e=>update('start', Number(e.target.value))} className="flex-1 bg-neutral-700 border border-neutral-600 rounded px-2 py-1">
              {times.map(t=> <option key={t} value={t}>{minutesToLabel(t)}</option>)}
            </select>
            <span className="self-center">～</span>
            <select value={form.end} onChange={e=>update('end', Number(e.target.value))} className="flex-1 bg-neutral-700 border border-neutral-600 rounded px-2 py-1">
              {times.slice(1).map(t=> <option key={t} value={t}>{minutesToLabel(t)}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">{[1,2,3,4,5,6,7,8,9,10].map(s=> (
            <button key={s} type="button" onClick={()=>update('shade', s)} className={`w-8 h-8 rounded-full border border-neutral-600 ${form.shade===s? 'ring-2 ring-blue-400':''}`} style={{ backgroundColor: `hsl(0 0% ${100 - s*8}%)` }} />
          ))}</div>
        </div>
        <div className="flex gap-2 pt-2 text-sm">
          {form.id && <button onClick={()=> onDelete(form.id!)} className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded py-2">削除</button>}
          <button onClick={save} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded py-2">保存</button>
        </div>
      </div>
    </div>
  )
}

export default function App(){
  const { state, dispatch } = usePersistentState()
  const schedule = state.mode==='weekday'? state.weekday : state.weekend
  const [editing, setEditing] = useState<EditData|null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [highlightId, setHighlightId] = useState<string|undefined>()
  const [highlightNew, setHighlightNew] = useState<HighlightNew|null>(null)
  function createAt(minute:number){
    setHighlightId(undefined)
    const start = minute; const end = Math.min(minute+15, 1440)
    setHighlightNew({ start, end })
    const entry: ScheduleEntry = { id: crypto.randomUUID(), title: '', start, end, shade: 5 }
    setTimeout(()=>{ setEditing(entry) }, 150)
  }
  function edit(id:string){
    const e = schedule.entries.find(e=>e.id===id); if(!e) return;
    setHighlightNew(null)
    setHighlightId(id)
    setTimeout(()=>{ setEditing({...e}) }, 150)
  }
  function save(d:EditData){
    if(!valid(d)) { setEditing(null); return }
    if(d.id && schedule.entries.some(e=> e.id===d.id)) dispatch({ type:'update', entry: d as ScheduleEntry })
    else dispatch({ type:'add', entry: d as ScheduleEntry })
    setEditing(null); setHighlightNew(null); setHighlightId(undefined)
  }
  function valid(d:EditData){ return d.title.trim().length>0 && d.end>d.start && d.end-d.start>=15 }
  return (
    <div className="min-h-screen w-full flex flex-col">
      <header className="p-2 flex gap-2 justify-center">
        <button className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${state.mode==='weekday'? 'bg-blue-600 text-white':'bg-neutral-700 text-neutral-300'}`} onClick={()=>dispatch({type:'switch', mode:'weekday'})}>平日</button>
        <button className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${state.mode==='weekend'? 'bg-blue-600 text-white':'bg-neutral-700 text-neutral-300'}`} onClick={()=>dispatch({type:'switch', mode:'weekend'})}>休日</button>
        <button className="ml-4 px-3 py-1 rounded-full text-xs font-medium bg-neutral-700 text-neutral-200 hover:bg-neutral-600" onClick={()=> setShowTemplates(true)}>テンプレ</button>
      </header>
  <main className="flex-1 flex flex-col items-center justify-center gap-4 pb-8">
        <Pie entries={schedule.entries} onAdd={createAt} onEdit={edit} highlightId={highlightId} highlightNew={highlightNew} />
        {/* 予定リストは表示しない（要件により削除） */}
      </main>
      {editing && <EditModal data={editing} onClose={()=>{setEditing(null); setHighlightId(undefined); setHighlightNew(null)}} onSave={save} onDelete={(id)=>{dispatch({type:'delete', id}); setEditing(null); setHighlightId(undefined); setHighlightNew(null)}} />}
      {showTemplates && <TemplateModal templates={state.templates} onApply={(id)=>{dispatch({type:'applyTemplate', templateId:id}); setShowTemplates(false); setHighlightId(undefined); setHighlightNew(null)}} onSave={(name)=>{dispatch({type:'saveTemplate', name}); setShowTemplates(false)}} onClose={()=> setShowTemplates(false)} />}
    </div>
  )
}

function TemplateModal({ templates, onApply, onSave, onClose }:{ templates: DayTemplate[]; onApply:(id:string)=>void; onSave:(name:string)=>void; onClose:()=>void }){
  const [name, setName] = useState('')
  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-6">
      <div className="w-full max-w-sm bg-neutral-800 text-neutral-100 rounded-xl p-4 space-y-3 max-h-[85%] overflow-y-auto shadow-xl border border-neutral-700">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-sm">テンプレート</h2>
          <button onClick={onClose} className="text-xs text-neutral-400 hover:text-neutral-200">閉じる</button>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-neutral-400">新規テンプレート名</label>
            <div className="flex gap-2 mt-1">
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="名前" className="flex-1 bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-sm" maxLength={16} />
              <button onClick={()=>{ onSave(name); setName('') }} className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded text-xs disabled:opacity-40" disabled={!name.trim()}>保存</button>
            </div>
          </div>
          <ul className="divide-y divide-neutral-700">
            {templates.map(t=> <li key={t.id} className="py-2 flex justify-between items-center text-sm">
              <span>{t.name}</span>
              <button className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs" onClick={()=> onApply(t.id)}>適用</button>
            </li>)}
            {templates.length===0 && <li className="py-6 text-center text-neutral-500 text-sm">テンプレートなし</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
