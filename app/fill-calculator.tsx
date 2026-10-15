import {useEffect,useState} from 'react';
import {Fuel,Minus,Plus} from 'lucide-react';
import {euros,fullCost,quantityUnit} from '@/lib/experience';
type Props={quantity:number;onChange:(n:number)=>void;fuel:string;average:number|undefined};
export default function FillCalculator({quantity,onChange,fuel,average}:Props){
 const u=quantityUnit(fuel),[draft,setDraft]=useState(String(quantity)),max=u==='kg'?100:150;
 useEffect(()=>setDraft(String(quantity)),[quantity]);
 return <div className="fill-calculator" aria-label="Calcola il costo del pieno"><span className="calculator-icon"><Fuel size={20}/></span><div className="calculator-copy"><strong>Il tuo pieno, in euro.</strong><span>{average!==undefined?<>Alla media Italia: <b>{euros(fullCost(average,quantity))}</b></>:'Scegli la quantità da confrontare'}</span></div><div className="quantity-presets" role="group" aria-label="Quantità rapide">{(u==='kg'?[10,15,20,25]:[20,40,50,60]).map(n=><button key={n} className={quantity===n?'active':''} aria-pressed={quantity===n} onClick={()=>onChange(n)}>{n}<small>{u}</small></button>)}</div><div className="quantity-control"><button aria-label="Riduci quantità" onClick={()=>onChange(Math.max(1,quantity-5))}><Minus size={14}/></button><label><span className="sr-only">Quantità del pieno in {u==='kg'?'chilogrammi':'litri'}</span><input type="number" min="1" max={max} step="1" inputMode="numeric" value={draft} onChange={e=>{setDraft(e.target.value);const n=Number(e.target.value);if(Number.isInteger(n)&&n>=1&&n<=max)onChange(n);}} onBlur={()=>setDraft(String(quantity))}/><span>{u}</span></label><button aria-label="Aumenta quantità" onClick={()=>onChange(Math.min(max,quantity+5))}><Plus size={14}/></button></div></div>;
}
