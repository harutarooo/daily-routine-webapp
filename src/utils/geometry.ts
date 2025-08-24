export function polar(cx:number, cy:number, r:number, deg:number){ const rad=(deg-90)*Math.PI/180; return { x: cx + r*Math.cos(rad), y: cy + r*Math.sin(rad) } }
export function arcPath(cx:number, cy:number, r:number, startDeg:number, endDeg:number){
  const s = polar(cx,cy,r,startDeg); const e = polar(cx,cy,r,endDeg); const large = endDeg - startDeg > 180 ? 1 : 0; return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} L ${cx} ${cy} Z`; }
