'use client';
import {useEffect,useRef,useState} from 'react';
import {Plus,Minus,LocateFixed,Maximize2,Compass,MapPin} from 'lucide-react';
import type * as Leaflet from 'leaflet';
import type {Station,Price,Bounds} from '@/lib/types';
export type Candidate={station:Station;price:Price};
export type MapCommand={lat:number;lng:number;zoom:number;key:number}|{italy:true;key:number}|{bounds:[[number,number],[number,number]];maxZoom:number;key:number};
type Props={items:Candidate[];average:number|undefined;selected:number|null;onSelect:(s:Station)=>void;onBounds:(b:Bounds)=>void;command:MapCommand|null;onLocate:()=>void;location:[number,number]|null;searchArea:{lat:number;lng:number;radius:number}|null;onReset:()=>void;loading:boolean;offline:boolean};
export default function MapView({items,average,selected,onSelect,onBounds,command,onLocate,location,searchArea,onReset,loading,offline}:Props){
 const node=useRef<HTMLDivElement>(null),map=useRef<Leaflet.Map|null>(null),L=useRef<typeof Leaflet|null>(null),layer=useRef<Leaflet.LayerGroup|null>(null),position=useRef<Leaflet.LayerGroup|null>(null);
 const [ready,setReady]=useState(false),[revision,setRevision]=useState(0),[tileError,setTileError]=useState(false);
 const selectRef=useRef(onSelect),boundsRef=useRef(onBounds);selectRef.current=onSelect;boundsRef.current=onBounds;
 useEffect(()=>{let disposed=false;
  import('leaflet').then(leaflet=>{if(disposed||!node.current)return;L.current=leaflet;
   const m=leaflet.map(node.current,{zoomControl:false,attributionControl:true,zoomSnap:.25,minZoom:4,maxZoom:19,worldCopyJump:false,maxBounds:[[30,-5],[54,30]],maxBoundsViscosity:.8,scrollWheelZoom:false});map.current=m;
   const tiles=leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',maxZoom:19,keepBuffer:1});
   tiles.on('tileerror',()=>setTileError(true));tiles.on('load',()=>{if(node.current?.querySelector('.leaflet-tile-loaded'))setTileError(false);});tiles.addTo(m);
   m.fitBounds([[35.45,6.4],[47.25,18.8]],{padding:[25,25],animate:false});
   layer.current=leaflet.layerGroup().addTo(m);position.current=leaflet.layerGroup().addTo(m);
   const update=()=>{const b=m.getBounds();boundsRef.current({north:b.getNorth(),south:b.getSouth(),east:b.getEast(),west:b.getWest(),zoom:m.getZoom()});setRevision(n=>n+1);};m.on('moveend',update);update();
   const resize=new ResizeObserver(()=>{if(node.current&&node.current.clientWidth>0&&node.current.clientHeight>0)m.invalidateSize();});resize.observe(node.current);(m as Leaflet.Map&{_pienoResize?:ResizeObserver})._pienoResize=resize;
   setReady(true);
  });
  return()=>{disposed=true;if(map.current){(map.current as Leaflet.Map&{_pienoResize?:ResizeObserver})._pienoResize?.disconnect();map.current.remove();map.current=null;}};
 },[]);
 useEffect(()=>{const m=map.current,l=L.current,g=layer.current;if(!ready||!m||!l||!g)return;g.clearLayers();
  const bounds=m.getBounds().pad(.08),zoom=m.getZoom(),cell=zoom<8?74:zoom<11?64:zoom<14?78:54;
  const buckets=new Map<string,Candidate[]>();
  for(const item of items){const s=item.station;if(!bounds.contains([s.lat,s.lng]))continue;const p=m.project([s.lat,s.lng],zoom);const key=zoom>=17?String(s.id):Math.floor(p.x/cell)+','+Math.floor(p.y/cell);const arr=buckets.get(key)||[];arr.push(item);buckets.set(key,arr);}
  for(const entries of buckets.values()){
   if(entries.length>1){let la=0,lo=0,min=Infinity;for(const e of entries){la+=e.station.lat;lo+=e.station.lng;min=Math.min(min,e.price.price);}la/=entries.length;lo/=entries.length;
    const active=entries.some(e=>e.station.id===selected);const label=entries.length>999?`${(entries.length/1000).toFixed(1).replace('.',',')}k`:String(entries.length);
    const icon=l.divIcon({className:'cluster-wrap',html:`<div class="map-cluster ${active?'is-selected':''}"><b>${label}</b>${zoom>7?`<small>da ${min.toFixed(3).replace('.',',')}</small>`:''}</div>`,iconSize:[zoom>7?70:48,zoom>7?52:48],iconAnchor:[zoom>7?35:24,zoom>7?26:24]});
    const marker=l.marker([la,lo],{icon,keyboard:true,title:`${entries.length} distributori: ingrandisci`,zIndexOffset:active?1000:0}).addTo(g);marker.on('click',()=>m.flyTo([la,lo],Math.min(19,zoom+2),{duration:.6}));
   }else{const {station:s,price:p}=entries[0];const cheap=average!==undefined && p.price<average;
    const icon=l.divIcon({className:'price-wrap',html:`<div class="map-price ${cheap?'cheap':''} ${s.id===selected?'is-selected':''}">${p.price.toFixed(3).replace('.',',')}</div>`,iconSize:[70,38],iconAnchor:[35,19]});
    const marker=l.marker([s.lat,s.lng],{icon,title:`${s.brand}, ${s.city}: ${p.price.toFixed(3)} euro`,zIndexOffset:s.id===selected?1500:cheap?500:0}).addTo(g);marker.on('click',()=>selectRef.current(s));
   }
  }
 },[items,average,selected,ready,revision]);
 useEffect(()=>{if(!ready||!map.current||!command)return;const m=map.current;if('italy'in command)m.flyToBounds([[35.45,6.4],[47.25,18.8]],{padding:[25,25],duration:.8});else if('bounds'in command)m.flyToBounds(command.bounds,{padding:[35,35],maxZoom:command.maxZoom,duration:.8});else m.flyTo([command.lat,command.lng],command.zoom,{duration:.8});},[command,ready]);
 useEffect(()=>{const l=L.current,g=position.current;if(!ready||!l||!g)return;g.clearLayers();if(location){l.circleMarker(location,{radius:9,color:'#fff',weight:3,fillColor:'#307aeb',fillOpacity:1}).addTo(g);l.circle(location,{radius:250,color:'#307aeb',weight:1,fillOpacity:.07}).addTo(g);}if(searchArea){const point:[number,number]=[searchArea.lat,searchArea.lng];l.circle(point,{radius:searchArea.radius*1000,color:'#657b3b',weight:1.5,dashArray:'5 6',fillColor:'#b6d47b',fillOpacity:.1,interactive:false}).addTo(g);l.circleMarker(point,{radius:7,color:'#fff',weight:3,fillColor:'#344821',fillOpacity:1,interactive:false}).addTo(g);}},[location,searchArea,ready]);
 return <div className="map-shell">
  <div ref={node} className="map" aria-label="Mappa interattiva dei distributori italiani" />
  <div className="map-top"><span className="map-tag"><span className="live-dot"/>{loading?'Caricamento dati…':'La tua prossima sosta'}</span><button className="map-italy" onClick={onReset}><Maximize2 size={14}/> Tutta Italia</button></div>
  <div className="map-controls"><span className="north">N<Compass size={22}/></span><div className="zoom-controls"><button aria-label="Ingrandisci mappa" onClick={()=>map.current?.zoomIn()}><Plus size={20}/></button><button aria-label="Riduci mappa" onClick={()=>map.current?.zoomOut()}><Minus size={20}/></button></div><button className="locate-map" aria-label="Trova la mia posizione" onClick={onLocate}><LocateFixed size={20}/></button></div>
  <div className="map-legend"><span><i/> Sotto la media</span><span><i/> Sopra la media</span></div>
  {offline&&<div className="map-offline"><MapPin size={26}/><strong>La mappa si prende una pausa.</strong><span>I listini salvati sono disponibili nell’elenco.<br/>La cartografia torna quando sei online.</span></div>}
  {tileError&&!offline&&<div className="map-error" role="status"><MapPin size={18}/> La cartografia è temporaneamente indisponibile. Puoi consultare tutti i prezzi nell’elenco.</div>}
  {!ready&&<div className="map-loading"><span className="spinner"/> Apriamo la mappa…</div>}
 </div>;
}
