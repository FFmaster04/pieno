import {useEffect,useRef,useState,type RefObject} from 'react';
import {ArrowUpRight,Search,MapPin,X,CornerDownLeft} from 'lucide-react';
import {addressOptions,normalize,type PlaceIndex,type PlaceOption,type PlaceScope} from '@/lib/search';
const cache=new Map<string,PlaceOption[]>();
type Props={index:PlaceIndex|null;query:string;setQuery:(s:string)=>void;onChoose:(s:PlaceScope)=>void;onClear:()=>void;inputRef:RefObject<HTMLInputElement|null>;anchor:[number,number]|null;indexError:boolean};
export default function PlaceSearch({index,query,setQuery,onChoose,onClear,inputRef,anchor,indexError}:Props){
 const [open,setOpen]=useState(false),[active,setActive]=useState(0),[addresses,setAddresses]=useState<PlaceOption[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const abort=useRef<AbortController|null>(null),request=useRef(0),lastRequest=useRef(0),blurTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const locals=index?.options(query)||[],isPostcode=/^(?:CAP\s*)?\d{2,5}$/i.test(query.trim()),isStreet=/^(via|viale|piazza|piazzale|corso|largo|vicolo|strada|lungomare|contrada|localita|ss\d|sp\d)\b/i.test(query.trim())&&!locals.some(o=>normalize(o.label)===normalize(query));
 const options=addresses.length?addresses:isStreet?[]:locals;
 // Editing or selecting invalidates in-flight results, including cached responses.
 const invalidate=()=>{request.current++;abort.current?.abort();setBusy(false);setAddresses([]);setMessage('');setActive(0);};
 useEffect(()=>{if(active>0)document.getElementById('place-option-'+active)?.scrollIntoView({block:'nearest'});},[active]);
 useEffect(()=>()=>{abort.current?.abort();if(blurTimer.current)clearTimeout(blurTimer.current);},[]);
 function choose(option:PlaceOption){invalidate();setOpen(false);onChoose(option.scope);inputRef.current?.blur();}
 async function findAddress(){
  if(query.trim().length<4){setMessage('Inserisci la strada e il comune, per esempio “Via Roma, Lecce”.');setOpen(true);return;}
  const text=query.trim(),key=normalize(text)+(anchor?anchor.map(n=>n.toFixed(2)).join(','):''),seq=++request.current;
  abort.current?.abort();setOpen(true);setActive(0);setAddresses([]);setMessage('');
  if(cache.has(key)){const found=cache.get(key)!;setAddresses(found);setBusy(false);if(!found.length)setMessage('Nessun indirizzo trovato. Aggiungi il comune e riprova.');return;}
  if(Date.now()-lastRequest.current<1100){setBusy(false);setMessage('Attendi un istante prima di riprovare.');return;}
  lastRequest.current=Date.now();const controller=new AbortController();abort.current=controller;setBusy(true);
  const timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const params=new URLSearchParams({q:text,countrycode:'IT',limit:'8'});if(anchor){params.set('lat',anchor[0].toFixed(2));params.set('lon',anchor[1].toFixed(2));}
   const response=await fetch('https://photon.komoot.io/api/?'+params,{signal:controller.signal});if(!response.ok)throw Error();
   const found=addressOptions(await response.json());if(seq!==request.current)return;
   cache.set(key,found);if(cache.size>30)cache.delete(cache.keys().next().value!);setAddresses(found);
   if(!found.length)setMessage('Nessun indirizzo trovato. Aggiungi il comune e riprova.');
  }catch{if(seq===request.current)setMessage('La ricerca indirizzi non risponde. Riprova tra poco; città, province e CAP restano disponibili.');}
  finally{clearTimeout(timeout);if(seq===request.current)setBusy(false);}
 }
 const submit=()=>{if(options[active])choose(options[active]);else if(isPostcode){setOpen(true);setMessage('Nessun CAP trovato. Controlla le cinque cifre del codice postale.');}else findAddress();};
 const show=open&&query.trim().length>0;
 return <div className="search-box">
  <Search size={20}/><div className="input-wrap"><label className="sr-only" htmlFor="place-search">Cerca città, provincia, indirizzo o CAP</label>
   <input ref={inputRef} id="place-search" placeholder="Città, provincia, indirizzo o CAP" value={query} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={show} aria-controls="place-suggestions" aria-activedescendant={show&&options[active]?'place-option-'+active:undefined}
    onChange={e=>{invalidate();setQuery(e.target.value);setOpen(true);}} onFocus={()=>{if(blurTimer.current)clearTimeout(blurTimer.current);setOpen(true);}}
    onBlur={()=>{blurTimer.current=setTimeout(()=>setOpen(false),180);}}
    onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);setActive(n=>(n+(e.key==='ArrowDown'?1:-1)+Math.max(options.length,1))%Math.max(options.length,1));}if(e.key==='Enter'){e.preventDefault();submit();}if(e.key==='Escape'){setOpen(false);abort.current?.abort();request.current++;setBusy(false);}}}/>
   {query&&<button className="clear-search" aria-label="Cancella ricerca e mostra tutta Italia" onMouseDown={e=>e.preventDefault()} onClick={()=>{invalidate();setOpen(false);onClear();}}><X size={16}/></button>}
  </div>
  <button className="search-submit" aria-label="Avvia ricerca" title="Cerca" onMouseDown={e=>e.preventDefault()} onClick={submit} disabled={busy}>{busy?<span className="spinner"/>:<ArrowUpRight size={19}/>}</button>
  {show&&<div className="suggestions place-suggestions" onMouseDown={e=>e.preventDefault()}>
   <div className="suggestions-caption">{addresses.length?'INDIRIZZI TROVATI':isPostcode?'CERCA PER CAP':'SCEGLI L’AREA'}</div>
   <div id="place-suggestions" role="listbox" aria-label="Località e indirizzi">{options.map((o,i)=><button key={o.id} id={'place-option-'+i} role="option" aria-selected={i===active} className={'place-option '+(i===active?'active':'')} onClick={()=>choose(o)}><span className={'place-option-icon '+o.scope.kind}><MapPin size={17}/></span><span className="place-option-text">{o.label}<small>{o.detail}</small></span><span className="place-badge">{o.badge}</span><ArrowUpRight size={14}/></button>)}</div>
   {busy?<p className="search-status" role="status"><span className="spinner"/> Cerco la strada in Italia…</p>:message?<p className="search-status" role="status">{message}</p>:!options.length&&!isStreet?<p className="search-status">{!index&&!indexError?'Caricamento località…':indexError?'Indice locale non disponibile. Ricarica la pagina o cerca un indirizzo.':isPostcode?'Nessun CAP trovato. Controlla il codice postale.':'Nessuna località trovata. Per una strada, aggiungi anche il comune.'}</p>:null}
   {!addresses.length&&!busy&&!isPostcode&&<button className="address-search-action" onClick={findAddress}><Search size={14}/><span>Cerca «{query.trim()}» come indirizzo<small>Scrivi anche il comune, poi premi Invio</small></span><CornerDownLeft size={14}/></button>}
   {addresses.length>0&&<p className="geocoder-credit">Indirizzi © OpenStreetMap · ricerca Photon</p>}
  </div>}
 </div>;
}
