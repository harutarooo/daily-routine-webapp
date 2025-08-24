import { useState } from 'react'
// ...分離したモジュールをインポート
import { usePersistentState } from './hooks/usePersistentState.ts'
import { SLOT_MINUTES, MINUTES_PER_DAY } from './constants/schedule.ts'
import { Pie } from './components/Pie.tsx'
import { EditModal } from './components/EditModal.tsx'
import { TemplateModal } from './components/TemplateModal.tsx'
import type { ScheduleEntry, EditData } from './types/index.ts'

export default function App(){
  const { state, dispatch } = usePersistentState()
  const schedule = state.mode==='weekday'? state.weekday : state.weekend
  const [editing, setEditing] = useState<EditData|null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [highlightId, setHighlightId] = useState<string|undefined>()
  const [highlightNew, setHighlightNew] = useState<{start:number; end:number}|null>(null)

  function createAt(minute:number){
    setHighlightId(undefined)
  const start = minute; const end = Math.min(minute+SLOT_MINUTES, MINUTES_PER_DAY)
    setHighlightNew({ start, end })
  const entry: ScheduleEntry = { id: crypto.randomUUID(), title: '', start, end, shade: 2 }
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
  function valid(d:EditData){ return d.title.trim().length>0 && d.end>d.start && d.end-d.start>=SLOT_MINUTES }
  return (
    <div className="min-h-screen w-full flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center gap-4 pb-24 pt-2">
        <Pie entries={schedule.entries} onAdd={createAt} onEdit={edit} highlightId={highlightId} highlightNew={highlightNew} />
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur border-t border-neutral-700 p-3 flex items-center justify-center gap-3">
        <button className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${state.mode==='weekday'? 'bg-blue-600 text-white':'bg-neutral-700 text-neutral-300'}`} onClick={()=>dispatch({type:'switch', mode:'weekday'})}>平日</button>
        <button className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${state.mode==='weekend'? 'bg-blue-600 text-white':'bg-neutral-700 text-neutral-300'}`} onClick={()=>dispatch({type:'switch', mode:'weekend'})}>休日</button>
        <button className="ml-2 px-4 py-2 rounded-full text-xs font-medium bg-neutral-700 text-neutral-200 hover:bg-neutral-600" onClick={()=> setShowTemplates(true)}>テンプレ</button>
      </footer>
      {editing && <EditModal data={editing} onClose={()=>{setEditing(null); setHighlightId(undefined); setHighlightNew(null)}} onSave={save} onDelete={(id)=>{dispatch({type:'delete', id}); setEditing(null); setHighlightId(undefined); setHighlightNew(null)}} />}
      {showTemplates && <TemplateModal templates={state.templates} onApply={(id)=>{dispatch({type:'applyTemplate', templateId:id}); setShowTemplates(false); setHighlightId(undefined); setHighlightNew(null)}} onSave={(name)=>{dispatch({type:'saveTemplate', name}); setShowTemplates(false)}} onClose={()=> setShowTemplates(false)} />}
    </div>
  )
}
