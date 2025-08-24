import { arcPath, polar } from '../utils/geometry.ts'
import { SLOT_MINUTES, SHADE_LIGHTNESS, MINUTES_PER_DAY, normalizeShade } from '../constants/schedule.ts'
import type { ScheduleEntry } from '../types/index.ts'

export interface HighlightNew { start:number; end:number }

interface PieProps { entries: ScheduleEntry[]; onAdd:(minute:number)=>void; onEdit:(id:string)=>void; highlightId?:string; highlightNew?:HighlightNew|null }
export function Pie({ entries, onAdd, onEdit, highlightId, highlightNew }: PieProps){
  const size = 380;
  const margin = 20;
  const center = size/2;
  const wedgeRadius = center - margin;
  function handleClick(e: React.MouseEvent<SVGSVGElement>){
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;
    const angle = (Math.atan2(y,x) * 180/Math.PI + 450) % 360;
  const minutes = Math.round((angle/360)*MINUTES_PER_DAY/SLOT_MINUTES)*SLOT_MINUTES % MINUTES_PER_DAY;
    onAdd(minutes);
  }
  return (
    <div className="w-full flex flex-col items-center">
      <svg width={size} height={size} onClick={handleClick} className="touch-none select-none">
        <circle cx={center} cy={center} r={wedgeRadius} className="fill-neutral-800" />
        {entries.map(e=>{
          const startA = (e.start/MINUTES_PER_DAY)*360; const endA = (e.end/MINUTES_PER_DAY)*360;
          const path = arcPath(center, center, wedgeRadius, startA, endA)
          const lightness = SHADE_LIGHTNESS[normalizeShade(e.shade)-1] ?? 50;
          const isHL = highlightId===e.id;
          const midA = (startA + endA)/2;
          const labelPos = polar(center, center, wedgeRadius*0.55, midA);
          return (
            <g key={e.id} onClick={(ev)=>{ev.stopPropagation(); onEdit(e.id)}} className="cursor-pointer">
              <path d={path} style={{ fill: `hsl(0 0% ${lightness}%)`, filter: isHL? 'brightness(1.5)': undefined }} className="transition-all duration-150" />
              {e.title && (
                <text x={labelPos.x} y={labelPos.y} fontSize={10} textAnchor="middle" dominantBaseline="middle" fill="#999" style={{ pointerEvents:'none' }}>
                  {e.title}
                </text>
              )}
            </g>
          )
        })}
  {highlightNew && (()=>{ const startA=(highlightNew.start/MINUTES_PER_DAY)*360; const endA=(highlightNew.end/MINUTES_PER_DAY)*360; const p=arcPath(center,center,wedgeRadius,startA,endA); return <path d={p} className="fill-blue-500/60 pointer-events-none" /> })()}
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
