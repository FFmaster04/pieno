import {priceLevel} from './price-level.ts';
import type {Bounds,Price,Station} from './types';

export type MapCandidate={station:Station;price:Price};
// Each group stays anchored to its cheapest station. Fixed anchors keep labels apart.
export function groupMapItems(items:MapCandidate[],project:(item:MapCandidate)=>{x:number;y:number},width=116,height=78){
 const groups:{items:MapCandidate[];x:number;y:number}[]=[],cells=new Map<string,number[]>();
 for(const item of [...items].sort((a,b)=>a.price.price-b.price.price||a.station.id-b.station.id)){
  const p=project(item),cx=Math.floor(p.x/width),cy=Math.floor(p.y/height);
  let target=-1;
  for(let x=cx-1;x<=cx+1&&target<0;x++)for(let y=cy-1;y<=cy+1&&target<0;y++)for(const i of cells.get(x+','+y)||[]){const g=groups[i];if(Math.abs(g.x-p.x)<width&&Math.abs(g.y-p.y)<height){target=i;break;}}
  if(target>=0)groups[target].items.push(item);
  else{const key=cx+','+cy,indices=cells.get(key)||[];indices.push(groups.length);cells.set(key,indices);groups.push({items:[item],x:p.x,y:p.y});}
 }
 return groups.map(g=>g.items);
}
export function summarizeMap(items:MapCandidate[],bounds:Bounds|null,average:number|undefined){
 const visible=bounds?items.filter(({station:s})=>s.lat>=bounds.south&&s.lat<=bounds.north&&s.lng>=bounds.west&&s.lng<=bounds.east):[];
 let best:MapCandidate|null=null,lower=0;
 for(const item of visible){
  if(!best||item.price.price<best.price.price||(item.price.price===best.price.price&&item.station.id<best.station.id))best=item;
  if(priceLevel(item.price.price,average)==='lower')lower++;
 }
 return {best,total:visible.length,lower};
}
