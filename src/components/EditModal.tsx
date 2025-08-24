import { useEffect, useState } from 'react'
import { SLOT_MINUTES, SHADE_LIGHTNESS } from '../constants/schedule.ts'
import type { EditData } from '../types/index.ts'
import { Wheel } from './Wheel.tsx'

export function EditModal({ data, onClose, onSave, onDelete }:{ data: EditData|null; onClose:()=>void; onSave:(d:EditData)=>void; onDelete:(id:string)=>void }){
  const [form, setForm] = useState<EditData| null>(data)
  useEffect(()=> setForm(data), [data])
  if(!form) return null
  function update<K extends keyof EditData>(k:K, v:EditData[K]){ setForm(prev => prev ? { ...prev, [k]: v } : prev) }
  function save(){ if(form) onSave(form) }
  const slots = Array.from({length: 1440 / SLOT_MINUTES}, (_,i)=> i*SLOT_MINUTES)
  const endSlots = [...slots.slice(1), 1440]
  const DURATIONS = [30, 60, 90, 120, 300];
  function applyDuration(mins:number){ if(!form) return; update('end', Math.min(1440, form.start + mins)); }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-4">
      <div className="w-full max-w-sm bg-neutral-800 text-neutral-100 rounded-xl p-4 space-y-3 max-h-[90%] overflow-y-auto shadow-xl border border-neutral-700">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-sm">予定編集</h2>
          <button onClick={onClose} className="text-xs text-neutral-400 hover:text-neutral-200">閉じる</button>
        </div>
        <div className="space-y-2">
          <input maxLength={8} value={form.title} onChange={e=>update('title', e.target.value)} placeholder="タイトル" className="w-full bg-neutral-700 border border-neutral-600 rounded px-2 py-1 placeholder:text-neutral-400" />
          <div className="flex gap-4">
            <div className="flex-1"><Wheel label="開始" value={form.start} onChange={v=>{ if(v < form.end){ update('start', v) } else { update('start', v); update('end', Math.min(1440, v + SLOT_MINUTES)) } }} options={slots} /></div>
            <div className="flex-1"><Wheel label="終了" value={form.end} onChange={v=>{ if(v>form.start){ update('end', v) } }} options={endSlots} /></div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {DURATIONS.map(d=> (
              <button key={d} type="button" onClick={()=> applyDuration(d)} className={`px-2 py-1 rounded text-[11px] border border-neutral-600 ${form.end-form.start===d? 'bg-blue-600 text-white':'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'}`}>{d<60? `${d}m` : d%60===0? `${d/60}h` : `${Math.floor(d/60)}.${(d%60)/30*5}h`}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">{[1,2,3,4,5].map(s=> (
            <button key={s} type="button" onClick={()=>update('shade', s)} className={`w-8 h-8 rounded-full border border-neutral-600 ${form.shade===s? 'ring-2 ring-blue-400':''}`} style={{ backgroundColor: `hsl(0 0% ${SHADE_LIGHTNESS[s-1]}%)` }} />
          ))}</div>
        </div>
        <div className="flex gap-2 pt-2">
          {form.id && <button onClick={()=> onDelete(form.id!)} className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded py-2">削除</button>}
          <button onClick={save} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded py-2">保存</button>
        </div>
      </div>
    </div>
  )
}
