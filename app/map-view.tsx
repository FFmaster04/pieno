'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Plus,Minus,LocateFixed,Maximize2,Minimize2,Compass,MapPin,Sun,Moon,Sparkles,ArrowUpRight,ArrowDownRight,Trophy,X,Layers} from 'lucide-react';
import type * as Leaflet from 'leaflet';
import {priceLevel,priceLevelLabel,priceLevelSymbol} from '@/lib/price-level';
import {euros,fullCost,saving,quantityUnit,shortFuel} from '@/lib/experience';
import {summarizeMap,groupMapItems} from '@/lib/map-experience';
import type {Station,Price,Bounds} from '@/lib/types';
export type Candidate={station:Station;price:Price};
export type MapCommand={lat:number;lng:number;zoom:number;key:number}|{italy:true;key:number}|{bounds:[[number,number],[number,number]];maxZoom:number;key:number};
type Props={items:Candidate[];average:number|undefined;fuel:string;mode:string;quantity:number;selected:number|null;onSelect:(s:Station)=>void;onBounds:(b:Bounds)=>void;command:MapCommand|null;onLocate:()=>void;location:[number,number]|null;searchArea:{lat:number;lng:number;radius:number}|null;onReset:()=>void;loading:boolean;offline:boolean};
const fmt=(n:number)=>n.toFixed(3).replace('.',',');
const pretty=(s:string)=>s.toLocaleLowerCase('it-IT').replace(/(^|[\s/'-])\p{L}/gu,s=>s.toLocaleUpperCase('it-IT'));
const motion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:.7;

export default function MapView({items,average,fuel,mode,quantity,selected,onSelect,onBounds,command,onLocate,location,searchArea,onReset,loading,offline}:Props){
 const node=useRef<HTMLDivElement>(null),shell=useRef<HTMLDivElement>(null),map=useRef<Leaflet.Map|null>(null),L=useRef<typeof Leaflet|null>(null),layer=useRef<Leaflet.LayerGroup|null>(null),position=useRef<Leaflet.LayerGroup|null>(null);
 const [ready,setReady]=useState(false),[revision,setRevision]=useState(0),[tileError,setTileError]=useState(false);
 const [theme,setTheme]=useState<'night'|'day'>('night'),[lens,setLens]=useState(false),[peekId,setPeekId]=useState<number|null>(null),[fullscreen,setFullscreen]=useState(false),[canExpand,setCanExpand]=useState(false),[stack,setStack]=useState<Candidate[]|null>(null);
 const selectRef=useRef(onSelect),boundsRef=useRef(onBounds);selectRef.current=onSelect;boundsRef.current=onBounds;
 useEffect(()=>{setCanExpand(!!document.fullscreenEnabled);const update=()=>setFullscreen(document.fullscreenElement===shell.current);document.addEventListener('fullscreenchange',update);return()=>document.removeEventListener('fullscreenchange',update);},[]);
 useEffect(()=>{let disposed=false;
  import('leaflet').then(leaflet=>{if(disposed||!node.current)return;L.current=leaflet;
   const m=leaflet.map(node.current,{zoomControl:false,attributionControl:true,zoomSnap:.25,minZoom:4,maxZoom:19,worldCopyJump:false,maxBounds:[[30,-5],[54,30]],maxBoundsViscosity:.8,scrollWheelZoom:false});map.current=m;
   const tiles=leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',maxZoom:19,keepBuffer:1});
   tiles.on('tileerror',()=>{if(!disposed)setTileError(true);});tiles.on('load',()=>{if(!disposed&&node.current?.querySelector('.leaflet-tile-loaded'))setTileError(false);});tiles.addTo(m);
   m.fitBounds([[35.45,6.4],[47.25,18.8]],{padding:[25,25],animate:false});
   layer.current=leaflet.layerGroup().addTo(m);position.current=leaflet.layerGroup().addTo(m);
   const update=()=>{const b=m.getBounds();boundsRef.current({north:b.getNorth(),south:b.getSouth(),east:b.getEast(),west:b.getWest(),zoom:m.getZoom()});setRevision(n=>n+1);};m.on('moveend',update);update();
   const resize=new ResizeObserver(()=>{if(node.current&&node.current.clientWidth>0&&node.current.clientHeight>0)m.invalidateSize();});resize.observe(node.current);(m as Leaflet.Map&{_pienoResize?:ResizeObserver})._pienoResize=resize;
   setReady(true);
  });
  return()=>{disposed=true;if(map.current){(map.current as Leaflet.Map&{_pienoResize?:ResizeObserver})._pienoResize?.disconnect();map.current.remove();map.current=null;}};
 },[]);
 const overview=useMemo(()=>{const b=map.current?.getBounds();return summarizeMap(items,b?{north:b.getNorth(),south:b.getSouth(),east:b.getEast(),west:b.getWest(),zoom:map.current!.getZoom()}:null,average);},[items,average,ready,revision]);
 const peek=useMemo(()=>items.find(e=>e.station.id===peekId),[items,peekId]);
 const focusId=peek?.station.id??selected;
 useEffect(()=>{setPeekId(null);setStack(null);},[fuel,mode,command?.key,items]);
 useEffect(()=>{const m=map.current,l=L.current,g=layer.current;if(!ready||!m||!l||!g)return;g.clearLayers();
  const bounds=m.getBounds().pad(.06),zoom=m.getZoom();
  const inside=items.filter(e=>bounds.contains([e.station.lat,e.station.lng]));
  const pinned=inside.find(e=>e.station.id===focusId);
  const groups=groupMapItems(inside.filter(e=>e!==pinned),e=>m.project([e.station.lat,e.station.lng],zoom));
  if(pinned)groups.push([pinned]);
  for(const entries of groups){
   if(entries.length>1){const {lat:la,lng:lo}=entries[0].station,min=entries[0].price.price;
    const active=entries.some(e=>e.station.id===focusId),level=priceLevel(min,average),label=entries.length>999?(entries.length/1000).toFixed(1).replace('.',',')+'k':String(entries.length);
    const icon=l.divIcon({className:'cluster-wrap price-'+level,html:'<span class="map-halo" aria-hidden="true"></span><div class="map-cluster '+(active?'is-selected':'')+'"><span class="cluster-amount">'+label+' <span>distributori</span></span><b><small>da</small> '+fmt(min)+'</b><span class="cluster-arrow" aria-hidden="true">↗</span></div>',iconSize:[104,62],iconAnchor:[52,31]});
    const marker=l.marker([la,lo],{icon,keyboard:true,title:entries.length+' distributori, da '+fmt(min)+' euro. '+priceLevelLabel[level]+'. Premi per ingrandire.',zIndexOffset:active?1000:0}).addTo(g);
    marker.on('click',()=>{if(zoom>=19){setStack(entries);return;}const points=entries.map(e=>[e.station.lat,e.station.lng] as [number,number]);m.flyToBounds(points,{padding:[70,100],maxZoom:Math.min(19,zoom+3),duration:motion(),animate:motion()>0});});
   }else{const {station:s,price:p}=entries[0],level=priceLevel(p.price,average),isBest=s.id===overview.best?.station.id;
    const icon=l.divIcon({className:'price-wrap price-'+level+(isBest?' best-in-view':''),html:'<span class="map-halo" aria-hidden="true"></span><div class="map-price price-'+level+' '+(s.id===focusId?'is-selected':'')+'">'+(isBest?'<span class="marker-best" aria-hidden="true">★</span>':'')+'<span class="map-price-symbol" aria-hidden="true">'+priceLevelSymbol[level]+'</span><span>'+fmt(p.price)+'</span></div>',iconSize:[88,44],iconAnchor:[44,22]});
    const marker=l.marker([s.lat,s.lng],{icon,title:s.brand+', '+s.city+': '+fmt(p.price)+' euro. '+priceLevelLabel[level]+(isBest?'. Prezzo più basso in questa vista.':'.'),zIndexOffset:s.id===focusId?1500:isBest?1000:level==='lower'?500:0}).addTo(g);marker.on('click',()=>{setStack(null);setPeekId(s.id);});
   }
  }
 },[items,average,focusId,ready,revision,overview.best?.station.id]);
 useEffect(()=>{if(!ready||!map.current||!command)return;const m=map.current,duration=motion();if('italy'in command)m.flyToBounds([[35.45,6.4],[47.25,18.8]],{padding:[25,25],duration,animate:duration>0});else if('bounds'in command)m.flyToBounds(command.bounds,{padding:[35,35],maxZoom:command.maxZoom,duration,animate:duration>0});else m.flyTo([command.lat,command.lng],command.zoom,{duration,animate:duration>0});},[command,ready]);
 useEffect(()=>{const l=L.current,g=position.current;if(!ready||!l||!g)return;g.clearLayers();if(location){l.circleMarker(location,{radius:9,color:'#fff',weight:3,fillColor:'#307aeb',fillOpacity:1}).addTo(g);l.circle(location,{radius:250,color:'#307aeb',weight:1,fillOpacity:.07}).addTo(g);}if(searchArea){const point:[number,number]=[searchArea.lat,searchArea.lng];l.circle(point,{radius:searchArea.radius*1000,color:'#a8ce62',weight:1.5,dashArray:'5 6',fillColor:'#b6d47b',fillOpacity:.08,interactive:false}).addTo(g);l.circleMarker(point,{radius:7,color:'#fff',weight:3,fillColor:'#78983b',fillOpacity:1,interactive:false}).addTo(g);}},[location,searchArea,ready]);
 const expand=async()=>{try{if(document.fullscreenElement===shell.current)await document.exitFullscreen();else await shell.current?.requestFullscreen();}catch{setCanExpand(false);}};
 const openDetails=async(s:Station)=>{if(document.fullscreenElement===shell.current)await document.exitFullscreen();selectRef.current(s);};
 const discover=()=>{const best=overview.best;if(!best||!map.current)return;setPeekId(best.station.id);map.current.flyTo([best.station.lat,best.station.lng],Math.max(16,map.current.getZoom()),{duration:motion(),animate:motion()>0});};
 const featured=peek||overview.best,level=priceLevel(featured?.price.price,average),saved=featured?saving(featured.price.price,average,quantity):null;
 return <div ref={shell} className={'map-shell map-atlas map-theme-'+theme+(lens?' map-lens':'')+(fullscreen?' map-expanded':'')}>
  <div ref={node} className="map" aria-label="Mappa interattiva dei distributori italiani" />
  <div className="map-vignette" aria-hidden="true"/>
  <div className="atlas-toolbar">
   <div className="atlas-view-switch" role="group" aria-label="Vista della mappa"><button className={!lens?'active':''} aria-pressed={!lens} onClick={()=>setLens(false)}><Layers size={14}/>Prezzi</button><button className={lens?'active':''} aria-pressed={lens} onClick={()=>setLens(true)}><Sparkles size={14}/>Convenienza</button></div>
   <div className="atlas-tools"><button className="atlas-theme" aria-label={theme==='night'?'Passa alla mappa chiara':'Passa alla mappa notturna'} onClick={()=>setTheme(theme==='night'?'day':'night')}>{theme==='night'?<Sun size={16}/>:<Moon size={16}/>}</button>{canExpand&&<button className="atlas-expand" aria-label={fullscreen?'Esci dallo schermo intero':'Espandi mappa'} onClick={expand}>{fullscreen?<Minimize2 size={16}/>:<Maximize2 size={16}/>}</button>}<button className="map-italy" onClick={onReset}><Compass size={14}/><span>Tutta Italia</span></button></div>
  </div>
  <div className="atlas-caption"><span className="atlas-dot"/>{loading?'Caricamento dati…':overview.total.toLocaleString('it-IT')+(overview.total===1?' distributore in questa vista':' distributori in questa vista')}{lens&&<span className="lens-caption">Le offerte sotto media si accendono.</span>}</div>
  <div className="map-controls"><span className="north">N<Compass size={22}/></span><div className="zoom-controls"><button aria-label="Ingrandisci mappa" onClick={()=>map.current?.zoomIn()}><Plus size={20}/></button><button aria-label="Riduci mappa" onClick={()=>map.current?.zoomOut()}><Minus size={20}/></button></div><button className="locate-map" aria-label="Trova la mia posizione" onClick={onLocate}><LocateFixed size={20}/></button></div>
  {featured&&!stack&&!offline&&!loading&&<div className={'map-discovery price-'+level+(peek?' is-preview':'')} aria-label={peek?'Anteprima distributore':'Prezzo più basso nella mappa visibile'}>
   <div className="discovery-kicker">{peek?<MapPin size={13}/>:<Trophy size={13}/>}<span>{peek?'LA TUA PROSSIMA SOSTA':'IL MIGLIORE IN QUESTA VISTA'}</span>{peek&&<button aria-label="Chiudi anteprima distributore" onClick={()=>setPeekId(null)}><X size={15}/></button>}</div>
   <div className="discovery-main"><div><strong className="discovery-price">{fmt(featured.price.price)}<small>€/{quantityUnit(fuel)}</small></strong><span className="discovery-brand">{featured.station.brand==='Agip Eni'?'Eni':featured.station.brand} · {pretty(featured.station.city)}</span></div><div className="discovery-total"><span>IL TUO PIENO · {quantity} {quantityUnit(fuel)}</span><strong>{euros(fullCost(featured.price.price,quantity))}</strong></div></div>
   {peek&&<p className="discovery-address">{pretty(featured.station.address)}</p>}
   <div className="discovery-bottom"><span className="discovery-saving">{saved!==null&&saved>0?<><ArrowDownRight size={14}/>{euros(saved)} in meno<span> vs media Italia</span></>:<>{priceLevelSymbol[level]} {priceLevelLabel[level]}</>}</span><button onClick={()=>peek?openDetails(featured.station):discover()}>{peek?'Tutti i prezzi':'Inquadra'}<ArrowUpRight size={16}/></button></div>
  </div>}
  {stack&&!offline&&<div className="map-stack" aria-label="Distributori nello stesso punto"><div className="discovery-kicker"><Layers size={13}/><span>{stack.length} DISTRIBUTORI VICINI</span><button aria-label="Chiudi gruppo distributori" onClick={()=>setStack(null)}><X size={15}/></button></div><div className="stack-items">{stack.map(item=><button key={item.station.id} onClick={()=>{setPeekId(item.station.id);setStack(null);}}><span><strong>{item.station.brand}</strong><small>{pretty(item.station.address)}</small></span><b className={'price-'+priceLevel(item.price.price,average)}>{fmt(item.price.price)}</b><ArrowUpRight size={15}/></button>)}</div></div>}
  {!loading&&ready&&overview.total===0&&!offline&&<div className="atlas-empty"><MapPin size={20}/><strong>Una nuova zona da esplorare.</strong><span>Allarga la mappa o cambia carburante.</span><button onClick={onReset}>Torna in Italia <ArrowUpRight size={14}/></button></div>}
  <div className="atlas-legend-row"><div className="map-legend" aria-label="Legenda prezzi rispetto alla media nazionale"><div className="legend-levels"><span className="price-lower"><i/> Sotto media</span><span className="price-average"><i/> In linea</span><span className="price-higher"><i/> Sopra media</span></div><small>{average===undefined?'Media non disponibile':'Media Italia '+fmt(average)+' €/'+quantityUnit(fuel)} · {shortFuel(fuel)} {mode==='self'?'self':'servito'}</small><small className="legend-tolerance">In linea entro ±1 centesimo · gruppi: prezzo minimo</small></div>{overview.total>0&&average!==undefined&&<div className="atlas-ratio"><span><b>{overview.lower.toLocaleString('it-IT')}</b> su {overview.total.toLocaleString('it-IT')} sotto media</span><i><span style={{width:overview.lower/overview.total*100+'%'}}/></i></div>}</div>
  {offline&&<div className="map-offline"><MapPin size={26}/><strong>La mappa si prende una pausa.</strong><span>I listini salvati sono disponibili nell’elenco.<br/>La cartografia torna quando sei online.</span></div>}
  {tileError&&!offline&&<div className="map-error" role="status"><MapPin size={18}/> La cartografia è temporaneamente indisponibile. Puoi consultare tutti i prezzi nell’elenco.</div>}
  {!ready&&<div className="map-loading"><span className="spinner"/> Apriamo la mappa…</div>}
 </div>;
}
