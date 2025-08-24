import { minutesToLabel } from '../utils/time.ts'
interface WheelProps { label: string; value: number; options: number[]; onChange:(val:number)=>void }
export function Wheel({ label, value, options, onChange }: WheelProps){
  const visible = 5;
  const itemHeight = 36;
  const containerHeight = itemHeight * visible;
  const selectedIndex = Math.max(0, options.indexOf(value));
  return (
    <div className="flex flex-col items-center text-xs select-none">
      <span className="mb-1 text-neutral-400">{label}</span>
      <div
        className="relative w-full overflow-y-scroll no-scrollbar snap-y snap-mandatory rounded border border-neutral-600 bg-neutral-700"
        style={{ height: containerHeight }}
        onScroll={e=>{
          const top = (e.target as HTMLElement).scrollTop;
          const idx = Math.round(top / itemHeight);
          const clamped = Math.min(options.length-1, Math.max(0, idx));
          const newVal = options[clamped];
          if(newVal !== value) onChange(newVal);
        }}
        ref={el=>{
          if(el){
            const desired = selectedIndex * itemHeight;
            if(Math.abs(el.scrollTop - desired) > 4) el.scrollTop = desired;
          }
        }}
      >
        <div style={{ paddingTop: itemHeight*2, paddingBottom: itemHeight*2 }}>
          {options.map(opt=> (
            <div key={opt}
              className={"h-9 flex items-center justify-center snap-start transition-colors " + (opt===value? 'bg-blue-500/40 text-white font-semibold rounded':'text-neutral-300')}
              style={{ height: itemHeight }}
              onClick={()=> onChange(opt)}
            >{minutesToLabel(opt)}</div>
          ))}
        </div>
        <div className="pointer-events-none absolute top-1/2 left-0 w-full h-9 -translate-y-1/2 border-y border-blue-400/60" />
      </div>
    </div>
  )
}
