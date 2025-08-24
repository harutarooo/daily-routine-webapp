import { useState } from 'react'
import type { DayTemplate } from '../types/index.ts'

export function TemplateModal({ templates, onApply, onSave, onClose }:{ templates: DayTemplate[]; onApply:(id:string)=>void; onSave:(name:string)=>void; onClose:()=>void }){
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
