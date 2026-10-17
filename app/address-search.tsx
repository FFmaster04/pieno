import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowRight,ArrowUpRight,Check,House,MapPin,Search} from 'lucide-react';
import {lookupAddress,type ManualAddress} from '@/lib/geocoding';
import type {PlaceOption,PlaceScope} from '@/lib/search';
type Props={city:string;onChoose:(scope:PlaceScope)=>void};
export default function AddressSearch({city,onChoose}:Props){
 const [fields,setFields]=useState<ManualAddress>({street:'',houseNumber:'',city,postcode:''});
 const [radius,setRadius]=useState(3),[results,setResults]=useState<PlaceOption[]>([]),[busy,setBusy]=useState(false),[searched,setSearched]=useState(false),[message,setMessage]=useState('');
 const request=useRef(0),controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>{request.current++;controller.current?.abort();},[]);
 function edit(key:keyof ManualAddress,value:string){
  request.current++;controller.current?.abort();setBusy(false);setResults([]);setSearched(false);setMessage('');
  setFields(previous=>({...previous,[key]:value}));
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const sequence=++request.current;
  controller.current?.abort();const abort=new AbortController();controller.current=abort;
  setBusy(true);setResults([]);setMessage('');setSearched(true);
  const timeout=setTimeout(()=>abort.abort(),15000);
  try{
   const found=await lookupAddress(fields,null,abort.signal);
   if(sequence!==request.current)return;
   setResults(found);
   if(!found.length)setMessage(fields.houseNumber?'Non troviamo questo civico. Prova senza numero oppure controlla via, comune e CAP.':'Nessun indirizzo trovato. Controlla il nome della strada, il comune e il CAP.');
  }catch(error){
   if(sequence===request.current)setMessage((error as Error).name==='AbortError'?'La ricerca ha impiegato troppo tempo. Riprova tra poco.':(error as Error).message);
  }finally{clearTimeout(timeout);if(sequence===request.current)setBusy(false);}
 }
 const approximate=results.length>0&&!!fields.houseNumber&&results.every(o=>o.precision==='street');
 return <>
  <span className="detail-kicker">PARTI DALLA TUA STRADA</span>
  <h2>Un indirizzo.<br/>Le soste intorno.</h2>
  <p className="modal-lead">Inserisci la tua strada, anche con il numero civico. Trova il pieno più vicino al punto che scegli.</p>
  <form className="address-form" onSubmit={submit}>
   <div className="address-fields">
    <label className="address-street">Via o piazza<input autoFocus autoComplete="address-line1" name="street" placeholder="Es. Via Salvatore Trinchese" value={fields.street} onChange={e=>edit('street',e.target.value)} required maxLength={160}/></label>
    <label className="address-number">Numero civico<input autoComplete="address-line2" name="houseNumber" placeholder="Es. 24/A" value={fields.houseNumber} onChange={e=>edit('houseNumber',e.target.value)} maxLength={20}/><small>Facoltativo</small></label>
    <label className="address-city">Comune<input autoComplete="address-level2" name="city" placeholder="Es. Lecce" value={fields.city} onChange={e=>edit('city',e.target.value)} required maxLength={100}/></label>
    <label className="address-postcode">CAP<input autoComplete="postal-code" name="postcode" inputMode="numeric" pattern="[0-9]{5}" placeholder="Es. 73100" value={fields.postcode} onChange={e=>edit('postcode',e.target.value)} maxLength={5}/><small>Facoltativo · 5 cifre</small></label>
   </div>
   <div className="address-radius"><span>Cerca nei dintorni</span><div role="group" aria-label="Raggio di ricerca">{[1,3,5].map(km=><button type="button" key={km} onClick={()=>setRadius(km)} aria-pressed={radius===km} className={radius===km?'active':''}>{km} km{radius===km&&<Check size={11}/>}</button>)}</div></div>
   <button type="submit" className="address-find" disabled={busy}>{busy?<span className="spinner"/>:<Search size={17}/>} {busy?'Cerco il tuo indirizzo…':'Cerca indirizzo'}{!busy&&<ArrowRight size={18}/>}</button>
  </form>
  <div className="address-feedback" aria-live="polite" aria-busy={busy}>
   {message&&<p className="address-message" role="status"><MapPin size={17}/>{message}</p>}
   {results.length>0&&<div className="address-results">
    <div className="address-results-title"><span>{approximate?'LA STRADA È QUI':'SCEGLI IL PUNTO SULLA MAPPA'}</span><small>{results.length} {results.length===1?'risultato':'risultati'}</small></div>
    {approximate&&<p className="address-approximation">Il civico non risulta nella mappa. Puoi scegliere il punto della strada e cercare nei dintorni.</p>}
    {results.map(option=><button key={option.id} className="address-result" onClick={()=>onChoose({...option.scope,...(option.scope.kind==='address'?{radius}:{})})}><span className="address-result-icon">{option.precision==='house'?<House size={18}/>:<MapPin size={18}/>}</span><span><strong>{option.label}</strong><small>{option.detail}</small><em>{option.precision==='house'?'Numero civico trovato':'Posizione della strada'}</em></span><ArrowUpRight size={18}/></button>)}
   </div>}
   {searched&&results.length>0&&<p className="address-credit">Indirizzi © OpenStreetMap · ricerca Photon. Distanze in linea d’aria.</p>}
  </div>
  {!searched&&<div className="address-tip"><MapPin size={17}/><p>La copertura dei civici dipende dalla mappa. Quando manca un numero, ti indichiamo chiaramente la posizione della strada.</p></div>}
 </>;
}
